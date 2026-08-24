import type { ReactNode } from "react";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { AdSlot } from "@/components/ads/ad-slot";
import { ADS } from "@/shared/ads";

type AdRailLayoutProps = {
  children: ReactNode;
  /** 有實質說明文字的公開頁用 narrow */
  width?: "narrow" | "wide";
  mobileAd?: boolean;
  className?: string;
};

/**
 * 用於有發布商內容的頁。桌機廣告只放右側（上＋下兩格），手機放內容下方。
 * 登入／註冊／忘記密碼／重設密碼／驗證信箱／設定／404 不要包這層。
 */
export function AdRailLayout({
  children,
  width = "narrow",
  mobileAd = true,
  className = "",
}: AdRailLayoutProps) {
  if (!ADS.enabled) {
    return <>{children}</>;
  }

  const centerMax =
    width === "wide" ? "max-w-6xl" : "max-w-lg sm:max-w-xl";
  const stickyTop = "top-[calc(var(--header-h)+0.75rem)]";

  return (
    <div
      className={`relative mx-auto flex w-full max-w-[90rem] flex-1 justify-center gap-4 px-3 sm:gap-5 sm:px-4 lg:gap-6 lg:px-6 ${className}`}
    >
      <AdSenseScript />

      <div className={`flex min-w-0 w-full flex-1 flex-col ${centerMax}`}>
        {children}
        {mobileAd ? (
          <div className="mt-8 xl:hidden" aria-label="贊助">
            <AdSlot format="mobile" />
          </div>
        ) : null}
      </div>

      <aside
        className={`sticky ${stickyTop} hidden w-[160px] shrink-0 self-start xl:block 2xl:w-[180px]`}
        aria-label="右側贊助"
      >
        <div className="flex flex-col gap-4">
          <AdSlot format="side" />
          <AdSlot format="side" />
        </div>
      </aside>
    </div>
  );
}
