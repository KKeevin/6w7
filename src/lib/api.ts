import { NextResponse } from "next/server";
import { AppError, errorBody } from "@/shared/errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(errorBody(error), { status: error.status });
  }
  console.error(error);
  return NextResponse.json(errorBody(new Error("internal")), { status: 500 });
}

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "請先登入。", 401);
  }

  // JWT session 不會在帳號被停權後自動失效；每次保護性 API 請求都要
  // 回查帳號狀態，避免既有 session 繼續讀寫資料。
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!user || user.status !== "active") {
    throw new AppError("UNAUTHORIZED", "請先登入。", 401);
  }
  return session.user.id;
}
