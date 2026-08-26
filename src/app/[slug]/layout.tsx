import { SiteFooter } from "@/components/site-footer";
import { SHELL } from "@/shared/shell";

export default function PublicLinkLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`flex min-h-dvh flex-1 flex-col overflow-x-hidden ${SHELL.padFooter}`}>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
