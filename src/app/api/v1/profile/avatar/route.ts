import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { saveProfileAvatar } from "@/lib/storage/avatar";
import { getOrCreateDemoSandboxId } from "@/lib/demo-sandbox";
import { saveDemoSandboxAvatar } from "@/services/demo-sandbox.service";
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
      throw new AppError("VALIDATION_ERROR", "api.pickImage", 400);
    }
    if (file.size > ASK_LIMITS.imageUploadMaxBytes) {
      throw new AppError("VALIDATION_ERROR", "api.imageTooLarge", 400);
    }
    if (file.type && !file.type.startsWith("image/")) {
      throw new AppError("VALIDATION_ERROR", "api.imageType", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const account = await prisma.user.findUnique({
      where: { id: userId },
      select: { isDemo: true, username: true },
    });
    if (!account) {
      throw new AppError("UNAUTHORIZED", "api.loginRequired", 401);
    }

    if (account.isDemo) {
      try {
        const sandboxId = await getOrCreateDemoSandboxId();
        const { publicPath } = await saveDemoSandboxAvatar(
          userId,
          sandboxId,
          buffer,
        );
        return jsonOk({
          user: {
            id: userId,
            username: account.username,
            image: publicPath,
          },
        });
      } catch (storageError) {
        console.error("avatar storage failed", storageError);
        throw new AppError("INTERNAL", "api.avatarFailed", 500);
      }
    }

    let publicPath: string;
    try {
      ({ publicPath } = await saveProfileAvatar(userId, buffer));
    } catch (storageError) {
      console.error("avatar storage failed", storageError);
      throw new AppError("INTERNAL", "api.avatarFailed", 500);
    }
    // 必須保留 ?v=時間戳 寫入 DB，否則各裝置會共用無版本 URL 而卡在舊快取
    const user = await setUserImage(userId, publicPath);
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
