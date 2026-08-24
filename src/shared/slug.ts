import { customAlphabet } from "nanoid";
import { ASK_LIMITS } from "@/shared/tools";

/** 根路徑保留字，不可當 username */
export const RESERVED_SLUGS = new Set([
  "api",
  "login",
  "forgot-password",
  "reset-password",
  "verify-email",
  "dashboard",
  "inbox",
  "settings",
  "tools",
  "legal",
  "about",
  "contact",
  "demo",
  "a",
  "auth",
  "me",
  "uploads",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/**
 * Instagram 風格 username：
 * 1–30 字、英數．底線、不可開頭結尾為點、不可連續點
 */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function isValidUsername(username: string): boolean {
  if (username.length < 1 || username.length > 30) return false;
  if (!/^[a-z0-9._]+$/.test(username)) return false;
  if (username.startsWith(".") || username.endsWith(".")) return false;
  if (username.includes("..")) return false;
  if (isReservedSlug(username)) return false;
  return true;
}

/** @deprecated 隨機 slug 已停用；保留給舊資料相容讀取 */
export function isValidSlugFormat(slug: string): boolean {
  if (isValidUsername(slug)) return true;
  if (slug.length < 4 || slug.length > 12) return false;
  if (!/^[a-z0-9-]+$/.test(slug)) return false;
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) {
    return false;
  }
  return /[a-z0-9]/.test(slug);
}

const genAlnum = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  ASK_LIMITS.slugLength,
);

/** 僅內部測試用；正式連結一律用 username */
export function generateSlugCandidate(): string {
  return genAlnum();
}
