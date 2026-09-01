"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  ShareStoryCard,
  SHARE_STORY_SIZE,
} from "@/components/share-story-card";
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

const PREVIEW_SCALE = 0.22;

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
      // Canvas 繪製：避開 iOS html-to-image 不畫 <img> 的問題
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-story-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-rise max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(20,33,43,0.22)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
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

        <div
          className="mx-auto mt-5 overflow-hidden rounded-xl border border-[var(--line)] bg-[#0f1a22]"
          style={{
            width: SHARE_STORY_SIZE.width * PREVIEW_SCALE,
            height: SHARE_STORY_SIZE.height * PREVIEW_SCALE,
          }}
        >
          <div
            style={{
              transform: `scale(${PREVIEW_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <ShareStoryCard
              username={username}
              prompt={prompt}
              imageUrl={previewSrc}
              displayName={displayName}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-[var(--danger)]">{error}</p>
        )}

        <div className="mt-5 grid gap-2">
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
  );
}
