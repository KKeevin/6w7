"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n-provider";
import { BRAND } from "@/shared/tools";

export function ForgotPasswordForm() {
  const t = useT();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || t("forgot.sendFailed"));
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.retry"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          {t("forgot.done")}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {t("forgot.noEmail", { email: BRAND.contactEmail })}
        </p>
        <Link
          href="/login?mode=login"
          className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
        >
          {t("forgot.backLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="identifier">{t("forgot.identifier")}</Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(event) =>
            setIdentifier(event.target.value.replace(/^@+/, ""))
          }
          placeholder={t("forgot.placeholder")}
          autoComplete="username"
          required
          maxLength={120}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t("forgot.hint")}</p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("forgot.sending") : t("forgot.submit")}
      </Button>
      <Link
        href="/login?mode=login"
        className="block text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        {t("forgot.backLogin")}
      </Link>
    </form>
  );
}
