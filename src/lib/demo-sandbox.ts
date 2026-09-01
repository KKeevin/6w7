import { cookies } from "next/headers";
import { customAlphabet } from "nanoid";
import {
  DEMO_MEDIA_TTL_MS,
  DEMO_SANDBOX_COOKIE,
} from "@/shared/demo-account";

const createId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  22,
);

export function createDemoSandboxId() {
  return createId();
}

export function isValidDemoSandboxId(
  value: string | undefined | null,
): value is string {
  return Boolean(value && /^[A-Za-z0-9]{16,32}$/.test(value));
}

export function demoSandboxCookieOptions() {
  return {
    path: "/",
    maxAge: Math.floor(DEMO_MEDIA_TTL_MS / 1000),
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

/** RSC 可讀；沒有 cookie 就回 null（不寫入，避免 Server Component 設 cookie 失敗） */
export async function readDemoSandboxId(): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(DEMO_SANDBOX_COOKIE)?.value;
  return isValidDemoSandboxId(existing) ? existing : null;
}

/** 僅在 Route Handler／Server Action 呼叫：沒有就發新 cookie */
export async function getOrCreateDemoSandboxId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(DEMO_SANDBOX_COOKIE)?.value;
  const id = isValidDemoSandboxId(existing)
    ? existing
    : createDemoSandboxId();
  jar.set(DEMO_SANDBOX_COOKIE, id, demoSandboxCookieOptions());
  return id;
}
