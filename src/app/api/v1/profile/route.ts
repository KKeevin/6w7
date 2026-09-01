import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import {
  getProfileForOwner,
  updateProfile,
} from "@/services/ask-link.service";
import { updateProfileSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await getProfileForOwner(userId, { mintSandbox: true });
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }
    const link = await updateProfile(userId, parsed.data);
    return jsonOk({ link });
  } catch (error) {
    return jsonError(error);
  }
}
