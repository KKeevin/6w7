"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GuideVideoPlayer } from "@/components/guide-video-player";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

type Props = {
  open: boolean;
  onClose: () => void;
  copied: boolean;
  onCopyLink: () => void;
  onShareStory: () => void;
};

export function IgShareGuideDialog({
  open,
  onClose,
  copied,
  onCopyLink,
  onShareStory,
}: Props) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--ink)]/45 p-2 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-share-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-rise flex max-h-[96dvh] w-full max-w-[min(28rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]">
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]" />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--mint)]">
                {BRAND.en.toUpperCase()} GUIDE
              </p>
              <h3
                id="ig-share-guide-title"
                className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
              >
                {t("guide.title")}
              </h3>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              ✕
            </button>
          </div>

          <div className="mx-auto mt-3 w-full max-w-[min(100%,calc(76dvh*9/16))] shrink-0">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.25rem] bg-black shadow-[0_12px_28px_rgba(20,33,43,0.18)] ring-1 ring-[var(--line)]">
              <GuideVideoPlayer src={BRAND.shareIgGuideVideoSrc} />
            </div>
          </div>

          <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="outline" onClick={onCopyLink}>
              {copied ? t("guide.copiedUrl") : t("guide.copyShort")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                onShareStory();
              }}
            >
              {t("share.shareIg")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
