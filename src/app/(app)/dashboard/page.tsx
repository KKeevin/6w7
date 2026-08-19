import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { LoggedInPublisherNote } from "@/components/ads/logged-in-publisher-note";
import { SharePageClient } from "@/components/share-page-client";
import { getViewer } from "@/lib/viewer";
import { loginPath } from "@/shared/paths";
import { getProfileForOwner } from "@/services/ask-link.service";

export const metadata: Metadata = {
  title: "短網址",
};

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/dashboard"));
  }

  const profile = await getProfileForOwner(viewer.user.id);

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-2 sm:py-3">
      <AdRailLayout width="wide">
        <SharePageClient
          initialProfile={{
            user: profile.user,
            link: {
              id: profile.link.id,
              slug: profile.link.slug,
              title: profile.link.title,
              prompt: profile.link.prompt,
              acceptingMessages: profile.link.acceptingMessages,
              url: profile.link.url,
              topics: profile.link.topics,
              requireTopic: profile.link.requireTopic,
            },
          }}
        />
        {viewer.kind === "demo" ? (
          <LoggedInPublisherNote page="dashboard" />
        ) : null}
      </AdRailLayout>
    </main>
  );
}
