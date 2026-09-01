"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  isLocale,
  makeTranslator,
  type Locale,
  type Translator,
} from "@/shared/i18n";

type LocaleContextValue = {
  locale: Locale;
  t: Translator;
  setLocale: (next: Locale) => void;
  pending: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useMemo(() => makeTranslator(locale), [locale]);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    void (async () => {
      const res = await fetch("/api/v1/locale");
      const data = (await res.json().catch(() => null)) as {
        locale?: string;
        chosen?: boolean;
      } | null;
      if (!data?.chosen || !isLocale(data.locale) || data.locale === locale) {
        return;
      }
      router.refresh();
    })();
  }, [locale, router]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      startTransition(() => {
        void (async () => {
          await fetch("/api/v1/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: next }),
          });
          router.refresh();
        })();
      });
    },
    [locale, router],
  );

  const value = useMemo(
    () => ({ locale, t, setLocale, pending }),
    [locale, t, setLocale, pending],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
}

export function useT(): Translator {
  return useI18n().t;
}
