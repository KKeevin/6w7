"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

/** 首頁右側：依本機是否用過帳號，預設登入或註冊，標題跟著切 */
export function HomeAuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const t = useT();

  return (
    <>
      <h2 className="text-xl font-bold text-[var(--ink)]">
        {mode === "login"
          ? t("home.welcomeBack")
          : t("home.startUsing", { brand: BRAND.en })}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {mode === "login" ? t("home.loginHint") : t("home.registerHint")}
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
        {t("home.agreePrefix")}{" "}
        <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
          {t("footer.terms")}
        </Link>{" "}
        {t("home.agreeAnd")}{" "}
        <Link
          href="/legal/privacy"
          className="underline hover:text-[var(--ink)]"
        >
          {t("footer.privacy")}
        </Link>
        。
      </p>
    </>
  );
}
