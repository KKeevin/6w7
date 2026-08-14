import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { LoggedInPublisherNote } from "@/components/ads/logged-in-publisher-note";
import { InboxClient } from "@/components/inbox-client";
import { getViewer } from "@/lib/viewer";
import { SHELL_CONTENT } from "@/shared/shell";

export const metadata: Metadata = {
  title: "收件匣",
};

export default async function InboxPage() {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect("/login?next=/inbox");
  }

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <div className={`${SHELL_CONTENT} w-full`}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold lg:text-4xl">
            收件匣
          </h1>
          <p className="mt-2 text-[var(--muted)] lg:text-lg">
            點開留言才會顯示內容並標為已讀；可精選、封存、刪除、檢舉，或產生限動圖卡。
          </p>
          <div className="mt-8 lg:mt-10">
            <InboxClient />
          </div>
          {viewer.kind === "demo" ? (
            <LoggedInPublisherNote page="inbox" />
          ) : null}
        </div>
      </AdRailLayout>
    </main>
  );
}
