export const LOCALES = ["zh-Hant", "en", "ja", "ko"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-Hant";

export const LOCALE_COOKIE = "6w7_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-Hant": "繁體中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

export const HTML_LANG: Record<Locale, string> = {
  "zh-Hant": "zh-Hant",
  en: "en",
  ja: "ja",
  ko: "ko",
};

export const OG_LOCALE: Record<Locale, string> = {
  "zh-Hant": "zh_TW",
  en: "en_US",
  ja: "ja_JP",
  ko: "ko_KR",
};

export const DATE_BCP47: Record<Locale, string> = {
  "zh-Hant": "zh-TW",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** 從 Accept-Language 挑一個支援的語言；沒有就繁中 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    if (tag.startsWith("zh")) return "zh-Hant";
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
