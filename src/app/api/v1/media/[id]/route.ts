import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { deleteMediaAsset } from "@/services/page-media.service";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await assertRateLimit({
      key: `media-del:${userId}`,
      limit: 40,
      windowMs: 10 * 60 * 1000,
      windowLabel: "10 m",
      name: "media-delete",
    });
    const result = await deleteMediaAsset(userId, id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
