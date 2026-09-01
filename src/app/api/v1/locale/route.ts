import { NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/shared/i18n";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const locale =
    body && typeof body === "object" && "locale" in body
      ? String((body as { locale: unknown }).locale)
      : "";

  if (!isLocale(locale)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Unsupported locale" } },
      { status: 400 },
    );
  }

  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
