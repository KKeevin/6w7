"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import {
  ShareStoryCard,
  SHARE_STORY_SIZE,
} from "@/components/share-story-card";
import { saveImageHint, saveOrSharePng } from "@/lib/save-image";

type Props = {
  open: boolean;
  onClose: () => void;
  username: string;
  prompt: string;
  imageUrl?: string | null;
  displayName?: string | null;
  shortUrl: string;
  onCopiedLink?: () => void;
};

const PREVIEW_SCALE = 0.22;

function absoluteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function resolveExportImage(
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl) return null;
  const abs = absoluteUrl(imageUrl);
  try {
    const sameOrigin =
      abs.startsWith(window.location.origin) || abs.startsWith("/");
    const fetchUrl = sameOrigin
      ? abs
      : `/api/v1/media/proxy?url=${encodeURIComponent(abs)}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [exportImage, setExportImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setExportImage(null);
      setError(null);
      setHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const data = await resolveExportImage(imageUrl);
      if (!cancelled) setExportImage(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, imageUrl]);

  if (!open) return null;

  const previewSrc = imageUrl ? absoluteUrl(imageUrl) : null;

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      if (imageUrl && !exportImage) {
        const data = await resolveExportImage(imageUrl);
        setExportImage(data);
        await new Promise((r) => setTimeout(r, 120));
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const root = cardRef.current;
      const imgs = Array.from(root.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }),
        ),
      );

      const dataUrl = await toPng(root, {
        width: SHARE_STORY_SIZE.width,
        height: SHARE_STORY_SIZE.height,
        pixelRatio: 1,
        cacheBust: true,
      });

      const result = await saveOrSharePng(
        dataUrl,
        `6w7-share-${username}.png`,
      );
      setHint(saveImageHint(result));

      try {
        await navigator.clipboard.writeText(
          shortUrl.startsWith("http") ? shortUrl : `https://${shortUrl}`,
        );
        onCopiedLink?.();
      } catch {
        /* ignore */
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error(err);
      setError("圖卡產生失敗，請再試一次。");
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
              限動分享圖
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              手機可分享到照片／限動；電腦會直接下載 1080×1920 PNG。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="關閉"
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

        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -1400,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <div ref={cardRef}>
            <ShareStoryCard
              username={username}
              prompt={prompt}
              imageUrl={exportImage || previewSrc}
              displayName={displayName}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-[var(--danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-3 text-center text-sm text-[var(--muted)]">{hint}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            關閉
          </Button>
          <Button
            type="button"
            onClick={() => void download()}
            disabled={busy}
          >
            {busy ? "產生中…" : "儲存／分享圖卡"}
          </Button>
        </div>
      </div>
    </div>
  );
}
