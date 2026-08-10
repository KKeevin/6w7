import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { saveProfileAvatar } from "@/lib/storage/avatar";
import { setUserImage } from "@/services/ask-link.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/shared/errors";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

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
    if (!(file instanceof File)) {
      throw new AppError("VALIDATION_ERROR", "請選擇圖片檔。", 400);
    }
    if (file.size > MAX_BYTES) {
      throw new AppError("VALIDATION_ERROR", "圖片請小於 5MB。", 400);
    }
    if (!file.type.startsWith("image/")) {
      throw new AppError("VALIDATION_ERROR", "僅支援圖片格式。", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicPath } = await saveProfileAvatar(userId, buffer);
    const user = await setUserImage(userId, publicPath.split("?")[0]!);
    return jsonOk({
      user: { ...user, image: publicPath },
    });
  } catch (error) {
    return jsonError(error);
  }
}
