import { jsonError, jsonOk } from "@/lib/api";
import { getClientIp } from "@/lib/fingerprint";
import { assertRateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/services/password-reset.service";
import { forgotPasswordSchema } from "@/shared/schemas";
import { zodAppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    await assertRateLimit({
      key: `forgot:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "forgot-password",
    });

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw zodAppError(parsed.error);
    }

    const identKey = parsed.data.identifier.trim().toLowerCase();
    await assertRateLimit({
      key: `forgot-id:${identKey}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "forgot-password-id",
    });

    const result = await requestPasswordReset(parsed.data.identifier);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
