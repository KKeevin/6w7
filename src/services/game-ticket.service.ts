import { timingSafeEqual, createHash } from "node:crypto";
import { assertRateLimit } from "@/lib/rate-limit";
import { getRequestFingerprintHash } from "@/lib/fingerprint";
import { AppError } from "@/shared/errors";
import { ticketRequestSchema } from "@/shared/game/protocol";
import { gameSecret, signTicket } from "@/shared/game/ticket";

export async function issueGameTicket(request: Request) {
  if (process.env.GAME_ENABLED !== "true") throw new AppError("NOT_FOUND", "封測連線尚未開放，可以先玩單人試玩。", 404);
  const origin = request.headers.get("origin");
  const expected = process.env.GAME_WEB_ORIGIN || new URL(request.url).origin;
  if (origin !== expected) throw new AppError("FORBIDDEN", "請從 6w7 遊戲頁面進入。", 403);
  if (process.env.NODE_ENV === "production" && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    throw new AppError("INTERNAL", "封測連線暫時無法使用。", 503);
  }
  await assertRateLimit({ name: "game-ticket", key: await getRequestFingerprintHash(), limit: 12, windowMs: 60000, windowLabel: "1 m" });
  // Enforce the real streamed body size, not just a client-supplied Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("BAD_REQUEST", "請重新選擇角色。", 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new AppError("BAD_REQUEST", "資料過大。", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let raw: unknown;
  try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new AppError("BAD_REQUEST", "資料格式不正確。", 400); }
  const parsed = ticketRequestSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR", "角色或邀請連結格式不正確。", 400);
  const code = process.env.GAME_PILOT_CODE;
  if (process.env.NODE_ENV === "production" && (!code || code.length < 12)) throw new AppError("INTERNAL", "封測連線尚未設定完成。", 503);
  if (code) {
    const hash = (s: string) => createHash("sha256").update(s).digest();
    if (!timingSafeEqual(hash(code), hash(parsed.data.pilotCode ?? ""))) throw new AppError("FORBIDDEN", "封測通關碼不正確。", 403);
  }
  return { ticket: signTicket(parsed.data.appearance, parsed.data.roomId ?? null, gameSecret()) };
}
