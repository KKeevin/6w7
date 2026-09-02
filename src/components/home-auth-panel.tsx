"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

type Props = {
  /** 外層已有標題時，只留提示與表單 */
  embedded?: boolean;
};

/** 首頁註冊／登入卡 */
export function HomeAuthPanel({ embedded = false }: Props) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const t = useT();

  return (
    <>
      {embedded ? null : (
        <>
          <h2 className="text-xl font-bold text-[var(--ink)]">
            {mode === "login"
              ? t("home.welcomeBack")
              : t("home.startUsing", { brand: BRAND.en })}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {mode === "login" ? t("home.loginHint") : t("home.registerHint")}
          </p>
        </>
      )}
      {embedded ? (
        <p className="text-sm text-[var(--muted)]">
          {mode === "login" ? t("home.loginHint") : t("home.registerHint")}
        </p>
      ) : null}
      <div className={embedded ? "mt-4" : "mt-5"}>
        <LoginForm
          defaultMode="register"
          redirectTo="/dashboard"
          compact
          hideDemo
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
