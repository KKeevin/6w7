// Server-only module: never import from a client component.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { appearanceSchema, roomIdSchema, type Appearance } from "./protocol";

export const DEV_GAME_SECRET = "6w7-development-only-game-secret-do-not-deploy";
const claimsSchema = z.object({
  v: z.literal(1), nonce: z.string().uuid(), exp: z.number().int(),
  roomId: roomIdSchema.nullable(), appearance: appearanceSchema,
}).strict();
export type TicketClaims = z.infer<typeof claimsSchema>;
export function gameSecret() {
  const secret = process.env.GAME_TICKET_SECRET;
  if (secret && secret.length >= 32 && secret !== DEV_GAME_SECRET) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("GAME_TICKET_SECRET must have at least 32 characters");
  return DEV_GAME_SECRET;
}
export function signTicket(appearance: Appearance, roomId: string | null, secret: string, now = Date.now()) {
  const claims: TicketClaims = { v: 1, nonce: randomUUID(), exp: now + 60000, appearance, roomId };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
export function verifyTicket(value: unknown, secret: string, now = Date.now()): TicketClaims {
  if (typeof value !== "string" || value.length > 2048) throw new Error("INVALID_TICKET");
  const parts = value.split(".");
  if (parts.length !== 2) throw new Error("INVALID_TICKET");
  const expected = createHmac("sha256", secret).update(parts[0]).digest();
  const received = Buffer.from(parts[1], "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new Error("INVALID_TICKET");
  const claims = claimsSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")));
  if (claims.exp <= now || claims.exp > now + 65000) throw new Error("EXPIRED_TICKET");
  return claims;
}
