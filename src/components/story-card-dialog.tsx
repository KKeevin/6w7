"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AskReadDialog } from "@/components/ask-read-dialog";
import { StoryCard, STORY_CARD_SIZE } from "@/components/story-card";
import { renderInboxStoryPng } from "@/lib/render-story-canvas";
import { saveImageHint, saveOrSharePng } from "@/lib/save-image";

type MessageLite = {
  id: string;
  body: string;
  topic: string | null;
  createdAt?: string;
  isRead?: boolean;
  isFeatured?: boolean;
  isArchived?: boolean;
  status?: string;
  link: { title: string; slug: string };
};

type Props = {
  open: boolean;
  onClose: () => void;
  message: MessageLite;
  demo?: boolean;
  extra?: ReactNode;
  onFeatured?: () => void;
  onArchived?: () => void;
  onMarkUnread?: () => void;
  onReport?: () => void;
  onDelete?: () => void;
};

export function StoryCardDialog({
  open,
  onClose,
  message,
  demo,
  extra,
  onFeatured,
  onArchived,
  onMarkUnread,
  onReport,
  onDelete,
}: Props) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);

  useEffect(() => {
    if (!open) return;
    const el = hostRef.current;
    if (!el) return;

    const fit = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width < 8 || height < 8) return;
      setScale(
        Math.min(width / STORY_CARD_SIZE.width, height / STORY_CARD_SIZE.height),
      );
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  if (!open) return null;

  const showManage = Boolean(
    onFeatured || onArchived || onMarkUnread || onReport || onDelete,
  );
  const previewWidth = STORY_CARD_SIZE.width * scale;
  const previewHeight = STORY_CARD_SIZE.height * scale;

  async function download() {
    setBusy(true);
    setError(null);
    setHint(null);
    try {
      const dataUrl = await renderInboxStoryPng({
        body: message.body,
        reply,
        topic: message.topic,
        linkTitle: message.link.title,
      });
      const result = await saveOrSharePng(
        dataUrl,
        `6w7-story-${message.id.slice(-6)}.png`,
      );
      setHint(saveImageHint(result));
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/45 p-3 backdrop-blur-[3px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-card-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-rise flex h-[min(92dvh,56rem)] w-full max-w-[28rem] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)] lg:max-w-5xl lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 lg:p-6">
          <div
            ref={hostRef}
            className="flex min-h-0 w-full flex-1 items-center justify-center"
          >
            <div
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[#14212b] shadow-[0_16px_40px_rgba(20,33,43,0.16)]"
              style={{ width: previewWidth, height: previewHeight }}
            >
              <div
                style={{
                  width: STORY_CARD_SIZE.width,
                  height: STORY_CARD_SIZE.height,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <StoryCard
                  body={message.body}
                  reply={reply}
                  topic={message.topic}
                  linkTitle={message.link.title}
                  onBodyClick={() => setReading(true)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col border-t border-[var(--line)] px-4 py-3 sm:px-5 lg:w-[22rem] lg:border-l lg:border-t-0 lg:px-6 lg:py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {message.topic ? (
                  <span className="inline-flex rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                    {message.topic}
                  </span>
                ) : null}
                {message.isFeatured ? (
                  <span className="inline-flex rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                    精選
                  </span>
                ) : null}
                {message.status === "flagged" ? (
                  <span className="inline-flex rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--danger)]">
                    已檢舉
                  </span>
                ) : null}
              </div>
              <h2
                id="story-card-title"
                className="mt-1.5 font-[family-name:var(--font-display)] text-lg font-bold"
              >
                回覆並分享
              </h2>
              {message.createdAt ? (
                <time className="mt-0.5 block text-xs text-[var(--muted)]">
                  {new Date(message.createdAt).toLocaleString("zh-TW")}
                </time>
              ) : null}
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

          <Textarea
            id="story-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={200}
            aria-label="你的回覆，會印在圖卡上"
            placeholder="寫句回覆，會印在圖卡上"
            className="mt-3 min-h-[72px]"
          />
          <p className="mt-1 text-right text-[11px] text-[var(--muted)]">
            {reply.length}/200
          </p>

          {error ? (
            <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
          {hint && !error ? (
            <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p>
          ) : null}

          <Button
            type="button"
            className="mt-3 w-full"
            onClick={() => void download()}
            disabled={busy}
          >
            {busy ? "產生中…" : "分享此圖"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-[var(--muted)]">
            手機選 Instagram → 限動 · 電腦會下載 PNG
          </p>

          {extra ? <div className="mt-3">{extra}</div> : null}

          {showManage && !demo ? (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-sm font-semibold">
              {onFeatured ? (
                <button
                  type="button"
                  onClick={onFeatured}
                  className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  {message.isFeatured ? "取消精選" : "精選"}
                </button>
              ) : null}
              {onArchived ? (
                <button
                  type="button"
                  onClick={onArchived}
                  className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  {message.isArchived ? "取消封存" : "封存"}
                </button>
              ) : null}
              {onMarkUnread && message.isRead !== false ? (
                <button
                  type="button"
                  onClick={onMarkUnread}
                  className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  標成未讀
                </button>
              ) : null}
              {onReport ? (
                <button
                  type="button"
                  onClick={onReport}
                  className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  檢舉
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-[var(--danger)] transition hover:brightness-90"
                >
                  刪除
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <AskReadDialog
        open={reading}
        body={message.body}
        topic={message.topic}
        onClose={() => setReading(false)}
      />
    </div>
  );
}
