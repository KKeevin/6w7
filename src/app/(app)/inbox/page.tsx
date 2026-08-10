import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { InboxClient } from "@/components/inbox-client";
import { SHELL_CONTENT } from "@/shared/shell";

export const metadata: Metadata = {
  title: "收件匣",
};

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?next=/inbox");
  }

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow" rails="right">
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
        </div>
      </AdRailLayout>
    </main>
  );
}
