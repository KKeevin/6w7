import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  chosenAccountLocale,
  localeCookieAttrs,
  rememberInferredLocale,
  requestLocaleWithoutAccount,
} from "@/lib/account-locale";
import { AppError } from "@/shared/errors";
import { isLocale, LOCALE_COOKIE } from "@/shared/i18n";

/** 登入後把 Cookie 對齊「曾自行選擇」的帳號語言；尚未選擇則只記住裝置語言供信件用。 */
export async function GET() {
  try {
    const device = await requestLocaleWithoutAccount();
    const session = await auth();
    if (!session?.user?.id || session.user.isDemo) {
      return jsonOk({ locale: device, chosen: false });
    }

    const row = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true, localeChosen: true, isDemo: true },
    });
    const chosen = chosenAccountLocale(row);
    if (chosen) {
      const res = jsonOk({ locale: chosen, chosen: true });
      res.cookies.set(LOCALE_COOKIE, chosen, localeCookieAttrs);
      return res;
    }

    await rememberInferredLocale(session.user.id, row);
    return jsonOk({ locale: device, chosen: false });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("BAD_REQUEST", "api.invalidJson", 400);
    }

    const locale =
      body && typeof body === "object" && "locale" in body
        ? String((body as { locale: unknown }).locale)
        : "";

    if (!isLocale(locale)) {
      throw new AppError("VALIDATION_ERROR", "api.unsupportedLocale", 400);
    }

    const session = await auth();
    if (session?.user?.id && !session.user.isDemo) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { locale, localeChosen: true },
      });
    }

    const res = jsonOk({ ok: true, locale, chosen: true });
    res.cookies.set(LOCALE_COOKIE, locale, localeCookieAttrs);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
