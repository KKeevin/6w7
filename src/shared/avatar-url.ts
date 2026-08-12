/**
 * 頭貼顯示用 URL。
 * 檔案路徑固定為 …/profile.png，必須靠 ?v= 破快取；
 * 不可用固定的 userId 當版本，否則換圖後舊瀏覽器會一直顯示舊頭貼。
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

  if (/^https?:\/\//i.test(image)) {
    try {
      const u = new URL(image);
      if (version) u.searchParams.set("v", version);
      return u.toString();
    } catch {
      return image;
    }
  }

  const qIndex = image.indexOf("?");
  const path = qIndex === -1 ? image : image.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? "" : image.slice(qIndex + 1));
  if (version) params.set("v", version);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
