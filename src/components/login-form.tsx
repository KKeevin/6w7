"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { demoEnterHref, safeInternalPath } from "@/shared/paths";
import {
  markDeviceHasAccount,
  resolveAuthMode,
} from "@/lib/device-auth-hint";
import { resetDemoIgShareGuideHint } from "@/lib/ig-share-guide-hint";
import { useT } from "@/components/i18n-provider";

type AuthMode = "login" | "register";

type Props = {
  /** 無法從本機紀錄判斷時的後備（新裝置多半 register） */
  defaultMode?: AuthMode;
  redirectTo?: string;
  /** 落地頁一屏排版用，縮小間距 */
  compact?: boolean;
  onModeChange?: (mode: AuthMode) => void;
};

export function LoginForm({
  defaultMode = "register",
  redirectTo,
  compact = false,
  onModeChange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const modeParam = searchParams.get("mode");
  const next = safeInternalPath(searchParams.get("next") || redirectTo);

  // 首屏先用 URL／後備，mount 後再依 localStorage 調整（避免 hydration 不一致）
  const [mode, setMode] = useState<AuthMode>(() =>
    modeParam === "login" || modeParam === "register"
      ? modeParam
      : defaultMode,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolved = resolveAuthMode({ modeParam, defaultMode });
    setMode(resolved);
    onModeChange?.(resolved);
    // 僅在進入頁面／URL mode 改變時解析一次
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 刻意不依 onModeChange
  }, [modeParam, defaultMode]);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    onModeChange?.(nextMode);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || t("auth.registerFailed"));
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
            ? t("auth.badCredentials")
            : t("auth.registerLoginFailed"),
        );
      }
      markDeviceHasAccount();
      router.push(mode === "register" ? "/dashboard?welcome=1" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.retry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <Label htmlFor="username">{t("auth.igId")}</Label>
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
        {!compact && mode === "register" && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t("auth.linkWillBe", { username: username || "your.ig.id" })}
          </p>
        )}
      </div>
      <div>
        <div className="flex items-end justify-between gap-3">
          <Label htmlFor="password">{t("auth.password")}</Label>
          {mode === "login" ? (
            <Link
              href="/forgot-password"
              className="mb-0.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {t("auth.forgot")}
            </Link>
          ) : null}
        </div>
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
          ? t("common.processing")
          : mode === "login"
            ? t("auth.login")
            : t("auth.registerStart")}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        onClick={() => switchMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
      </button>
      <div className="relative py-1 text-center">
        <span className="bg-[var(--bg)] px-2 text-xs text-[var(--muted)] lg:bg-white">
          {t("common.or")}
        </span>
      </div>
      <a
        id="demo-login"
        href={demoEnterHref(next)}
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        onClick={() => resetDemoIgShareGuideHint()}
      >
        {t("auth.demoLogin")}
      </a>
      <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
        {t("auth.demoHint")}
      </p>
    </form>
  );
}
