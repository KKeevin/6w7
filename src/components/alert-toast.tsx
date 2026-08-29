"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, X } from "lucide-react";

const noopSubscribe = () => () => {};

/** portal 要等掛載後才能用；用 store 讀取，避免在 effect 裡 setState */
function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * 操作失敗的懸浮提示。掛到 body，不受外層 transform／zoom 影響，也不推擠版面。
 * onClose 請傳穩定的 callback（useCallback），否則倒數會被父層重繪一直重置。
 */
export function AlertToast({
  message,
  onClose,
  duration = 6000,
}: {
  message: string | null;
  onClose: () => void;
  /** 自動關閉毫秒數；設 0 就只能手動關 */
  duration?: number;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (!message || duration <= 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!mounted || !message) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+0.75rem)] z-[70] flex justify-center px-3 sm:px-6"
      role="alert"
      aria-live="assertive"
    >
      <div
        key={message}
        className="animate-rise pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--danger)]/40 bg-[var(--ink)] text-white shadow-[0_18px_40px_rgba(20,33,43,0.28)]"
      >
        <div className="flex items-start gap-3 p-3.5 sm:p-4">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--danger)]"
            aria-hidden
          >
            <TriangleAlert className="h-5 w-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
            {message}
          </p>
          <button
            type="button"
            aria-label="關閉提示"
            onClick={onClose}
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {duration > 0 ? (
          <div
            className="h-0.5 origin-left bg-[var(--danger)]"
            style={{ animation: `toast-bar ${duration}ms linear forwards` }}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
