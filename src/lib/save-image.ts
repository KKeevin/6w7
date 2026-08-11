/** 將 data URL 轉成 Blob */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  if (!header || data === undefined) {
    throw new Error("invalid data url");
  }
  const mime = /data:([^;]+);/.exec(header)?.[1] || "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function canShareFiles(file: File) {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    );
  } catch {
    return false;
  }
}

export type SaveImageResult =
  | { method: "share" }
  | { method: "download" }
  | { method: "new-tab" };

/**
 * 手機（尤其 iOS／IG 內建瀏覽器）常忽略 a[download]；
 * 優先 Web Share，其次 blob 下載，最後開新分頁長按存圖。
 */
export async function saveOrSharePng(
  dataUrl: string,
  filename: string,
): Promise<SaveImageResult> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], filename, { type: "image/png" });

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return { method: "share" };
    } catch (err) {
      // 使用者取消分享不算失敗
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
      // 繼續 fallback
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // iOS 對 download 常沒反應：補開新分頁讓使用者長按儲存
    if (isIos()) {
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      // 延遲 revoke，讓新分頁有時間載入
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      return { method: "new-tab" };
    }

    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    return { method: "download" };
  } catch {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    return { method: "new-tab" };
  }
}

export function saveImageHint(result: SaveImageResult): string | null {
  if (result.method === "new-tab") {
    return "已開啟圖片分頁：請長按圖片 → 加入照片／儲存圖像。";
  }
  if (result.method === "share") {
    return "可在分享選單選「儲存圖像」或存到照片。";
  }
  return null;
}
