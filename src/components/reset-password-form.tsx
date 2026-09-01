"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n-provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || t("reset.failed"));
      }
      router.push("/login?mode=login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.retry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">{t("reset.newPassword")}</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div>
        <Label htmlFor="confirm">{t("reset.confirm")}</Label>
        <Input
          id="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("common.saving") : t("reset.submit")}
      </Button>
      <Link
        href="/forgot-password"
        className="block text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        {t("reset.retry")}
      </Link>
    </form>
  );
}
