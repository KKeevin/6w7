import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api";
import { getClientIp } from "@/lib/fingerprint";
import { assertRateLimit } from "@/lib/rate-limit";
import { verifyEmailWithToken } from "@/services/account-email.service";
import { AppError } from "@/shared/errors";

const schema = z.object({
  token: z.string().trim().min(16).max(200),
});

export async function POST(request: Request) {
  try {
    const ip = await getClientIp();
    await assertRateLimit({
      key: `verify-email-token:${ip}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "verify-email-token",
    });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "api.verifyExpired", 400);
    }

    const result = await verifyEmailWithToken(parsed.data.token);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
