import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { LoggedInPublisherNote } from "@/components/ads/logged-in-publisher-note";
import { SharePageClient } from "@/components/share-page-client";
import { getViewer } from "@/lib/viewer";
import { loginPath } from "@/shared/paths";

export const metadata: Metadata = {
  title: "短網址",
};

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/dashboard"));
  }

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-2 sm:py-3">
      <AdRailLayout width="wide">
        <SharePageClient />
        {viewer.kind === "demo" ? (
          <LoggedInPublisherNote page="dashboard" />
        ) : null}
      </AdRailLayout>
    </main>
  );
}
