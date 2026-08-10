import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { reportMessage } from "@/services/message.service";
import { reportMessageSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";
import { assertRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await assertRateLimit({
      key: `report:${userId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "report",
    });

    const body = await request.json();
    const parsed = reportMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }

    const report = await reportMessage(userId, id, parsed.data.reason);
    return jsonOk({ report }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
