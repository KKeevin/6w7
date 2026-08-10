import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { deleteMessage, updateMessage } from "@/services/message.service";
import { updateMessageSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }
    const message = await updateMessage(userId, id, parsed.data);
    return jsonOk({ message });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await deleteMessage(userId, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
