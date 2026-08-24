import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { VerifyEmailClient } from "@/components/verify-email-client";

export const metadata: Metadata = {
  title: "驗證信箱",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const safeToken = token?.trim() || "";

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        驗證信箱
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        確認這是你的信箱後，忘記密碼才能寄到這裡。
      </p>
      <div className="mt-8">
        {safeToken ? (
          <VerifyEmailClient token={safeToken} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--danger)]">
              缺少驗證連結，請到設定頁重寄。
            </p>
            <Link
              href="/settings#email"
              className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
            >
              去設定信箱
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
