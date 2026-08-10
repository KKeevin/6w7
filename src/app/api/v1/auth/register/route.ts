import { jsonError, jsonOk } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/fingerprint";
import { registerUser } from "@/services/ask-link.service";
import { registerSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    await assertRateLimit({
      key: `register:${ip}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "register",
    });

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }

    const result = await registerUser(parsed.data);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
