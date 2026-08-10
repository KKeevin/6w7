import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { SharePageClient } from "@/components/share-page-client";

export const metadata: Metadata = {
  title: "短網址",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?mode=register&next=/dashboard");
  }

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-2 sm:py-3">
      <AdRailLayout width="wide" rails="right">
        <SharePageClient />
      </AdRailLayout>
    </main>
  );
}
