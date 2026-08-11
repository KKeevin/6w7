import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { saveProfileAvatar } from "@/lib/storage/avatar";
import { setUserImage } from "@/services/ask-link.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/shared/errors";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** 診斷用：確認正式環境儲存設定（不含密鑰） */
export async function GET() {
  let sharpStatus = "unknown";
  try {
    const sharp = (await import("sharp")).default;
    await sharp({
      create: { width: 1, height: 1, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();
    sharpStatus = "ok";
  } catch (e) {
    sharpStatus = e instanceof Error ? e.message : "fail";
  }

  return jsonOk({
    storageDriver: process.env.STORAGE_DRIVER ?? null,
    hasS3Bucket: Boolean(process.env.S3_BUCKET),
    hasS3Endpoint: Boolean(process.env.S3_ENDPOINT),
    hasS3Key: Boolean(process.env.S3_ACCESS_KEY_ID),
    hasS3Secret: Boolean(process.env.S3_SECRET_ACCESS_KEY),
    hasS3Public: Boolean(process.env.S3_PUBLIC_BASE_URL),
    sharp: sharpStatus,
  });
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    await assertRateLimit({
      key: `avatar:${userId}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "avatar",
    });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new AppError("VALIDATION_ERROR", "請選擇圖片檔。", 400);
    }
    if (file.size > MAX_BYTES) {
      throw new AppError("VALIDATION_ERROR", "圖片請小於 5MB。", 400);
    }
    const type = "type" in file ? String(file.type || "") : "";
    if (type && !type.startsWith("image/")) {
      throw new AppError("VALIDATION_ERROR", "僅支援圖片格式。", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let publicPath: string;
    try {
      ({ publicPath } = await saveProfileAvatar(userId, buffer));
    } catch (storageError) {
      console.error("avatar storage failed", storageError);
      const detail =
        storageError instanceof Error ? storageError.message : "unknown";
      throw new AppError("INTERNAL", `頭貼上傳失敗：${detail}`, 500);
    }
    const user = await setUserImage(userId, publicPath.split("?")[0]!);
    return jsonOk({
      user: { ...user, image: publicPath },
    });
  } catch (error) {
    return jsonError(error);
  }
}
