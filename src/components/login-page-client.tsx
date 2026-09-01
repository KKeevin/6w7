"use client";

import { useState } from "react";
import { LoginForm } from "@/components/login-form";
import { useT } from "@/components/i18n-provider";

/** /login：依本機紀錄預設登入或註冊，標題跟著切 */
export function LoginPageClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const t = useT();

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {mode === "login" ? t("auth.pageTitle") : t("auth.registerTitle")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {mode === "login" ? t("auth.loginLead") : t("auth.registerLead")}
      </p>
      <div className="mt-8">
        <LoginForm defaultMode="login" onModeChange={setMode} />
      </div>
    </>
  );
}
