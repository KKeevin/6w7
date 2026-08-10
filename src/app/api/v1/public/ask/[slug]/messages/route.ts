import { jsonError, jsonOk } from "@/lib/api";
import { createPublicMessage } from "@/services/message.service";
import { createMessageSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp, getRequestFingerprintHash } from "@/lib/fingerprint";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const ip = await getClientIp();
    const fingerprintHash = await getRequestFingerprintHash();

    await assertRateLimit({
      key: `public-msg:${ip}`,
      limit: 5,
      windowMs: 60 * 1000,
      windowLabel: "1 m",
      name: "public-msg-min",
    });
    await assertRateLimit({
      key: `public-msg-hour:${fingerprintHash}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "public-msg-hour",
    });
    await assertRateLimit({
      key: `public-msg-day:${fingerprintHash}:${slug}`,
      limit: 30,
      windowMs: 24 * 60 * 60 * 1000,
      windowLabel: "1 d",
      name: "public-msg-day",
    });

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }

    const message = await createPublicMessage(
      slug,
      parsed.data,
      fingerprintHash,
    );
    return jsonOk({ message }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
