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

/** 站內路徑加上 query（示範登入帶 guideHint 用） */
export function withSearchParam(path: string, key: string, value: string) {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const noHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const qIndex = noHash.indexOf("?");
  const pathname = qIndex >= 0 ? noHash.slice(0, qIndex) : noHash;
  const params = new URLSearchParams(qIndex >= 0 ? noHash.slice(qIndex + 1) : "");
  params.set(key, value);
  return `${pathname}?${params.toString()}${hash}`;
}
