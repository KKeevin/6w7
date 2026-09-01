import { NextResponse } from "next/server";
import { purgeExpiredDemoMedia } from "@/services/page-media.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (secret) return auth === `Bearer ${secret}`;
  return process.env.NODE_ENV !== "production";
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 },
    );
  }
  const result = await purgeExpiredDemoMedia({ force: true });
  return NextResponse.json({ ok: true, ...result });
}
