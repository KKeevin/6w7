import { NextResponse, type NextRequest } from "next/server";
import {
  isLocale,
  localeFromAcceptLanguage,
  LOCALE_COOKIE,
} from "@/shared/i18n";

export function middleware(request: NextRequest) {
  if (isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const locale = localeFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  const res = NextResponse.next();
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
};
