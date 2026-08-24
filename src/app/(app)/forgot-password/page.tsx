import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "忘記密碼",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        忘記密碼
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        輸入 IG 帳號或已綁定的信箱，我們會寄重設連結。
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
