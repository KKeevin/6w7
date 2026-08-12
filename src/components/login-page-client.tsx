"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";

/** /login：依本機紀錄預設登入或註冊，標題跟著切 */
export function LoginPageClient() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {mode === "login" ? "登入" : "註冊"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {mode === "login"
          ? "使用你的 IG 帳號登入，管理分享連結與收件匣。"
          : "用 IG 帳號註冊，馬上拿到專屬短連結。"}
      </p>
      <div className="mt-8">
        <LoginForm
          defaultMode="login"
          redirectTo="/dashboard"
          onModeChange={setMode}
        />
      </div>
    </>
  );
}
