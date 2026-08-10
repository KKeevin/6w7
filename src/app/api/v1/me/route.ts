import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/db";
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
        name: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new AppError("NOT_FOUND", "找不到使用者。", 404);
    }
    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
