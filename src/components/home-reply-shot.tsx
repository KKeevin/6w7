"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { StoryCard, STORY_CARD_SIZE } from "@/components/story-card";
import { useI18n } from "@/components/i18n-provider";
import { getDemoPrompt } from "@/shared/demo-account";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";

/** 清單縮圖寬約 11.5rem，與 03 分享圖卡同一套 scale 包 1080×1920 */
const THUMB_SCALE = 184 / STORY_CARD_SIZE.width;

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.85rem] bg-[var(--ink)] p-[6px] shadow-[0_18px_42px_rgba(20,33,43,0.2)]">
      <div className="overflow-hidden rounded-[1.45rem] bg-[var(--bg)]">
        {children}
      </div>
    </div>
  );
}

function ScaledReplyCard({ scale }: { scale: number }) {
  const { t, locale } = useI18n();
  return (
    <div
      className="overflow-hidden"
      style={{
        width: STORY_CARD_SIZE.width,
        height: STORY_CARD_SIZE.height,
        zoom: scale,
      }}
    >
      <StoryCard
        body={t("home.sample1")}
        reply={t("home.how6Reply")}
        linkTitle={getDemoPrompt(locale)}
      />
    </div>
  );
}

function lightboxScale() {
  if (typeof window === "undefined") return 0.45;
  return Math.min(
    (window.innerHeight * 0.94) / STORY_CARD_SIZE.height,
    (window.innerWidth - 16) / STORY_CARD_SIZE.width,
  );
}

/** 首頁「收件匣回覆圖卡」：實際限動回覆圖卡；點擊後直立放大 */
export function HomeReplyShot() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [openScale, setOpenScale] = useState(0.45);
  useLockBodyScroll(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function syncScale() {
      setOpenScale(lightboxScale());
    }
    syncScale();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", syncScale);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", syncScale);
    };
  }, [open]);

  const alt = t("home.how6ShotAlt");

  return (
    <>
      <figure className="w-fit min-w-0 max-w-full sm:translate-x-6">
        <div className="px-2 pb-1 pt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={t("home.how2ShotCaption")}
            className="block -rotate-[6deg] cursor-zoom-in rounded-[1.85rem] outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5 hover:-rotate-[8deg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] active:scale-[0.98]"
          >
            <PhoneFrame>
              <ScaledReplyCard scale={THUMB_SCALE} />
            </PhoneFrame>
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
                className="animate-rise relative w-fit cursor-zoom-out"
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
                <PhoneFrame>
                  <ScaledReplyCard scale={openScale} />
                </PhoneFrame>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
