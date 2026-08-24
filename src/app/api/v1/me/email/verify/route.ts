import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { getClientIp } from "@/lib/fingerprint";
import { assertRateLimit } from "@/lib/rate-limit";
import { requestEmailVerification } from "@/services/account-email.service";

export async function POST() {
  try {
    const userId = await requireUserId();
    const ip = await getClientIp();
    await assertRateLimit({
      key: `verify-email:${userId}:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "verify-email",
    });
    const result = await requestEmailVerification(userId);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
