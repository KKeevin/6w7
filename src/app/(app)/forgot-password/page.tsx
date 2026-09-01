import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("forgot.title"),
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {t("forgot.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("forgot.lead")}</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
