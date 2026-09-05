import { NextResponse } from "next/server";
import { issueGameTicket } from "@/services/game-ticket.service";
import { AppError, errorBody } from "@/shared/errors";
import { getRequestLocale } from "@/lib/locale";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    return NextResponse.json(await issueGameTicket(request), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = error instanceof AppError ? error : new AppError("INTERNAL", "暫時無法建立連線，請稍後再試。", 503);
    return NextResponse.json(errorBody(safe, await getRequestLocale()), { status: safe.status, headers: { "Cache-Control": "no-store" } });
  }
}
