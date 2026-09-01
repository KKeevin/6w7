import { z } from "zod";
import { ASK_LIMITS } from "./tools";
import { isValidUsername, normalizeUsername } from "./slug";
import type { PublicSticker } from "./page-stickers";

export const usernameSchema = z
  .string()
  .trim()
  .transform((v) => normalizeUsername(v))
  .refine(isValidUsername, {
    message: "api.invalidUsername",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: "api.invalidEmail",
  });

export const registerSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "api.passwordMin").max(72),
  name: z.string().trim().min(1).max(40).optional(),
  email: emailSchema.optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "api.identifierRequired")
    .max(120),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(16, "api.resetExpired").max(200),
  password: z.string().min(8, "api.passwordMin").max(72),
});

export const updateEmailSchema = z.object({
  email: z
    .union([emailSchema, z.literal("")])
    .nullable()
    .transform((value) => (value ? value : null)),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8, "api.passwordMin").max(72),
});

/** 更新人設（bio／prompt），覆蓋舊內容 */
export const updateProfileSchema = z.object({
  prompt: z.string().trim().min(1).max(ASK_LIMITS.promptMax).optional(),
  title: z.string().trim().min(1).max(ASK_LIMITS.titleMax).optional(),
  acceptingMessages: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(ASK_LIMITS.bodyMin, "api.bodyRequired")
    .max(ASK_LIMITS.bodyMax, "api.bodyMax"),
  topic: z.string().trim().min(1).max(20).optional(),
});

export const updateMessageSchema = z.object({
  isRead: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  status: z.enum(["visible", "hidden", "deleted"]).optional(),
});

export const reportMessageSchema = z.object({
  reason: z.string().trim().min(2).max(200),
});

export type PublicAskLink = {
  slug: string;
  title: string;
  prompt: string;
  acceptingMessages: boolean;
  requireTopic: boolean;
  topics: string[];
  image: string | null;
  displayName: string | null;
  stickers: PublicSticker[];
};
