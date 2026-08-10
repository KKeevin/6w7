import { SiteFooter } from "@/components/site-footer";
import { SHELL } from "@/shared/shell";

/** 未登入落地頁：無頂部導覽；footer 與全站同尺寸 */
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`flex min-h-dvh flex-1 flex-col bg-[#f5f7fa] ${SHELL.padFooter}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}
