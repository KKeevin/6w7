"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ShareStoryCard,
  SHARE_STORY_SIZE,
} from "@/components/share-story-card";
import { useI18n } from "@/components/i18n-provider";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";
import { DEMO_PROFILE, getDemoPrompt } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";

/** 清單縮圖寬約 11.5rem，與分享彈窗同一套 scale 包 1080×1920 圖卡 */
const THUMB_SCALE = 184 / SHARE_STORY_SIZE.width;

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.85rem] bg-[var(--ink)] p-[6px] shadow-[0_18px_42px_rgba(20,33,43,0.2)]">
      <div className="overflow-hidden rounded-[1.45rem] bg-[var(--bg)]">
        {children}
      </div>
    </div>
  );
}

function ScaledShareCard({ scale }: { scale: number }) {
  const { locale } = useI18n();
  return (
    <div
      className="overflow-hidden"
      style={{
        width: SHARE_STORY_SIZE.width,
        height: SHARE_STORY_SIZE.height,
        zoom: scale,
      }}
    >
      <ShareStoryCard
        username={DEMO_PROFILE.username}
        prompt={getDemoPrompt(locale)}
        imageUrl={BRAND.landingDemoAvatarSrc}
        displayName={DEMO_PROFILE.displayName}
        linkStickerSrc={BRAND.landingIgLinkStickerSrc}
      />
    </div>
  );
}

function lightboxScale() {
  if (typeof window === "undefined") return 0.45;
  return Math.min(
    (window.innerHeight * 0.94) / SHARE_STORY_SIZE.height,
    (window.innerWidth - 16) / SHARE_STORY_SIZE.width,
  );
}

/** 首頁「分享到 IG 限動」：實際限動圖卡；點擊後直立放大 */
export function HomeShareShot() {
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

  const alt = t("home.how3ShotAlt");

  return (
    <>
      <figure className="w-fit min-w-0 max-w-full sm:-translate-x-6">
        <div className="px-2 pb-1 pt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={t("home.how2ShotCaption")}
            className="block rotate-[6deg] cursor-zoom-in rounded-[1.85rem] outline-offset-4 transition-transform duration-200 hover:-translate-y-0.5 hover:rotate-[4deg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)] active:scale-[0.98]"
          >
            <PhoneFrame>
              <ScaledShareCard scale={THUMB_SCALE} />
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
                  <ScaledShareCard scale={openScale} />
                </PhoneFrame>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
