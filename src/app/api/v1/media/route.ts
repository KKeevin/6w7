import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import {
  listMediaLibrary,
  uploadMediaAsset,
} from "@/services/page-media.service";
import { assertRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/shared/errors";
import { ASK_LIMITS } from "@/shared/tools";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    const library = await listMediaLibrary(userId);
    return jsonOk({ library });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    await assertRateLimit({
      key: `media-up:${userId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "media-upload",
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
    const asset = await uploadMediaAsset(userId, buffer);
    return jsonOk({ asset }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
