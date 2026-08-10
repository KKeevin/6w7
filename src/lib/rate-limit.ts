import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "@/shared/errors";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number } {
  const now = Date.now();
  const current = memoryStore.get(key);
  if (!current || current.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }
  current.count += 1;
  memoryStore.set(key, current);
  return { success: true, remaining: limit - current.count };
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(
  name: string,
  limit: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`,
) {
  const key = `${name}:${limit}:${window}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `6w7:${name}`,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

export async function assertRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  /** Upstash window 字串，例如 "1 m" */
  windowLabel: `${number} s` | `${number} m` | `${number} h` | `${number} d`;
  name?: string;
}) {
  const name = options.name ?? "default";

  if (hasUpstash()) {
    const result = await getUpstashLimiter(
      name,
      options.limit,
      options.windowLabel,
    ).limit(options.key);
    if (!result.success) {
      throw new AppError("RATE_LIMITED", "操作太頻繁，請稍後再試。", 429);
    }
    return;
  }

  const result = memoryLimit(options.key, options.limit, options.windowMs);
  if (!result.success) {
    throw new AppError("RATE_LIMITED", "操作太頻繁，請稍後再試。", 429);
  }
}
