import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "登入",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        登入
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        使用你的 IG 帳號登入，管理分享連結與收件匣。
      </p>
      <div className="mt-8">
        <Suspense
          fallback={<p className="text-sm text-[var(--muted)]">載入中…</p>}
        >
          <LoginForm defaultMode="login" redirectTo="/dashboard" />
        </Suspense>
      </div>
    </main>
  );
}
