"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useNotifications } from "@/components/notifications/notification-provider";
import { useI18n } from "@/components/i18n-provider";
import { DATE_BCP47 } from "@/shared/i18n";
import { BRAND } from "@/shared/tools";

const StoryCardDialog = dynamic(
  () =>
    import("@/components/story-card-dialog").then((m) => m.StoryCardDialog),
  { ssr: false },
);

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

const INBOX_PREVIEW_CHARS = 20;

function inboxBodyPreview(body: string, max = INBOX_PREVIEW_CHARS): string {
  const compact = body.replace(/\s+/g, " ").trim();
  const chars = Array.from(compact);
  if (chars.length <= max) return compact;
  return `${chars.slice(0, max).join("")}...`;
}

export function InboxClient({
  initialMessages,
  initialPage = 1,
  initialTotal,
  initialTotalPages = 1,
  allowDelete = true,
}: {
  initialMessages?: InboxMessage[];
  initialPage?: number;
  initialTotal?: number;
  initialTotalPages?: number;
  allowDelete?: boolean;
}) {
  const seeded = initialMessages;
  const { t, locale } = useI18n();
  const { refresh: refreshNotifications } = useNotifications();
  const listTopRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(seeded ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(
    initialTotal ?? seeded?.length ?? 0,
  );
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(!seeded);
  const [error, setError] = useState<string | null>(null);
  const [storyMessage, setStoryMessage] = useState<Message | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  /** 剛精選／封存的訊息：在目標分頁框選提示一次 */
  const [highlightId, setHighlightId] = useState<string | null>(null);

  async function load(
    nextFilter = filter,
    nextPage = page,
    opts?: { quiet?: boolean },
  ) {
    if (!opts?.quiet) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/inbox?filter=${nextFilter}&page=${nextPage}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || t("common.loadFailed"));
      setMessages(data.messages);
      setPage(data.page ?? nextPage);
      setTotal(data.total ?? data.messages.length);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.loadFailed"));
    } finally {
      if (!opts?.quiet) setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter, page, {
      quiet: Boolean(seeded) && filter === "all" && page === initialPage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, locale]);

  useEffect(() => {
    const onRefresh = () => {
      void load(filter, page, { quiet: true });
    };
    window.addEventListener("6w7:inbox-refresh", onRefresh);
    return () => window.removeEventListener("6w7:inbox-refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, locale]);

  useEffect(() => {
    if (loading || !highlightId) return;
    const el = document.getElementById(`inbox-msg-${highlightId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [loading, highlightId, messages]);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/v1/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || t("common.updateFailed"));
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
    if (body.isRead !== undefined || body.isArchived !== undefined) {
      void refreshNotifications();
    }
    return true;
  }

  async function openMessage(m: Message) {
    setStoryMessage(m);
    if (m.isRead || openingId === m.id) return;
    setOpeningId(m.id);
    try {
      await patch(m.id, { isRead: true });
    } finally {
      setOpeningId(null);
    }
  }

  function closeDetail() {
    setStoryMessage(null);
  }

  async function toggleFeatured(m: Message) {
    const next = !m.isFeatured;
    const ok = await patch(m.id, { isFeatured: next });
    if (!ok) return;
    closeDetail();
    setHighlightId(next ? m.id : null);
    setPage(1);
    setFilter(next ? "featured" : "all");
  }

  async function markUnread(m: Message) {
    const ok = await patch(m.id, { isRead: false });
    if (!ok) return;
    closeDetail();
    setHighlightId(m.id);
    setPage(1);
    setFilter("unread");
  }

  async function toggleArchived(m: Message) {
    const next = !m.isArchived;
    const ok = await patch(m.id, { isArchived: next });
    if (!ok) return;
    closeDetail();
    setHighlightId(next ? m.id : null);
    setPage(1);
    setFilter(next ? "archived" : "all");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/v1/messages/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || t("common.deleteFailed"));
      return;
    }
    setStoryMessage(null);
    await load(filter, page);
    void refreshNotifications();
  }

  async function report(id: string) {
    const reason = window.prompt(t("inbox.reportPrompt"));
    if (!reason) return;
    const res = await fetch(`/api/v1/messages/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || t("inbox.reportFailed"));
      return;
    }
    await load();
  }

  function goToPage(next: number) {
    const safe = Math.min(totalPages, Math.max(1, next));
    if (safe === page) return;
    setPage(safe);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("inbox.all") },
    { id: "unread", label: t("inbox.unread") },
    { id: "featured", label: t("inbox.featured") },
    { id: "archived", label: t("inbox.archived") },
  ];

  const selected = storyMessage
    ? (messages.find((m) => m.id === storyMessage.id) ?? storyMessage)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setPage(1);
                setFilter(f.id);
              }}
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
        {total > 0 ? (
          <p className="text-xs tabular-nums text-[var(--muted)]">
            {t("inbox.total", { total })}
          </p>
        ) : null}
      </div>

      <div ref={listTopRef} className="scroll-mt-[calc(var(--header-h)+0.75rem)]">
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {loading ? (
        <p className="text-sm text-[var(--muted)]">{t("common.loading")}</p>
      ) : messages.length === 0 ? (
        <div className="relative mx-auto flex w-full max-w-sm justify-center pt-2">
          <div className="relative w-[min(100%,16.5rem)]">
            <p className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center font-[family-name:var(--font-display)] text-lg font-bold leading-tight text-[var(--ink)] drop-shadow-[0_2px_0_rgba(255,255,255,0.92)] sm:top-3 sm:text-xl">
              {t("inbox.empty")}
            </p>
            <Image
              src={BRAND.inboxEmptySrc}
              alt=""
              width={660}
              height={720}
              className="h-auto w-full object-contain object-top"
            />
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const justAdded = highlightId === m.id;
            const chips = [
              !m.isRead
                ? {
                    key: "unread",
                    label: t("inbox.unread"),
                    tone: "unread" as const,
                  }
                : null,
              m.topic
                ? { key: "topic", label: m.topic, tone: "neutral" as const }
                : null,
              m.isFeatured
                ? { key: "featured", label: t("inbox.featured"), tone: "accent" as const }
                : null,
              m.status === "flagged"
                ? { key: "flagged", label: t("inbox.flagged"), tone: "danger" as const }
                : null,
            ].filter(Boolean) as {
              key: string;
              label: string;
              tone: "unread" | "neutral" | "accent" | "danger";
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
                  } ${storyMessage?.id === m.id ? "ring-2 ring-[var(--mint)]/30" : ""}`}
                >
                  <span
                    className={`mt-1 w-1 shrink-0 self-stretch rounded-full ${
                      m.isRead ? "bg-[var(--line)]" : "bg-[var(--mint)]"
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {chips.map((c) => (
                          <span
                            key={c.key}
                            className={
                              c.tone === "unread"
                                ? "inline-flex shrink-0 items-center rounded-md bg-[var(--mint)] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
                                : `inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    c.tone === "accent"
                                      ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                                      : c.tone === "danger"
                                        ? "bg-[var(--danger)]/10 text-[var(--danger)]"
                                        : "bg-[var(--surface)] text-[var(--muted)]"
                                  }`
                            }
                          >
                            {c.label}
                          </span>
                        ))}
                        {m.isRead ? (
                          <span className="text-[15px] font-medium leading-snug text-[var(--ink)]">
                            {inboxBodyPreview(m.body)}
                          </span>
                        ) : (
                          <span className="text-[15px] font-medium text-[var(--muted)]">
                            {t("inbox.openToRead")}
                          </span>
                        )}
                      </span>
                      <time className="shrink-0 pt-0.5 text-[11px] tabular-nums text-[var(--muted)]">
                        {new Date(m.createdAt).toLocaleString(DATE_BCP47[locale], {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      </div>

      {totalPages > 1 ? (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label={t("inbox.pagesAria")}
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {t("inbox.prev")}
          </button>
          <p className="min-w-[7.5rem] text-center text-sm tabular-nums text-[var(--muted)]">
            {t("inbox.pageOf", { page, totalPages })}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--line)] px-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40"
          >
            {t("inbox.next")}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      ) : null}

      {selected ? (
        <StoryCardDialog
          key={selected.id}
          open
          message={selected}
          onClose={closeDetail}
          onFeatured={() => void toggleFeatured(selected)}
          onArchived={() => void toggleArchived(selected)}
          onMarkUnread={() => void markUnread(selected)}
          onReport={() => void report(selected.id)}
          onDelete={allowDelete ? () => void remove(selected.id) : undefined}
        />
      ) : null}
    </div>
  );
}
