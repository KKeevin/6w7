import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db";
import { putPublicObject } from "@/lib/storage/object-store";
import { DEMO_MEDIA_TTL_MS } from "@/shared/demo-account";
import type { PublicSticker } from "@/shared/page-stickers";
import { ASK_LIMITS } from "@/shared/tools";

export type DemoSandboxOverlay = {
  prompt?: string;
  title?: string;
  acceptingMessages?: boolean;
  avatarUrl?: string;
  avatarAssetId?: string;
  stickers: PublicSticker[];
};

const REDIS_PREFIX = "6w7:demo-sandbox:";
const TTL_SEC = Math.floor(DEMO_MEDIA_TTL_MS / 1000);
const AVATAR_KEY_MARK = "sandbox-av-";

type MemoryRow = { overlay: DemoSandboxOverlay; expiresAt: number };

const memory = globalThis as unknown as {
  __6w7DemoSandbox?: Map<string, MemoryRow>;
};

function memoryStore() {
  if (!memory.__6w7DemoSandbox) {
    memory.__6w7DemoSandbox = new Map();
  }
  return memory.__6w7DemoSandbox;
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function redis() {
  return Redis.fromEnv();
}

function emptyOverlay(): DemoSandboxOverlay {
  return { stickers: [] };
}

function normalizeOverlay(raw: unknown): DemoSandboxOverlay {
  if (!raw || typeof raw !== "object") return emptyOverlay();
  const value = raw as Record<string, unknown>;
  const stickers = Array.isArray(value.stickers)
    ? value.stickers.filter(isPublicSticker)
    : [];
  return {
    prompt: typeof value.prompt === "string" ? value.prompt : undefined,
    title: typeof value.title === "string" ? value.title : undefined,
    acceptingMessages:
      typeof value.acceptingMessages === "boolean"
        ? value.acceptingMessages
        : undefined,
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : undefined,
    avatarAssetId:
      typeof value.avatarAssetId === "string" ? value.avatarAssetId : undefined,
    stickers,
  };
}

function isPublicSticker(item: unknown): item is PublicSticker {
  if (!item || typeof item !== "object") return false;
  const row = item as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.assetId === "string" &&
    typeof row.url === "string" &&
    typeof row.x === "number" &&
    typeof row.y === "number" &&
    typeof row.scale === "number" &&
    typeof row.rotation === "number" &&
    typeof row.zIndex === "number"
  );
}

export async function getDemoSandboxOverlay(
  sandboxId: string,
): Promise<DemoSandboxOverlay> {
  if (hasUpstash()) {
    const data = await redis().get<unknown>(`${REDIS_PREFIX}${sandboxId}`);
    if (data == null) return emptyOverlay();
    await redis().expire(`${REDIS_PREFIX}${sandboxId}`, TTL_SEC);
    return normalizeOverlay(data);
  }

  const now = Date.now();
  const store = memoryStore();
  const row = store.get(sandboxId);
  if (!row || row.expiresAt <= now) {
    store.delete(sandboxId);
    return emptyOverlay();
  }
  row.expiresAt = now + DEMO_MEDIA_TTL_MS;
  store.set(sandboxId, row);
  return normalizeOverlay(row.overlay);
}

export async function setDemoSandboxOverlay(
  sandboxId: string,
  overlay: DemoSandboxOverlay,
): Promise<DemoSandboxOverlay> {
  const next = normalizeOverlay(overlay);
  if (hasUpstash()) {
    await redis().set(`${REDIS_PREFIX}${sandboxId}`, next, { ex: TTL_SEC });
    return next;
  }
  memoryStore().set(sandboxId, {
    overlay: next,
    expiresAt: Date.now() + DEMO_MEDIA_TTL_MS,
  });
  return next;
}

