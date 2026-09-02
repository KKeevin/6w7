import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DemoBanner } from "@/components/demo/demo-banner";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { getViewer, isMemberViewer } from "@/lib/viewer";
import { SHELL } from "@/shared/shell";

/** 宣傳首頁：有頂欄；已登入也可看，不強制跳 dashboard */
export default async function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();
  const notificationsEnabled = isMemberViewer(viewer);

  return (
    <NotificationProvider enabled={notificationsEnabled}>
      <div
        className={`flex min-h-dvh w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip bg-[var(--bg)] ${SHELL.padHeader} ${SHELL.padFooter}`}
      >
        <SiteHeader />
        {viewer.kind === "demo" ? <DemoBanner /> : null}
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </NotificationProvider>
  );
}
