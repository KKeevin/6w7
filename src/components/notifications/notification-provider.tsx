"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NotificationSummary } from "@/shared/notifications";

type ToastItem = {
  id: string;
  title: string;
  body: string;
};

type NotificationContextValue = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refresh: async () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const EMPTY: NotificationSummary = {
  unreadCount: 0,
  latestId: null,
  latestAt: null,
  latestTopic: null,
};

export function NotificationProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const pathname = usePathname();
  const [summary, setSummary] = useState<NotificationSummary>(EMPTY);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const prevCountRef = useRef<number | null>(null);
  const prevLatestRef = useRef<string | null>(null);
  const baseTitleRef = useRef<string | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (summaryNext: NotificationSummary) => {
      const id = summaryNext.latestId || `t-${Date.now()}`;
      const title = "新的匿名留言";
      const body = summaryNext.latestTopic
        ? `主題「${summaryNext.latestTopic}」· 點開收件匣查看`
        : "有人剛剛留下一則訊息，點開收件匣查看";
      setToasts((list) => {
        const next = [{ id, title, body }, ...list.filter((t) => t.id !== id)];
        return next.slice(0, 3);
      });
      window.setTimeout(() => dismissToast(id), 6500);
    },
    [dismissToast],
  );

  const applySummary = useCallback(
    (next: NotificationSummary, isNewArrival: boolean) => {
      setSummary(next);

      const prevCount = prevCountRef.current;
      const prevLatest = prevLatestRef.current;
      const arrived =
        isNewArrival ||
        (prevCount !== null &&
          (next.unreadCount > prevCount ||
            (Boolean(next.latestId) &&
              next.latestId !== prevLatest &&
              next.unreadCount > 0)));

      if (arrived) {
        pushToast(next);
        if (pathname === "/inbox") {
          window.dispatchEvent(new CustomEvent("6w7:inbox-refresh"));
        }
      }

      prevCountRef.current = next.unreadCount;
      prevLatestRef.current = next.latestId;
    },
    [pathname, pushToast],
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/v1/notifications/summary", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      const next = (data.summary || EMPTY) as NotificationSummary;
      applySummary(next, false);
    } catch {
      /* ignore */
    }
  }, [applySummary, enabled]);

  // SSE + 輪詢備援
  useEffect(() => {
    if (!enabled) {
      setSummary(EMPTY);
      prevCountRef.current = null;
      prevLatestRef.current = null;
      return;
    }

    let closed = false;
    let es: EventSource | null = null;
    let pollTimer: number | undefined;

    const startPoll = () => {
      if (pollTimer) return;
      pollTimer = window.setInterval(() => {
        void refresh();
      }, 12000);
    };

    const connect = () => {
      if (closed) return;
      try {
        es = new EventSource("/api/v1/notifications/stream");
        es.onmessage = (ev) => {
          if (closed) return;
          try {
            const data = JSON.parse(ev.data) as {
              type?: string;
              isNewArrival?: boolean;
              summary?: NotificationSummary;
            };
            if (data.type === "summary" && data.summary) {
              applySummary(data.summary, Boolean(data.isNewArrival));
            }
          } catch {
            /* ignore malformed */
          }
        };
        es.onerror = () => {
          es?.close();
          es = null;
          startPoll();
          void refresh();
        };
      } catch {
        startPoll();
        void refresh();
      }
      void refresh();
    };

    let idleId = 0;
    let timeoutId = 0;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(connect, { timeout: 2200 });
    } else {
      timeoutId = window.setTimeout(connect, 1600);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
      es?.close();
      if (pollTimer) window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applySummary, enabled, refresh]);

  // 文件標題角標
  useEffect(() => {
    if (!enabled) return;
    if (baseTitleRef.current === null) {
      baseTitleRef.current = document.title.replace(/^\(\d+\)\s*/, "");
    }
    const base = baseTitleRef.current;
    document.title =
      summary.unreadCount > 0 ? `(${summary.unreadCount}) ${base}` : base;
    return () => {
      if (baseTitleRef.current) document.title = baseTitleRef.current;
    };
  }, [enabled, summary.unreadCount, pathname]);

  // 進入收件匣後稍後刷新（讀完未讀會變）
  useEffect(() => {
    if (!enabled || pathname !== "/inbox") return;
    const t = window.setTimeout(() => void refresh(), 800);
    return () => window.clearTimeout(t);
  }, [enabled, pathname, refresh]);

  const value = useMemo(
    () => ({
      unreadCount: summary.unreadCount,
      refresh,
    }),
    [summary.unreadCount, refresh],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+0.75rem)] z-[60] flex flex-col items-end gap-2 px-3 sm:px-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-rise w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--mint)]/30 bg-[var(--ink)] text-white shadow-[0_18px_40px_rgba(20,33,43,0.28)]"
          >
            <div className="flex gap-3 p-3.5 sm:p-4">
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--mint)] text-sm font-bold"
                aria-hidden
              >
                6
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-tight">{toast.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                  {toast.body}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/inbox"
                    onClick={() => dismissToast(toast.id)}
                    className="inline-flex h-8 items-center rounded-lg bg-[var(--mint)] px-3 text-xs font-semibold text-white"
                  >
                    打開收件匣
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-medium text-white/60 hover:text-white"
                  >
                    稍後
                  </button>
                </div>
              </div>
            </div>
            <div className="h-0.5 origin-left animate-[toast-bar_6.5s_linear_forwards] bg-[var(--mint)]" />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
