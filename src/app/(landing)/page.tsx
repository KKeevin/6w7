import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { BRAND } from "@/shared/tools";

export const metadata: Metadata = {
  title: `${BRAND.en}（${BRAND.zh}）`,
  description: BRAND.tagline,
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      {/* 左側品牌區 */}
      <section className="relative flex shrink-0 flex-col justify-center px-6 pb-5 pt-10 sm:px-10 sm:pb-6 sm:pt-12 lg:w-[56%] lg:flex-none lg:px-12 lg:py-6 xl:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_20%,rgba(49,151,229,0.18),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_80%,rgba(255,90,60,0.12),transparent_50%)]" />

        <div className="relative z-10 mx-auto w-full max-w-md text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <BrandLogo height={40} priority className="lg:hidden" />
            <BrandLogo height={64} priority className="hidden lg:block" />
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-3xl lg:mt-8 lg:text-5xl lg:leading-[1.12] [@media(max-height:740px)]:lg:mt-4 [@media(max-height:740px)]:lg:text-3xl">
            用連結收下
            <span className="text-[#3197e5]">匿名訊息</span>
            。
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)] sm:text-base lg:mx-0 lg:mt-4 lg:max-w-lg lg:text-lg [@media(max-height:740px)]:lg:mt-2 [@media(max-height:740px)]:lg:text-sm">
            {BRAND.tagline}
          </p>
        </div>
      </section>

      {/* 右側登入／註冊 */}
      <section className="flex flex-1 items-start justify-center px-4 pt-4 pb-8 sm:px-8 sm:pt-5 lg:w-[44%] lg:flex-none lg:items-center lg:bg-white lg:px-10 lg:py-6 lg:shadow-[-12px_0_32px_rgba(20,33,43,0.04)]">
        <div className="w-full max-w-[380px] rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7 lg:border-0 lg:p-0 lg:shadow-none">
          <h2 className="text-xl font-bold text-[var(--ink)]">
            開始使用 {BRAND.en}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            用 IG 帳號註冊，馬上拿到專屬連結。
          </p>
          <div className="mt-5">
            <Suspense
              fallback={
                <p className="text-sm text-[var(--muted)]">載入中…</p>
              }
            >
              <LoginForm
                defaultMode="register"
                redirectTo="/dashboard"
                compact
              />
            </Suspense>
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
        </div>
      </section>
    </main>
  );
}
