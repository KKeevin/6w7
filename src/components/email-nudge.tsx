"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n-provider";

const KEY = "6w7-email-nudge";
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function isDismissed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** SSR 先當成已關閉，hydrate 後才讀 sessionStorage，避免關過的人看到閃一下 */
function isDismissedOnServer() {
  return true;
}

function dismiss() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* 無痕模式等情境忽略 */
  }
  for (const listener of listeners) listener();
}

export function EmailNudge({
  welcome = false,
  hasEmail,
  verified,
}: {
  welcome?: boolean;
  hasEmail: boolean;
  verified: boolean;
}) {
  const t = useT();
  const dismissed = useSyncExternalStore(
    subscribe,
    isDismissed,
    isDismissedOnServer,
  );

  if (verified || dismissed) return null;

  const title = welcome
    ? t("nudge.welcomeTitle")
    : hasEmail
      ? t("nudge.unverifiedTitle")
      : t("nudge.noEmailTitle");
  const body = welcome
    ? t("nudge.welcomeBody")
    : hasEmail
      ? t("nudge.unverifiedBody")
      : t("nudge.noEmailBody");

  return (
    <aside className="animate-rise mb-4 overflow-hidden rounded-3xl border border-[var(--accent)]/20 bg-white shadow-[0_16px_40px_rgba(20,33,43,0.06)] sm:mb-5">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M4 7.5 12 13l8-5.5" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            {title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            {body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href="/settings#email"
              className="inline-flex h-9 items-center rounded-xl bg-[var(--ink)] px-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            >
              {t("nudge.goSettings")}
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {t("nudge.later")}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
