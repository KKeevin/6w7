import { jsonError, jsonOk } from "@/lib/api";
import { getClientIp } from "@/lib/fingerprint";
import { assertRateLimit } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/services/password-reset.service";
import { resetPasswordSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    await assertRateLimit({
      key: `reset:${ip}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "reset-password",
    });

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }

    const result = await resetPasswordWithToken(
      parsed.data.token,
      parsed.data.password,
    );
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
