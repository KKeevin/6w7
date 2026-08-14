"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StoryCardDialog } from "@/components/story-card-dialog";
import { useNotifications } from "@/components/notifications/notification-provider";

export type InboxMessage = {
  id: string;
  body: string;
  topic: string | null;
  isRead: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  status: string;
  createdAt: string;
  link: { id: string; slug: string; title: string };
};

type Message = InboxMessage;

type Filter = "all" | "unread" | "featured" | "archived";

export function InboxClient({
  demoMessages,
}: {
  demoMessages?: InboxMessage[];
}) {
  const demo = Boolean(demoMessages?.length);
  const { refresh: refreshNotifications } = useNotifications();
  const [messages, setMessages] = useState<Message[]>(demoMessages ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState<string | null>(null);
  const [storyMessage, setStoryMessage] = useState<Message | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  /** 剛精選／封存的訊息：在目標分頁框選提示一次 */
  const [highlightId, setHighlightId] = useState<string | null>(null);

  async function load(nextFilter = filter, opts?: { quiet?: boolean }) {
    if (demo) {
      const source = demoMessages ?? [];
      const next =
        nextFilter === "unread"
          ? source.filter((m) => !m.isRead && !m.isArchived)
          : nextFilter === "featured"
            ? source.filter((m) => m.isFeatured)
            : nextFilter === "archived"
              ? source.filter((m) => m.isArchived)
              : source.filter((m) => !m.isArchived);
      setMessages(next);
      setLoading(false);
      return;
    }
    if (!opts?.quiet) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/inbox?filter=${nextFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "載入失敗");
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    const onRefresh = () => {
      void load(filter, { quiet: true });
    };
    window.addEventListener("6w7:inbox-refresh", onRefresh);
    return () => window.removeEventListener("6w7:inbox-refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (loading || !highlightId) return;
    const el = document.getElementById(`inbox-msg-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [loading, highlightId, messages]);

  async function patch(id: string, body: Record<string, unknown>) {
    if (demo) return false;
    const res = await fetch(`/api/v1/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "更新失敗");
      return false;
    }
    const updated = data.message as Message | undefined;
    if (updated) {
      setMessages((list) =>
        list.map((m) => (m.id === id ? { ...m, ...updated } : m)),
      );
    } else {
      await load();
    }
    if (body.isRead === true || body.isArchived !== undefined) {
      void refreshNotifications();
    }
    return true;
  }

  async function openMessage(m: Message) {
    setSelectedId(m.id);
    if (demo || m.isRead || openingId === m.id) return;
    setOpeningId(m.id);
    try {
      await patch(m.id, { isRead: true });
    } finally {
      setOpeningId(null);
    }
  }

  function closeDetail() {
    setSelectedId(null);
  }

  async function toggleFeatured(m: Message) {
    const next = !m.isFeatured;
    const ok = await patch(m.id, { isFeatured: next });
    if (!ok) return;
    closeDetail();
    setHighlightId(next ? m.id : null);
    setFilter(next ? "featured" : "all");
  }

  async function toggleArchived(m: Message) {
    const next = !m.isArchived;
    const ok = await patch(m.id, { isArchived: next });
    if (!ok) return;
    closeDetail();
    setHighlightId(next ? m.id : null);
    setFilter(next ? "archived" : "all");
  }

  async function remove(id: string) {
    if (demo) return;
    const res = await fetch(`/api/v1/messages/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "刪除失敗");
      return;
    }
    setSelectedId(null);
    await load();
    void refreshNotifications();
  }

  async function report(id: string) {
    if (demo) return;
    const reason = window.prompt("請簡述檢舉原因");
    if (!reason) return;
    const res = await fetch(`/api/v1/messages/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "檢舉失敗");
      return;
    }
    await load();
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "全部" },
    { id: "unread", label: "未讀" },
    { id: "featured", label: "精選" },
    { id: "archived", label: "已封存" },
  ];

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
              filter === f.id
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "border border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading ? (
        <p className="text-sm text-[var(--muted)]">載入中…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">目前沒有留言。</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const justAdded = highlightId === m.id;
            const chips = [
              m.topic
                ? { key: "topic", label: m.topic, tone: "neutral" as const }
                : null,
              m.isFeatured
                ? { key: "featured", label: "精選", tone: "accent" as const }
                : null,
              m.status === "flagged"
                ? { key: "flagged", label: "已檢舉", tone: "danger" as const }
                : null,
            ].filter(Boolean) as {
              key: string;
              label: string;
              tone: "neutral" | "accent" | "danger";
            }[];

            return (
              <li
                key={m.id}
                id={`inbox-msg-${m.id}`}
                className={justAdded ? "inbox-just-added" : undefined}
              >
                {justAdded && (
                  <svg
                    className="inbox-just-added-ring"
                    aria-hidden
                    onAnimationEnd={() => setHighlightId(null)}
                  >
                    <rect
                      x="4"
                      y="4"
                      rx="14"
                      pathLength={100}
                      style={{
                        width: "calc(100% - 8px)",
                        height: "calc(100% - 8px)",
                      }}
                    />
                  </svg>
                )}
                <button
                  type="button"
                  onClick={() => void openMessage(m)}
                  className={`relative z-[1] flex w-full gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition ${
                    !m.isRead
                      ? "border-[var(--mint)]/35 bg-[#e7f7f2] shadow-sm hover:border-[var(--mint)]/55 hover:bg-[#dcf3ec]"
                      : "border-[var(--line)] bg-white hover:border-[var(--line)] hover:bg-[#f0f3f6]"
                  } ${selectedId === m.id ? "ring-2 ring-[var(--mint)]/30" : ""}`}
                >
                  <span
                    className={`mt-1 w-1 shrink-0 self-stretch rounded-full ${
                      m.isRead ? "bg-[var(--line)]" : "bg-[var(--mint)]"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      {demo || m.isRead ? (
                        <span
                          className={`text-[15px] font-medium leading-snug text-[var(--ink)] ${
                            demo ? "" : "line-clamp-2"
                          }`}
                        >
                          {m.body}
                        </span>
                      ) : (
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="inline-flex shrink-0 items-center rounded-md bg-[var(--mint)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                            未讀
                          </span>
                          <span className="text-[15px] font-medium text-[var(--muted)]">
                            點開查看內容
                          </span>
                        </span>
                      )}
                      <time className="shrink-0 pt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
                        {new Date(m.createdAt).toLocaleString("zh-TW", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                    {chips.length > 0 && (
                      <span className="mt-2.5 flex flex-wrap gap-1.5">
                        {chips.map((c) => (
                          <span
                            key={c.key}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              c.tone === "accent"
                                ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                                : c.tone === "danger"
                                  ? "bg-[var(--danger)]/10 text-[var(--danger)]"
                                  : "bg-[var(--surface)] text-[var(--muted)]"
                            }`}
                          >
                            {c.label}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inbox-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div className="animate-rise max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_24px_60px_rgba(20,33,43,0.22)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {selected.topic && (
                    <span className="inline-flex rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      {selected.topic}
                    </span>
                  )}
                  {selected.isFeatured && (
                    <span className="inline-flex rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                      精選
                    </span>
                  )}
                  {selected.status === "flagged" && (
                    <span className="inline-flex rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--danger)]">
                      已檢舉
                    </span>
                  )}
                </div>
                <h2 id="inbox-detail-title" className="sr-only">
                  留言內容
                </h2>
                <time className="mt-2 block text-xs text-[var(--muted)]">
                  {new Date(selected.createdAt).toLocaleString("zh-TW")}
                </time>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>

            <p className="mt-5 whitespace-pre-wrap text-lg font-medium leading-relaxed text-[var(--ink)]">
              {selected.body}
            </p>
            {demo ? (
              <p className="mt-3 text-sm">
                <Link
                  href={`/inbox/${selected.id}`}
                  className="font-semibold text-[var(--mint)] hover:underline"
                >
                  開獨立頁（給搜尋引擎索引）→
                </Link>
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStoryMessage(selected)}
              >
                限動圖卡
              </Button>
              {demo ? null : (
                <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void toggleFeatured(selected)}
              >
                {selected.isFeatured ? "取消精選" : "精選"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void toggleArchived(selected)}
              >
                {selected.isArchived ? "取消封存" : "封存"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void report(selected.id)}
              >
                檢舉
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void remove(selected.id)}
              >
                刪除
              </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {storyMessage && (
        <StoryCardDialog
          open={Boolean(storyMessage)}
          message={storyMessage}
          onClose={() => setStoryMessage(null)}
        />
      )}
    </div>
  );
}
