import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "@/shared/i18n";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const localeCookieAttrs = {
  path: "/",
  maxAge: LOCALE_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
};

/** 不查帳號、不依賴 session：Cookie → Accept-Language → 預設。 */
export async function requestLocaleWithoutAccount(): Promise<Locale> {
  try {
    const jar = await cookies();
    const fromCookie = jar.get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) return fromCookie;
    const header = (await headers()).get("accept-language");
    return localeFromAcceptLanguage(header);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export type AccountLocaleRow = {
  locale: string | null;
  localeChosen: boolean;
  isDemo: boolean;
};

/** 曾自行切換過才回傳帳號語言；否則 null（UI 跟裝置）。 */
export function chosenAccountLocale(
  row: Pick<AccountLocaleRow, "locale" | "localeChosen" | "isDemo"> | null,
): Locale | null {
  if (!row || row.isDemo || !row.localeChosen) return null;
  return isLocale(row.locale) ? row.locale : null;
}

/**
 * 尚未自行選語言時，把當下裝置語言記成信件用的預設。
 * 不鎖定 UI；已選過或示範帳號不寫。
 */
export async function rememberInferredLocale(
  userId: string,
  known?: Pick<AccountLocaleRow, "locale" | "localeChosen" | "isDemo"> | null,
) {
  const row =
    known !== undefined
      ? known
      : await prisma.user.findUnique({
          where: { id: userId },
          select: { locale: true, localeChosen: true, isDemo: true },
        });
  if (!row || row.isDemo || row.localeChosen) return;
  const locale = await requestLocaleWithoutAccount();
  if (row.locale === locale) return;
  await prisma.user.update({
    where: { id: userId },
    data: { locale },
  });
}

/**
 * 寄信用語言。
 * 曾自行選擇 → 一定用帳號語言。
 * 尚未選擇：`request` 跟當下裝置（重設／驗證）；`default` 用推斷過的帳號語言（新留言，不能跟訪客）。
 */
export async function localeForMail(
  accountLocale: string | null | undefined,
  opts?: { chosen?: boolean; fallback?: "request" | "default" },
): Promise<Locale> {
  const fallback = opts?.fallback ?? "request";
  if (opts?.chosen && isLocale(accountLocale)) return accountLocale;
  if (!opts?.chosen && fallback === "default" && isLocale(accountLocale)) {
    return accountLocale;
  }
  if (fallback === "default") return DEFAULT_LOCALE;
  return requestLocaleWithoutAccount();
}
