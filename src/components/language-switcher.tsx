"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { BRAND } from "@/shared/tools";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/shared/i18n";
import { useI18n } from "@/components/i18n-provider";
import { FooterCondensedText } from "@/components/footer-condensed-text";

const noopSubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function LanguagePickDialog({
  open,
  title,
  hint,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  hint?: string;
  onPick: (locale: Locale) => void;
  onClose?: () => void;
}) {
  const { locale, pending, t } = useI18n();
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="animate-rise w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]">
        <div className="h-1.5 bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]" />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--mint)]">
              {BRAND.en.toUpperCase()}
            </p>
            <h2
              id="lang-dialog-title"
              className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ink)]"
            >
              {title}
            </h2>
            {hint ? (
              <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              aria-label={t("common.close")}
            >
              ✕
            </button>
          ) : null}
        </div>
        <ul className="flex flex-col gap-1 px-3 pb-4">
          {LOCALES.map((code) => {
            const current = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onPick(code)}
                  aria-current={current ? "true" : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    current
                      ? "bg-[var(--mint)]/12 text-[var(--ink)]"
                      : "text-[var(--ink)] hover:bg-[var(--surface)]"
                  } disabled:opacity-60`}
                >
                  <span>{LOCALE_LABELS[code]}</span>
                  {current ? (
                    <Check
                      className="h-4 w-4 text-[var(--mint)]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  function pick(next: Locale) {
    setOpen(false);
    setLocale(next);
  }

  return (
    <>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[length:inherit] leading-[inherit] hover:text-[var(--ink)]"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <FooterCondensedText>{t("lang.label")}</FooterCondensedText>
      </button>
      <LanguagePickDialog
        open={open}
        title={t("lang.pickTitle")}
        onPick={pick}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
