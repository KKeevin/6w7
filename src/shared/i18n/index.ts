import type { Locale } from "./config";
import type { MessageKey, Messages } from "./messages/zh-Hant";
import { zhHant } from "./messages/zh-Hant";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { ko } from "./messages/ko";
import { DEFAULT_LOCALE } from "./config";

export type { Locale, MessageKey, Messages };
export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  HTML_LANG,
  OG_LOCALE,
  DATE_BCP47,
  isLocale,
  localeFromAcceptLanguage,
} from "./config";

export const dictionaries: Record<Locale, Messages> = {
  "zh-Hant": zhHant,
  en,
  ja,
  ko,
};

export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const table = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const text = table[key] ?? dictionaries[DEFAULT_LOCALE][key];
  return interpolate(text, vars);
}

export type Translator = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

export function makeTranslator(locale: Locale): Translator {
  return (key, vars) => translate(locale, key, vars);
}
