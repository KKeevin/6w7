import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { saveProfileAvatar } from "@/lib/storage/avatar";
import { setUserImage } from "@/services/ask-link.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/shared/errors";
import { ASK_LIMITS } from "@/shared/tools";

export const runtime = "nodejs";

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
    if (!file || typeof file === "string") {
      throw new AppError("VALIDATION_ERROR", "請選擇圖片檔。", 400);
    }
    if (file.size > ASK_LIMITS.avatarMaxBytes) {
      throw new AppError("VALIDATION_ERROR", "頭貼原始檔請小於 10MB。", 400);
    }
    if (file.type && !file.type.startsWith("image/")) {
      throw new AppError("VALIDATION_ERROR", "僅支援圖片格式。", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let publicPath: string;
    try {
      ({ publicPath } = await saveProfileAvatar(userId, buffer));
    } catch (storageError) {
      console.error("avatar storage failed", storageError);
      throw new AppError("INTERNAL", "頭貼上傳失敗，請稍後再試。", 500);
    }
    // 必須保留 ?v=時間戳 寫入 DB，否則各裝置會共用無版本 URL 而卡在舊快取
    const user = await setUserImage(userId, publicPath);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
