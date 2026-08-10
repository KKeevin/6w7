"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  defaultMode?: "login" | "register";
  redirectTo?: string;
  /** 落地頁一屏排版用，縮小間距 */
  compact?: boolean;
};

export function LoginForm({
  defaultMode = "login",
  redirectTo,
  compact = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const next = redirectTo || searchParams.get("next") || "/dashboard";

  const initialMode: "login" | "register" =
    modeParam === "register" || modeParam === "login"
      ? modeParam
      : defaultMode;

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || "註冊失敗");
        }
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error(
          mode === "login"
            ? "帳號或密碼錯誤"
            : "註冊成功但登入失敗，請再試一次",
        );
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <Label htmlFor="username">IG 帳號</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
            @
          </span>
          <Input
            id="username"
            className="pl-8"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
            placeholder="your.ig.id"
            autoComplete="username"
            required
            maxLength={30}
          />
        </div>
        {!compact && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            專屬連結會是 6w7.link/{username || "your.ig.id"}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="password">密碼（至少 8 碼）</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "處理中…"
          : mode === "login"
            ? "登入"
            : "註冊並開始"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
      >
        {mode === "login" ? "還沒有帳號？註冊" : "已有帳號？登入"}
      </button>
    </form>
  );
}
