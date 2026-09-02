"use client";

import { useEffect, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { GuideVideoPlayer } from "@/components/guide-video-player";
import { FitMediaFrame, useDialogFrameHeight } from "@/components/fit-dialog";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

const VIDEO_SIZE = { width: 1080, height: 1920 } as const;

type Props = {
  open: boolean;
  onClose: () => void;
  copied: boolean;
  onCopyLink: () => void;
  onShareStory: () => void;
  onVideoEnded?: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
  shareButtonRef?: RefObject<HTMLButtonElement | null>;
};

export function IgShareGuideDialog({
  open,
  onClose,
  copied,
  onCopyLink,
  onShareStory,
  onVideoEnded,
  panelRef,
  shareButtonRef,
}: Props) {
  const t = useT();
  const frameH = useDialogFrameHeight(12);
  useLockBodyScroll(open);

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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden overscroll-none bg-[var(--ink)]/45 p-1.5 backdrop-blur-[3px] sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-share-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="animate-rise flex w-full max-w-[min(32rem,calc(100vw-0.75rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]"
        style={{
          height: frameH ?? "calc(100dvh - 0.75rem)",
          maxHeight: frameH ?? "calc(100dvh - 0.75rem)",
        }}
      >
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]" />

        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
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

          <FitMediaFrame
            width={VIDEO_SIZE.width}
            height={VIDEO_SIZE.height}
            scaleContent={false}
            className="mt-3"
            frameClassName="rounded-[1.25rem] bg-black shadow-[0_12px_28px_rgba(20,33,43,0.18)] ring-1 ring-[var(--line)]"
          >
            <GuideVideoPlayer
              src={BRAND.shareIgGuideVideoSrc}
              onEnded={onVideoEnded}
            />
          </FitMediaFrame>

          <div className="mt-3 grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--line)] pt-3">
            <Button type="button" variant="outline" onClick={onCopyLink}>
              {copied ? t("guide.copiedUrl") : t("guide.copyShort")}
            </Button>
            <Button
              ref={shareButtonRef}
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
