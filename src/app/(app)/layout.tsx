import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { DemoBanner } from "@/components/demo/demo-banner";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { getViewer, isMemberViewer } from "@/lib/viewer";
import { SHELL } from "@/shared/shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();
  const notificationsEnabled = isMemberViewer(viewer);

  return (
    <NotificationProvider enabled={notificationsEnabled}>
      <div
        className={`flex min-h-dvh flex-1 flex-col ${SHELL.padHeader} ${SHELL.padFooter}`}
      >
        <SiteHeader />
        {viewer.kind === "demo" ? <DemoBanner /> : null}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </NotificationProvider>
  );
}
