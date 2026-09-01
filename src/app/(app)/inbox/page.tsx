import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { InboxClient } from "@/components/inbox-client";
import { getViewer } from "@/lib/viewer";
import { getRequestLocale, getT } from "@/lib/locale";
import { loginPath } from "@/shared/paths";
import { toInboxDemoMessages } from "@/shared/demo-account";
import { listInbox } from "@/services/message.service";
import { SHELL_CONTENT } from "@/shared/shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("inbox.title") };
}

export default async function InboxPage() {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/inbox"));
  }

  const t = await getT();
  const locale = await getRequestLocale();
  const demo = viewer.kind === "demo";
  const result = demo
    ? null
    : await listInbox(viewer.user.id, { filter: "all", page: 1 });
  const initialMessages = result?.messages.map((m) => ({
    id: m.id,
    body: m.body,
    topic: m.topic,
    isRead: m.isRead,
    isFeatured: m.isFeatured,
    isArchived: m.isArchived,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    link: m.link,
  }));

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <div className={`${SHELL_CONTENT} w-full`}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold lg:text-4xl">
            {t("inbox.title")}
          </h1>
          <p className="mt-2 text-[var(--muted)] lg:text-lg">
            {t("inbox.lead")}
          </p>
          <div className="mt-8 lg:mt-10">
            <InboxClient
              demoMessages={demo ? toInboxDemoMessages(locale) : undefined}
              initialMessages={initialMessages}
              initialPage={result?.page}
              initialTotal={result?.total}
              initialTotalPages={result?.totalPages}
            />
          </div>
        </div>
      </AdRailLayout>
    </main>
  );
}
