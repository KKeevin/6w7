"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { BRAND } from "@/shared/tools";

/** 首頁右側：依本機是否用過帳號，預設登入或註冊，標題跟著切 */
export function HomeAuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("register");

  return (
    <>
      <h2 className="text-xl font-bold text-[var(--ink)]">
        {mode === "login" ? `歡迎回來` : `開始使用 ${BRAND.en}`}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {mode === "login"
          ? "登入後管理你的專屬連結與收件匣。"
          : "用 IG 帳號註冊，馬上拿到專屬連結。"}
      </p>
      <div className="mt-5">
        <LoginForm
          defaultMode="register"
          redirectTo="/dashboard"
          compact
          onModeChange={setMode}
        />
      </div>
      <p className="mt-5 text-center text-[11px] leading-relaxed text-[var(--muted)]">
        繼續即表示你同意{" "}
        <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
          服務條款
        </Link>{" "}
        與{" "}
        <Link
          href="/legal/privacy"
          className="underline hover:text-[var(--ink)]"
        >
          隱私權政策
        </Link>
        。
      </p>
    </>
  );
}
