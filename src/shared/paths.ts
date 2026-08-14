import { DEMO_ENTER_PATH } from "@/shared/demo-account";

/** 只允許站內相對路徑，避免 open redirect */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://")) return fallback;
  return value;
}

export function loginPath(next?: string | null) {
  const target = safeInternalPath(next, "/dashboard");
  return `/login?next=${encodeURIComponent(target)}`;
}

export function demoEnterHref(next?: string | null) {
  const target = safeInternalPath(next, "/dashboard");
  return `${DEMO_ENTER_PATH}?next=${encodeURIComponent(target)}`;
}
