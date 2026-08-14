import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { BrandLogo } from "@/components/brand-logo";
import { LoginPageClient } from "@/components/login-page-client";

export const metadata: Metadata = {
  title: "登入",
};

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer.kind === "user") {
    redirect("/dashboard");
  }

  return (
    <main className="bg-atmosphere mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <BrandLogo height={40} className="mb-4" />
      <Suspense
        fallback={<p className="text-sm text-[var(--muted)]">載入中…</p>}
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
