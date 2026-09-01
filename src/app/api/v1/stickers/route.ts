import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import {
  addStickerFromAsset,
  listOwnerStickers,
  saveStickerLayout,
} from "@/services/page-media.service";
import {
  addStickerSchema,
  saveStickersSchema,
} from "@/shared/page-stickers";
import { assertRateLimit } from "@/lib/rate-limit";
import { AppError, zodAppError } from "@/shared/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = await listOwnerStickers(userId);
    return jsonOk(data);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    await assertRateLimit({
      key: `sticker-add:${userId}`,
      limit: 40,
      windowMs: 10 * 60 * 1000,
      windowLabel: "10 m",
      name: "sticker-add",
    });
    const body = await request.json();
    const parsed = addStickerSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "api.pickLibraryImage", 400);
    }
    const sticker = await addStickerFromAsset(userId, parsed.data.assetId);
    return jsonOk({ sticker }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    await assertRateLimit({
      key: `sticker-save:${userId}`,
      limit: 80,
      windowMs: 60 * 1000,
      windowLabel: "1 m",
      name: "sticker-save",
    });
    const body = await request.json();
    const parsed = saveStickersSchema.safeParse(body);
    if (!parsed.success) {
      throw zodAppError(parsed.error, "api.invalidLayout");
    }
    const stickers = await saveStickerLayout(userId, parsed.data);
    return jsonOk({ stickers });
  } catch (error) {
    return jsonError(error);
  }
}