export async function patchDemoSandboxOverlay(
  sandboxId: string,
  patch: Partial<DemoSandboxOverlay>,
): Promise<DemoSandboxOverlay> {
  const current = await getDemoSandboxOverlay(sandboxId);
  return setDemoSandboxOverlay(sandboxId, {
    ...current,
    ...patch,
    stickers: patch.stickers ?? current.stickers,
  });
}

function liveMediaWhere() {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export function demoLibraryWhere(userId: string, sandboxId: string) {
  return {
    userId,
    sandboxId,
    NOT: { objectKey: { contains: AVATAR_KEY_MARK } },
    ...liveMediaWhere(),
  };
}

export function demoAssetWhere(userId: string, sandboxId: string) {
  return {
    userId,
    sandboxId,
    ...liveMediaWhere(),
  };
}

export async function hydrateDemoSandboxOverlay(
  userId: string,
  sandboxId: string,
): Promise<DemoSandboxOverlay> {
  const overlay = await getDemoSandboxOverlay(sandboxId);
  const assetIds = [
    ...new Set([
      ...overlay.stickers.map((item) => item.assetId),
      ...(overlay.avatarAssetId ? [overlay.avatarAssetId] : []),
    ]),
  ];
  if (assetIds.length === 0) return overlay;

  const live = await prisma.mediaAsset.findMany({
    where: {
      userId,
      sandboxId,
      id: { in: assetIds },
      ...liveMediaWhere(),
    },
    select: { id: true, url: true },
  });
  const urlById = new Map(live.map((row) => [row.id, row.url]));
  const stickers = overlay.stickers
    .filter((item) => urlById.has(item.assetId))
    .map((item) => ({ ...item, url: urlById.get(item.assetId) as string }));

  let avatarUrl = overlay.avatarUrl;
  let avatarAssetId = overlay.avatarAssetId;
  if (avatarAssetId && !urlById.has(avatarAssetId)) {
    avatarUrl = undefined;
    avatarAssetId = undefined;
  }

  const next: DemoSandboxOverlay = {
    ...overlay,
    stickers,
    avatarUrl,
    avatarAssetId,
  };
  if (
    stickers.length !== overlay.stickers.length ||
    overlay.avatarAssetId !== avatarAssetId
  ) {
    await setDemoSandboxOverlay(sandboxId, next);
  }
  return next;
}

export async function saveDemoSandboxAvatar(
  userId: string,
  sandboxId: string,
  input: Buffer,
): Promise<{ publicPath: string }> {
  const sharp = (await import("sharp")).default;
  const png = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(512, 512, { fit: "cover", position: "center" })
    .png({ compressionLevel: 8 })
    .toBuffer();

  const objectKey = `stickers/${userId}/${AVATAR_KEY_MARK}${sandboxId}.png`;
  const { publicUrl } = await putPublicObject(objectKey, png, "image/png");
  const publicPath = publicUrl;

  const existing = await prisma.mediaAsset.findMany({
    where: { userId, sandboxId, objectKey },
    select: { id: true },
  });

  const asset =
    existing[0] != null
      ? await prisma.mediaAsset.update({
          where: { id: existing[0].id },
          data: {
            url: publicPath,
            width: 512,
            height: 512,
            bytes: png.length,
            expiresAt: new Date(Date.now() + DEMO_MEDIA_TTL_MS),
          },
          select: { id: true },
        })
      : await prisma.mediaAsset.create({
          data: {
            userId,
            sandboxId,
            objectKey,
            url: publicPath,
            width: 512,
            height: 512,
            bytes: png.length,
            expiresAt: new Date(Date.now() + DEMO_MEDIA_TTL_MS),
          },
          select: { id: true },
        });

  await patchDemoSandboxOverlay(sandboxId, {
    avatarUrl: publicPath,
    avatarAssetId: asset.id,
  });

  return { publicPath };
}

export function clampDemoStickerCount(stickers: PublicSticker[]) {
  if (stickers.length <= ASK_LIMITS.stickerCanvasMax) return stickers;
  return stickers.slice(0, ASK_LIMITS.stickerCanvasMax);
}
