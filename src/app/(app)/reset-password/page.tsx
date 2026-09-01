import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("reset.title"),
    robots: { index: false, follow: false },
  };
}

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const t = await getT();
  const { token } = await searchParams;
  const safeToken = token?.trim() || "";

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {t("reset.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("reset.lead")}</p>
      <div className="mt-8">
        {safeToken ? (
          <ResetPasswordForm token={safeToken} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--danger)]">{t("reset.missing")}</p>
            <Link
              href="/forgot-password"
              className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
            >
              {t("reset.goRequest")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
