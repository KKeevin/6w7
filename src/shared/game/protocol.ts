import { z } from "zod";

export const BODY_TYPES = ["brawny", "muscle", "round", "wolf"] as const;
export const BODY_LABELS = { brawny: "胖壯熊", muscle: "壯熊", round: "胖熊", wolf: "狼系" } as const;
export const SKINS = ["#e9b78f", "#cb8c62", "#9a6248", "#f2ceb0"] as const;
export const SHORTS = ["#256f65", "#34445c", "#b65d48", "#777347"] as const;
export const appearanceSchema = z.object({
  body: z.enum(BODY_TYPES), skin: z.int().min(0).max(3),
  shorts: z.int().min(0).max(3), beard: z.boolean(),
}).strict();
export type Appearance = z.infer<typeof appearanceSchema>;
export const DEFAULT_APPEARANCE: Appearance = { body: "brawny", skin: 0, shorts: 0, beard: true };
export const roomIdSchema = z.string().regex(/^[a-zA-Z0-9_-]{9,24}$/);
export const ticketRequestSchema = z.object({
  roomId: roomIdSchema.optional(), appearance: appearanceSchema,
  pilotCode: z.string().max(128).optional(),
}).strict();
export const SCENES = ["home", "street", "garden"] as const;
export type Place = typeof SCENES[number];
export const PLACE_LABELS: Record<Place, string> = { home: "暖陽小屋", street: "散步街區", garden: "蘑菇林地" };
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), x: z.number().finite().min(-1).max(1), y: z.number().finite().min(-1).max(1) }).strict(),
  z.object({ type: z.literal("travel"), place: z.enum(SCENES) }).strict(),
  z.object({ type: z.literal("emote"), value: z.enum(["嗨！", "一起走？", "謝謝你", "好可愛", "💪"]) }).strict(),
  z.object({ type: z.literal("follow") }).strict(),
  z.object({ type: z.literal("rest") }).strict(),
  z.object({ type: z.literal("attack") }).strict(),
  z.object({ type: z.literal("allowFollow"), value: z.boolean() }).strict(),
]);
export type GameAction = z.infer<typeof actionSchema>;
export type Player = {
  id: string; name: string; appearance: Appearance; place: Place;
  x: number; y: number; facing: number; moving: boolean; sleeping: boolean;
  connected: boolean; emote: string; emoteUntil: number; stars: number;
};
export type Monster = { id: string; x: number; y: number; hp: number; respawnAt: number };
export type Snapshot = {
  selfId: string; ownerId: string; owner: Player; ownerReconnecting: boolean; allowFollow: boolean;
  players: Player[]; monsters: Monster[]; online: number; now: number;
};
export type Rect = { x: number; y: number; w: number; h: number };
export const WORLD = { width: 960, height: 720, speed: 175, tickMs: 50, maxPlayers: 4 } as const;
export const OBSTACLES: Record<Place, Rect[]> = {
  home: [{ x: 85, y: 210, w: 160, h: 170 }, { x: 650, y: 210, w: 195, h: 92 }, { x: 610, y: 455, w: 175, h: 70 }, { x: 390, y: 235, w: 115, h: 60 }],
  street: [{ x: 55, y: 140, w: 255, h: 170 }, { x: 625, y: 140, w: 270, h: 170 }, { x: 645, y: 465, w: 145, h: 45 }],
  garden: [{ x: 70, y: 190, w: 110, h: 85 }, { x: 760, y: 175, w: 105, h: 100 }, { x: 760, y: 510, w: 100, h: 80 }],
};
export function canStand(place: Place, x: number, y: number): boolean {
  return x >= 48 && x <= WORLD.width - 48 && y >= 180 && y <= WORLD.height - 48 &&
    !OBSTACLES[place].some(r => x > r.x - 14 && x < r.x + r.w + 14 && y > r.y - 10 && y < r.y + r.h + 10);
}
