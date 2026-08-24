import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/db";
import { updateAccountEmail } from "@/services/account-email.service";
import { updateEmailSchema } from "@/shared/schemas";
import { AppError } from "@/shared/errors";

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError("NOT_FOUND", "找不到使用者。", 404);
    }
    return jsonOk({
      user: {
        ...user,
        emailVerified: Boolean(user.emailVerified),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = updateEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "輸入無效",
        400,
      );
    }
    const result = await updateAccountEmail(userId, parsed.data.email);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
