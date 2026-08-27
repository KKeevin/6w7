"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsEmailForm({
  initialEmail,
  initialVerified,
  disabled,
}: {
  initialEmail: string | null;
  initialVerified: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    searchParams.get("verified") === "1" ? "信箱已驗證，忘記密碼可以用了。" : null,
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [savedEmail, setSavedEmail] = useState(initialEmail ?? "");

  const savedPending = Boolean(savedEmail) && !verified;
  const locked = Boolean(savedEmail) && verified && !editing;
  const showVerified =
    verified && email.trim().toLowerCase() === savedEmail.trim().toLowerCase();

  function startEdit() {
    setEditing(true);
    setError(null);
    setMessage(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancelEdit() {
    setEmail(savedEmail);
    setEditing(false);
    setError(null);
    setMessage(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (locked) return;
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "儲存失敗");
      }
      const nextEmail = data.user?.email ?? email.trim() ?? "";
      const nextVerified = Boolean(data.user?.emailVerified);
      setEmail(nextEmail);
      setSavedEmail(nextEmail);
      setVerified(nextVerified);
      setEditing(false);
      if (!nextEmail) {
        setMessage("已移除信箱。");
      } else if (nextVerified) {
        setMessage("這個信箱已經驗證過了。");
      } else {
        setMessage(
          data.mailed
            ? "驗證信已寄出，請在 24 小時內到信箱點連結。"
            : "信箱已儲存。若沒收到信，請稍後按「重寄驗證信」。",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "怪怪的，再試一次");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      const res = await fetch("/api/v1/me/email/verify", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "寄送失敗");
      }
      if (data.alreadyVerified) {
        setVerified(true);
        setMessage("這個信箱已經驗證過了。");
      } else {
        setMessage(
          data.mailed
            ? "驗證信已再寄一次，請到信箱點連結。"
            : "已建立驗證連結。本機請看伺服器終端機。",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "怪怪的，再試一次");
    } finally {
      setResending(false);
    }
  }

  return (
    <form id="email" onSubmit={onSubmit} className="scroll-mt-24 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="account-email">信箱</Label>
          {email ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                showVerified
                  ? "bg-[var(--mint)]/15 text-[var(--mint)]"
                  : "bg-[var(--accent)]/12 text-[var(--accent)]"
              }`}
            >
              {showVerified ? "已驗證" : "未驗證"}
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">
              尚未設定
            </span>
          )}
        </div>
        <div className="relative mt-2">
          <Input
            ref={inputRef}
            id="account-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMessage(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={disabled}
            readOnly={locked}
            aria-readonly={locked}
            maxLength={120}
            className={cn(
              locked && "cursor-default bg-[var(--surface)] disabled:opacity-100",
              locked && !disabled && "pr-28",
            )}
          />
          {locked && !disabled ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
              onClick={startEdit}
            >
              <Pencil className="h-3 w-3" aria-hidden />
              更改信箱
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {showVerified
            ? "不會顯示在公開留言頁。驗證後可用忘記密碼，有新留言時也會寄通知。"
            : "儲存後會寄出驗證信，請到信箱點連結完成驗證。信箱不會顯示在公開留言頁。"}
        </p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {message && !error && (
        <p className="text-sm text-[var(--mint)]">{message}</p>
      )}
      {locked ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading || disabled}>
            {loading ? "儲存中…" : "儲存"}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading || disabled}
              onClick={cancelEdit}
            >
              取消
            </Button>
          ) : null}
          {savedPending ? (
            <Button
              type="button"
              variant="outline"
              disabled={resending || disabled}
              onClick={() => void resend()}
            >
              {resending ? "寄送中…" : "重寄驗證信"}
            </Button>
          ) : null}
        </div>
      )}
    </form>
  );
}
