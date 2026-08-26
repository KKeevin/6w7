import { z } from "zod";
import { ASK_LIMITS } from "@/shared/tools";

export type PublicSticker = {
  id: string;
  assetId: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
};

export type MediaLibraryItem = {
  id: string;
  url: string;
  width: number;
  height: number;
  createdAt: string;
};

const prismaId = z.string().min(1).max(40);

export const stickerItemSchema = z.object({
  id: prismaId.optional(),
  assetId: prismaId,
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  scale: z
    .number()
    .min(ASK_LIMITS.stickerScaleMin)
    .max(ASK_LIMITS.stickerScaleMax),
  rotation: z.number().min(-360).max(360),
  zIndex: z.number().int().min(0).max(200),
});

export const saveStickersSchema = z.object({
  items: z.array(stickerItemSchema).max(ASK_LIMITS.stickerCanvasMax),
});

export const addStickerSchema = z.object({
  assetId: prismaId,
});

export function clampStickerScale(value: number) {
  return Math.min(
    ASK_LIMITS.stickerScaleMax,
    Math.max(ASK_LIMITS.stickerScaleMin, value),
  );
}

/** 收斂到 -180…180，避免連續旋轉超出 API 範圍 */
export function wrapRotation(deg: number) {
  const turned = ((((deg + 180) % 360) + 360) % 360) - 180;
  return Math.round(turned * 10) / 10;
}
