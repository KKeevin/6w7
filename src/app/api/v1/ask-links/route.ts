import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { getProfileForOwner, updateProfile } from "@/services/ask-link.service";
import { updateProfileSchema } from "@/shared/schemas";
import { AppError, zodAppError } from "@/shared/errors";

/** 相容：改為回傳唯一個人連結 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await getProfileForOwner(userId, { mintSandbox: true });
    return jsonOk({ links: [profile.link], profile });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST() {
  return jsonError(
    new AppError("BAD_REQUEST", "api.singleLink", 400),
  );
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
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
