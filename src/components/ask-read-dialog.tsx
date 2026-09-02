"use client";

import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/components/i18n-provider";
import { BRAND } from "@/shared/tools";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";

type Props = {
  open: boolean;
  onClose: () => void;
  body: string;
  topic?: string | null;
};

export function AskReadDialog({ open, onClose, body, topic }: Props) {
  const t = useT();
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden overscroll-none bg-[var(--ink)]/55 p-4 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-read-title"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="animate-rise relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#14212b] text-white shadow-[0_28px_70px_rgba(20,33,43,0.4)] sm:max-w-xl">
        <div
          className="pointer-events-none absolute -left-10 -top-12 h-48 w-48 rounded-full bg-[var(--mint)]/35 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-10 h-52 w-52 rounded-full bg-[var(--accent)]/30 blur-2xl"
          aria-hidden
        />

        <span
          className="pointer-events-none absolute left-3 top-6 select-none font-[family-name:var(--font-display)] text-6xl font-extrabold text-[var(--mint)]/35 sm:text-7xl"
          aria-hidden
        >
          𝟔
        </span>
        <span
          className="pointer-events-none absolute bottom-8 right-4 select-none font-[family-name:var(--font-display)] text-6xl font-extrabold text-[var(--accent)]/40 sm:text-7xl"
          aria-hidden
        >
          𝟕
        </span>
        <span
          className="pointer-events-none absolute right-5 top-16 select-none text-2xl opacity-80 sm:text-3xl"
          aria-hidden
        >
          <span className="meme-bob meme-bob-six">⁶</span>
          <span>🤷‍♀️</span>
          <span className="meme-bob meme-bob-seven">⁷</span>
        </span>
        <span
          className="pointer-events-none absolute bottom-1.5 left-2 z-0 select-none text-2xl opacity-80 sm:bottom-2 sm:left-3 sm:text-3xl"
          aria-hidden
        >
          <span className="meme-bob meme-bob-six">⁶</span>
          <span>🤷‍♂️</span>
          <span className="meme-bob meme-bob-seven">⁷</span>
        </span>

        <div className="relative z-10 flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
          <div className="min-w-0">
            <BrandLogo height={28} />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {t("story.anonAsk", { brand: BRAND.en })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <div className="relative z-10 mx-4 mb-5 overflow-hidden rounded-2xl bg-white sm:mx-6 sm:mb-6">
          <div className="flex">
            <div className="w-1.5 shrink-0 bg-[var(--accent)]" />
            <div className="min-w-0 flex-1 px-5 py-5 sm:px-6 sm:py-6">
              <h2
                id="ask-read-title"
                className="text-sm font-bold text-[var(--mint)]"
              >
                {topic ? t("story.topicPrefix", { topic }) : t("story.question")}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-[1.35rem] font-semibold leading-snug text-[var(--ink)] sm:text-[1.6rem] sm:leading-snug">
                {body}
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 px-5 pb-5 text-center text-[11px] font-medium text-white/50 sm:px-6">
          {t("story.brandFoot", { domain: BRAND.domain })}
        </p>
      </div>
    </div>
  );
}
