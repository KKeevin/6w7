"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { BRAND } from "@/shared/tools";

export function CopyContactEmail() {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(BRAND.contactEmail);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3.5 text-left transition hover:border-[var(--mint)] hover:bg-[var(--surface)]"
      aria-label={`${t("common.copy")} ${BRAND.contactEmail}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ink)] text-white">
        <Mail className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold tracking-wide text-[var(--muted)]">
          {t("contact.emailLabel")}
        </span>
        <span className="mt-0.5 block truncate font-semibold text-[var(--ink)]">
          {BRAND.contactEmail}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--mint)]">
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
        {copied ? t("common.copied") : t("common.copy")}
      </span>
    </button>
  );
}
