import { NextResponse } from "next/server";
import { AppError, errorBody } from "@/shared/errors";
import { auth } from "@/lib/auth";

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
  return session.user.id;
}
