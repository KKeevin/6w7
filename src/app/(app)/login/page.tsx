import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer, isMemberViewer } from "@/lib/viewer";
import { BrandLogo } from "@/components/brand-logo";
import { LoginPageClient } from "@/components/login-page-client";
import { safeInternalPath } from "@/shared/paths";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.pageTitle") };
}

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const viewer = await getViewer();
  const t = await getT();
  const { next } = await searchParams;
  if (isMemberViewer(viewer)) {
    redirect(safeInternalPath(next));
  }

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <Suspense
        fallback={<p className="text-sm text-[var(--muted)]">{t("common.loading")}</p>}
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
