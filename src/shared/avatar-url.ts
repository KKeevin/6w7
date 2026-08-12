/**
 * 頭貼顯示用 URL。
 * 檔案路徑固定為 …/profile.png，必須靠 ?v= 破快取；
 * 不可用固定的 userId 當版本，否則換圖後舊瀏覽器會一直顯示舊頭貼。
 *
 * 若設定了 S3_PUBLIC_BASE_URL（例如 https://cdn.6w7.link），
 * 會把舊的 r2.dev／其他 host 上的 /avatars/… 改寫成目前公開網域。
 */
export function avatarDisplayUrl(
  image: string | null | undefined,
  bust?: string | number | Date | null,
): string | null {
  if (!image) return null;

  const version =
    bust instanceof Date
      ? String(bust.getTime())
      : bust != null && String(bust) !== ""
        ? String(bust)
        : null;

  let resolved = image;

  if (/^https?:\/\//i.test(image)) {
    try {
      const u = new URL(image);
      rewriteAvatarHost(u);
      if (version) u.searchParams.set("v", version);
      return u.toString();
    } catch {
      resolved = image;
    }
  }

  const qIndex = resolved.indexOf("?");
  const path = qIndex === -1 ? resolved : resolved.slice(0, qIndex);
  const params = new URLSearchParams(
    qIndex === -1 ? "" : resolved.slice(qIndex + 1),
  );
  if (version) params.set("v", version);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

/** 將 /avatars/… 絕對網址改寫到目前的 S3_PUBLIC_BASE_URL */
function rewriteAvatarHost(u: URL) {
  if (!u.pathname.includes("/avatars/")) return;

  const raw = process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (!raw) return;

  let base = raw;
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

  try {
    const publicBase = new URL(base);
    if (u.origin === publicBase.origin) return;
    u.protocol = publicBase.protocol;
    u.host = publicBase.host;
  } catch {
    /* ignore bad env */
  }
}
