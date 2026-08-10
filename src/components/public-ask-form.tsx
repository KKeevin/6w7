"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ASK_LIMITS } from "@/shared/tools";
import type { PublicAskLink } from "@/shared/schemas";

export function PublicAskForm({ link }: { link: PublicAskLink }) {
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<string | undefined>(
    link.requireTopic ? link.topics[0] : undefined,
  );
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!link.acceptingMessages) {
    return (
      <p className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 px-4 py-6 text-sm text-[var(--muted)]">
        此連結目前不接受留言。主人可能暫時關閉了收件。
      </p>
    );
  }

  if (done) {
    return (
      <div className="mt-8 border-t-2 border-[var(--mint)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          已送出
        </h2>
        <p className="mt-2 text-[var(--muted)]">
          你的匿名留言已送進對方的 6w7 收件匣。想再留一則也可以。
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setDone(false);
            setBody("");
          }}
        >
          再留一則
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/ask/${link.slug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "送出失敗");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {link.topics.length > 0 && (
        <div>
          <Label>主題{link.requireTopic ? "（必選）" : "（選填）"}</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {link.topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(topic === t && !link.requireTopic ? undefined : t)}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                  topic === t
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "border border-[var(--line)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="body">匿名留言</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={ASK_LIMITS.bodyMax}
          placeholder="說吧，對方只會在收件匣看到內容。"
        />
        <p className="mt-1 text-right text-xs text-[var(--muted)]">
          {body.length}/{ASK_LIMITS.bodyMax}
        </p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "送出中…" : "匿名送出"}
      </Button>
      <p className="text-xs text-[var(--muted)]">
        匿名對主人顯示；系統為防濫用可能保留必要技術資料。請勿發送違法或傷害他人的內容。
      </p>
    </form>
  );
}
