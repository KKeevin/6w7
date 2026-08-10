import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { auth } from "@/lib/auth";
import { SHELL } from "@/shared/shell";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const notificationsEnabled = Boolean(session?.user?.id);

  return (
    <NotificationProvider enabled={notificationsEnabled}>
      <div className={`flex min-h-dvh flex-1 flex-col ${SHELL.padFooter}`}>
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </NotificationProvider>
  );
}
