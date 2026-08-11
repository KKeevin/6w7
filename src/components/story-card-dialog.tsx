"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoryCard, STORY_CARD_SIZE } from "@/components/story-card";
import { renderInboxStoryPng } from "@/lib/render-story-canvas";
import { saveImageHint, saveOrSharePng } from "@/lib/save-image";

type Props = {
  open: boolean;
  onClose: () => void;
  message: {
    id: string;
    body: string;
    topic: string | null;
    link: { title: string; slug: string };
  };
};

const PREVIEW_SCALE = 0.28;

export function StoryCardDialog({ open, onClose, message }: Props) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  if (!open) return null;

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-card-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--bg)] p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="story-card-title"
              className="font-[family-name:var(--font-display)] text-xl font-bold"
            >
              限動回覆圖卡
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              手機按下方按鈕後，在系統分享選 Instagram →
              限動即可編輯發佈。電腦會下載 PNG。版型為 6w7 原創。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--surface)]"
          >
            關閉
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
          <div
            className="mx-auto overflow-hidden rounded-xl border border-[var(--line)] bg-[#14212b]"
            style={{
              width: STORY_CARD_SIZE.width * PREVIEW_SCALE,
              height: STORY_CARD_SIZE.height * PREVIEW_SCALE,
            }}
          >
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
              }}
            >
              <StoryCard
                body={message.body}
                reply={reply}
                topic={message.topic}
                linkTitle={message.link.title}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="story-reply">你的回覆（會印在圖卡上）</Label>
            <Textarea
              id="story-reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={200}
              placeholder="例如：哈哈我也這麼想、下週一起？"
              className="mt-1.5 min-h-[140px]"
            />
            <p className="mt-1 text-right text-xs text-[var(--muted)]">
              {reply.length}/200
            </p>

            {error && (
              <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
            )}
            {hint && !error && (
              <p className="mt-3 text-sm text-[var(--muted)]">{hint}</p>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <Button type="button" onClick={() => void download()} disabled={busy}>
                {busy ? "產生中…" : "分享到 IG 限動"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
