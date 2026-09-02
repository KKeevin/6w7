"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  ShareStoryCard,
  SHARE_STORY_SIZE,
} from "@/components/share-story-card";
import { FitMediaFrame, useDialogFrameHeight } from "@/components/fit-dialog";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";
import { renderShareStoryPng } from "@/lib/render-story-canvas";
import { saveOrSharePng } from "@/lib/save-image";
import { useT } from "@/components/i18n-provider";

export type ShareStoryDialogProps = {
  open: boolean;
  onClose: () => void;
  username: string;
  prompt: string;
  imageUrl?: string | null;
  displayName?: string | null;
  shortUrl: string;
  onCopiedLink?: () => void;
  onOpenGuide?: () => void;
  onShareImage?: () => void;
  copyButtonRef?: RefObject<HTMLButtonElement | null>;
  shareImageButtonRef?: RefObject<HTMLButtonElement | null>;
};

type Props = ShareStoryDialogProps;

function absoluteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function ShareStoryDialog({
  open,
  onClose,
  username,
  prompt,
  imageUrl,
  displayName,
  shortUrl,
  onCopiedLink,
  onOpenGuide,
  onShareImage,
  copyButtonRef,
  shareImageButtonRef,
}: Props) {
  const t = useT();
  const frameH = useDialogFrameHeight(12);
  useLockBodyScroll(open);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const previewSrc = imageUrl ? absoluteUrl(imageUrl) : null;
  const fullShortUrl = shortUrl.startsWith("http")
    ? shortUrl
    : `https://${shortUrl}`;

  async function copyShortUrl() {
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setCopied(true);
      onCopiedLink?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("shareStory.copyFailed"));
    }
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await renderShareStoryPng({
        username,
        prompt,
        imageUrl: previewSrc,
        displayName,
        askCaption: t("share.kicker"),
        linkHint: t("shareStory.linkHint"),
      });

      await saveOrSharePng(dataUrl, `6w7-share-${username}.png`);
      try {
        await navigator.clipboard.writeText(fullShortUrl);
        setCopied(true);
        onCopiedLink?.();
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        /* 分享後不一定還在使用者手勢內，改由按鈕複製 */
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error(err);
      setError(t("story.renderFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-[var(--ink)]/45 p-1.5 backdrop-blur-[3px] sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-story-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-rise flex w-full max-w-[min(28rem,calc(100vw-0.75rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]"
        style={{
          height: frameH ?? "calc(100dvh - 0.75rem)",
          maxHeight: frameH ?? "calc(100dvh - 0.75rem)",
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="share-story-title"
                className="font-[family-name:var(--font-display)] text-xl font-bold"
              >
                {t("share.shareIg")}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {t("shareStory.hint")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              aria-label={t("common.close")}
            >
              ✕
            </button>
          </div>

          <FitMediaFrame
            width={SHARE_STORY_SIZE.width}
            height={SHARE_STORY_SIZE.height}
            className="mt-3"
            frameClassName="rounded-xl border border-[var(--line)] bg-[#0f1a22]"
          >
            <ShareStoryCard
              username={username}
              prompt={prompt}
              imageUrl={previewSrc}
              displayName={displayName}
            />
          </FitMediaFrame>

          {error ? (
            <p className="mt-2 shrink-0 text-center text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="mt-3 grid shrink-0 gap-2">
            <Button
              ref={copyButtonRef}
              type="button"
              variant="secondary"
              onClick={() => void copyShortUrl()}
            >
              {copied ? t("shareStory.copiedShort") : t("shareStory.copyExclusive")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {onOpenGuide ? (
                <Button
                  type="button"
                  className="border border-[var(--mint)]/20 bg-[var(--mint)]/12 font-bold text-[color-mix(in_srgb,var(--mint)_55%,var(--ink))] shadow-none hover:bg-[var(--mint)]/20 hover:brightness-100"
                  onClick={onOpenGuide}
                >
                  {t("shareStory.seeGuide")}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  {t("common.close")}
                </Button>
              )}
              <Button
                ref={shareImageButtonRef}
                type="button"
                onClick={() => {
                  onShareImage?.();
                  void download();
                }}
                disabled={busy}
              >
                {busy ? t("story.generating") : t("story.shareImage")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
