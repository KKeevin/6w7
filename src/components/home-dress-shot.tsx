"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import { BRAND } from "@/shared/tools";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";

const DRESS_SHOT_SIZE = { width: 381, height: 824 } as const;

function PhoneShot({
  locale,
  alt,
  sizes,
  imgClassName,
  className,
}: {
  locale: keyof typeof BRAND.landingDressShotSrc;
  alt: string;
  sizes: string;
  imgClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.85rem] bg-[var(--ink)] p-[6px] shadow-[0_18px_42px_rgba(20,33,43,0.2)]",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.45rem] bg-[var(--bg)]">
        <Image
          key={locale}
          src={BRAND.landingDressShotSrc[locale]}
          alt={alt}
          width={DRESS_SHOT_SIZE.width}
          height={DRESS_SHOT_SIZE.height}
          className={
            imgClassName ?? "pointer-events-none h-auto w-full select-none"
          }
          sizes={sizes}
        />
      </div>
    </div>
  );
}

/** 首頁「把公開頁變成自己的」：縮小、微向左傾；點擊後直立放大 */
export function HomeDressShot() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useLockBodyScroll(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const alt = t("home.how2ShotAlt");

  return (
    <>
      <figure className="w-[min(11.5rem,46vw)] sm:translate-x-6">
        <div className="px-2 pb-1 pt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={t("home.how2ShotCaption")}
            className="-rotate-[7deg] block w-full cursor-zoom-in rounded-[1.85rem] outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5 hover:-rotate-[5deg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] active:scale-[0.98]"
          >
            <PhoneShot
              locale={locale}
              alt=""
              sizes="(min-width: 640px) 184px, 46vw"
            />
          </button>
        </div>
        <figcaption
          aria-hidden
          className="mt-1.5 text-center text-[11px] font-medium tracking-wide text-[var(--muted)]"
        >
          {t("home.how2ShotCaption")}
        </figcaption>
      </figure>
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden overscroll-none bg-[var(--ink)]/50 p-2 backdrop-blur-[3px] sm:p-3"
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <div
                className="animate-rise relative w-fit max-h-[96dvh] cursor-zoom-out"
                onClick={() => setOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-0 top-0 z-10 flex h-8 w-8 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--muted)] shadow-sm transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                  aria-label={t("common.close")}
                >
                  ✕
                </button>
                <PhoneShot
                  locale={locale}
                  alt={alt}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="w-fit max-h-[96dvh]"
                  imgClassName="pointer-events-none h-[min(94dvh,calc(100dvh-1.25rem))] w-auto max-w-[calc(100vw-1rem)] select-none object-contain"
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
