import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  makeTranslator,
  type Locale,
  type Translator,
} from "@/shared/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const header = (await headers()).get("accept-language");
  return localeFromAcceptLanguage(header);
}

export async function getT(): Promise<Translator> {
  return makeTranslator(await getRequestLocale());
}
