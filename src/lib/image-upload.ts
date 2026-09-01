/** 上傳前的瀏覽器端圖片處理：擋掉過大的檔，其餘一律縮壓到 API 收得下的大小。 */

import { ASK_LIMITS } from "@/shared/tools";
import type { MessageKey, Translator } from "@/shared/i18n";

const MB = 1024 * 1024;

export const IMAGE_UPLOAD_MAX_MB = Math.round(
  ASK_LIMITS.imageUploadMaxBytes / MB,
);

export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export class ImageTooLargeError extends Error {
  readonly bytes: number;

  constructor(bytes: number) {
    super("upload.tooLarge");
    this.name = "ImageTooLargeError";
    this.bytes = bytes;
  }
}

export class ImageUploadError extends Error {
  readonly key: MessageKey;

  constructor(key: MessageKey) {
    super(key);
    this.name = "ImageUploadError";
    this.key = key;
  }
}

export function formatImageUploadError(
  error: unknown,
  t: Translator,
  fallback: string,
): string {
  if (error instanceof ImageTooLargeError) {
    return t("upload.tooLarge", {
      size: (error.bytes / MB).toFixed(1),
      max: IMAGE_UPLOAD_MAX_MB,
    });
  }
  if (error instanceof ImageUploadError) {
    return t(error.key);
  }
  return error instanceof Error ? error.message : fallback;
}

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decode(file: File, maxEdge?: number): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const full = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      const edge = Math.max(full.width, full.height);
      if (maxEdge && edge > maxEdge) {
        const scale = maxEdge / edge;
        const small = await createImageBitmap(full, {
          resizeWidth: Math.max(1, Math.round(full.width * scale)),
          resizeHeight: Math.max(1, Math.round(full.height * scale)),
          resizeQuality: "medium",
        });
        full.close();
        return {
          source: small,
          width: small.width,
          height: small.height,
          release: () => small.close(),
        };
      }
      return {
        source: full,
        width: full.width,
        height: full.height,
        release: () => full.close(),
      };
    } catch {
      // 少數瀏覽器對某些格式會失敗，改走 <img>
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function supportsWebp() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function render(decoded: Decoded, scale: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(decoded.width * scale));
  canvas.height = Math.max(1, Math.round(decoded.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function renamed(name: string, type: string) {
  const ext = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

/** 選檔當下的即時檢查；回傳要顯示的錯誤訊息，沒問題就回 null */
export function imageSelectionError(file: File, t: Translator): string | null {
  if (file.type && !file.type.startsWith("image/")) {
    return t("upload.notImage");
  }
  if (file.size > ASK_LIMITS.imageUploadMaxBytes) {
    return formatImageUploadError(new ImageTooLargeError(file.size), t, "");
  }
  return null;
}

/** 把畫布輸出成可直接上傳的檔（裁切結果用） */
export async function canvasToImageFile(
  canvas: HTMLCanvasElement,
  baseName: string,
  targetBytes = ASK_LIMITS.uploadTargetBytes,
): Promise<File> {
  const type = supportsWebp() ? "image/webp" : "image/png";
  const qualities = type === "image/png" ? [1] : [0.82, 0.68];

  let last: Blob | null = null;
  for (const quality of qualities) {
    const blob = await toBlob(canvas, type, quality);
    if (!blob) break;
    last = blob;
    if (blob.size <= targetBytes) break;
  }
  if (!last || last.size > targetBytes) {
    throw new ImageUploadError("upload.stillTooLarge");
  }
  return new File([last], renamed(baseName, type), { type });
}

type PrepareOptions = {
  /** 輸出最長邊（與伺服器輸出尺寸對齊） */
  maxEdge: number;
  targetBytes?: number;
};

/**
 * 回傳可以直接送 API 的檔案：
 * 超過 {@link ASK_LIMITS.imageUploadMaxBytes} 直接丟 {@link ImageTooLargeError}，
 * 其餘依需要縮到 maxEdge 並壓到 targetBytes 以內。
 */
export async function prepareImageUpload(
  file: File,
  { maxEdge, targetBytes = ASK_LIMITS.uploadTargetBytes }: PrepareOptions,
): Promise<File> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new ImageUploadError("upload.notImage");
  }
  if (file.size > ASK_LIMITS.imageUploadMaxBytes) {
    throw new ImageTooLargeError(file.size);
  }

  const decoded = await decode(file, maxEdge).catch(() => null);
  if (!decoded) {
    if (file.size > targetBytes) {
      throw new ImageUploadError("upload.unreadable");
    }
    return file;
  }

  try {
    const edge = Math.max(decoded.width, decoded.height);
    const fit = Math.min(1, maxEdge / edge);
    if (fit === 1 && file.size <= targetBytes) return file;

    const type = supportsWebp()
      ? "image/webp"
      : file.type === "image/png"
        ? "image/png"
        : "image/jpeg";

    // PNG 沒有 quality 可調，只能靠縮小尺寸
    const attempts: Array<{ scale: number; quality: number }> =
      type === "image/png"
        ? [
            { scale: fit, quality: 1 },
            { scale: fit * 0.7, quality: 1 },
          ]
        : [
            { scale: fit, quality: 0.8 },
            { scale: fit * 0.7, quality: 0.62 },
          ];

    let last: Blob | null = null;
    for (const attempt of attempts) {
      const canvas = render(decoded, attempt.scale);
      const blob = await toBlob(canvas, type, attempt.quality);
      if (!blob) break;
      last = blob;
      if (blob.size <= targetBytes) break;
    }

    if (!last) {
      if (file.size > targetBytes) {
        throw new ImageUploadError("upload.compressFailed");
      }
      return file;
    }
    if (last.size > targetBytes) {
      throw new ImageUploadError("upload.stillTooLarge");
    }
    if (last.size >= file.size && fit === 1) return file;

    return new File([last], renamed(file.name, type), { type });
  } finally {
    decoded.release();
  }
}

/** 上傳 API 的錯誤訊息；Vercel 在超過請求本文上限時會直接回 413（非 JSON） */
export async function uploadErrorMessage(
  res: Response,
  t: Translator,
  fallback: string,
) {
  if (res.status === 413) {
    return t("upload.payloadTooLarge");
  }
  const data = await res.json().catch(() => null);
  return data?.error?.message || fallback;
}
