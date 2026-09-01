import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { EmailNudge } from "@/components/email-nudge";
import { SharePageClient } from "@/components/share-page-client";
import { getViewer } from "@/lib/viewer";
import { getT } from "@/lib/locale";
import { loginPath } from "@/shared/paths";
import { getProfileForOwner } from "@/services/ask-link.service";
import { ensureDemoAccount } from "@/services/demo-account.service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.shortUrl") };
}

type Props = { searchParams: Promise<{ welcome?: string; guideHint?: string; tour?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/dashboard"));
  }

  if (viewer.kind === "demo") {
    await ensureDemoAccount();
  }

  const { welcome, guideHint, tour } = await searchParams;
  const profile = await getProfileForOwner(viewer.user.id);
  const emailVerified = Boolean(profile.user.emailVerified);

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-2 sm:py-3 lg:overflow-x-hidden lg:py-1">
      <AdRailLayout width="wide">
        {viewer.kind === "user" && !emailVerified ? (
          <EmailNudge
            welcome={welcome === "1"}
            hasEmail={Boolean(profile.user.email)}
            verified={emailVerified}
          />
        ) : null}
        <SharePageClient
          isDemoAccount={viewer.kind === "demo"}
          forceGuideHint={viewer.kind === "demo" && guideHint === "1"}
          forceTour={tour === "1"}
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
            stickers: profile.stickers,
          }}
        />
      </AdRailLayout>
    </main>
  );
}
