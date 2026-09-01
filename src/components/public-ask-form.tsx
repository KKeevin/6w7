"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { burstMemeFireworks } from "@/components/meme-drift";
import { ASK_LIMITS } from "@/shared/tools";
import type { PublicAskLink } from "@/shared/schemas";
import { useT } from "@/components/i18n-provider";

export function PublicAskForm({ link }: { link: PublicAskLink }) {
  const i18n = useT();
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
        {i18n("share.closed")}
      </p>
    );
  }

  if (done) {
    return (
      <div className="mt-8 border-t-2 border-[var(--mint)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          {i18n("ask.sentTitle")}
        </h2>
        <p className="mt-2 text-[var(--muted)]">{i18n("ask.sentBody")}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    burstMemeFireworks(submitter);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/public/ask/${link.slug}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || i18n("ask.sendFailed"));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n("ask.sendFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      {link.topics.length > 0 && (
        <div>
          <Label>
            {i18n("share.topic")}
            {link.requireTopic ? i18n("common.required") : i18n("common.optional")}
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {link.topics.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setTopic(topic === item && !link.requireTopic ? undefined : item)
                }
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                  topic === item
                    ? "bg-[var(--ink)] text-[var(--bg)]"
                    : "border border-[var(--line)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="body">{i18n("share.anonMessage")}</Label>
        <div className="relative focus-within:z-30">
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={ASK_LIMITS.bodyMax}
            placeholder={i18n("share.placeholder")}
            className="transition-[background-color,backdrop-filter,box-shadow] duration-200 focus:bg-[var(--bg)]/68 focus:shadow-[0_10px_28px_rgba(20,33,43,0.14)] focus:backdrop-blur-[3px]"
          />
        </div>
        <p className="mt-1 text-right text-xs text-[var(--muted)]">
          {body.length}/{ASK_LIMITS.bodyMax}
        </p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? i18n("ask.sending") : i18n("share.sendAnon")}
      </Button>
      <p className="text-xs text-[var(--muted)]">{i18n("share.anonNote")}</p>
    </form>
  );
}
