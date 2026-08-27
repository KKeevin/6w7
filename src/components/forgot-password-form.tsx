"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND } from "@/shared/tools";

export function ForgotPasswordForm() {
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
        throw new Error(data?.error?.message || "送出失敗");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "怪怪的，再試一次");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          如果這個帳號有驗證過的信箱，重設連結已經寄出去了。一小時內去信箱點開，沒看到先翻一下垃圾信。
        </p>
        <p className="text-sm text-[var(--muted)]">
          還沒綁信箱或尚未驗證？到設定頁完成後再回來，或來信{" "}
          {BRAND.contactEmail}。
        </p>
        <Link
          href="/login?mode=login"
          className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
        >
          回到登入
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="identifier">IG 帳號或信箱</Label>
        <Input
          id="identifier"
          value={identifier}
          onChange={(event) =>
            setIdentifier(event.target.value.replace(/^@+/, ""))
          }
          placeholder="your.ig.id 或你的信箱"
          autoComplete="username"
          required
          maxLength={120}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          重設信只會寄到已驗證的信箱，不會公開。
        </p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "送出中…" : "寄出重設連結"}
      </Button>
      <Link
        href="/login?mode=login"
        className="block text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        回到登入
      </Link>
    </form>
  );
}
