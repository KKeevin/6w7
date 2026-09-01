import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { updateProfile } from "@/services/ask-link.service";
import { updateProfileSchema } from "@/shared/schemas";
import { zodAppError } from "@/shared/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    await params; // id 忽略：每人僅一條，以 userId 更新
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw zodAppError(parsed.error);
    }
    const link = await updateProfile(userId, parsed.data);
    return jsonOk({ link });
  } catch (error) {
    return jsonError(error);
  }
}
