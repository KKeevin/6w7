import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "重設密碼",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const safeToken = token?.trim() || "";

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        重設密碼
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        設定一組新密碼後，再用 IG 帳號登入。
      </p>
      <div className="mt-8">
        {safeToken ? (
          <ResetPasswordForm token={safeToken} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--danger)]">
              缺少重設連結，請重新申請。
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
            >
              去申請重設連結
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
