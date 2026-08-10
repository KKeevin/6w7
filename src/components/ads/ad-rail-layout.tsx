import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/ad-slot";
import { ADS } from "@/shared/ads";

type AdRailLayoutProps = {
  children: ReactNode;
  /** narrow：公開／收件／設定；wide：短網址 dashboard */
  width?: "narrow" | "wide";
  /**
   * both：左右各一（公開頁）
   * right：只在右側垂直疊兩則（dashboard／收件匣／設定）
   */
  rails?: "both" | "right";
  /** 窄螢幕是否在內容下方塞行動廣告 */
  mobileAd?: boolean;
  className?: string;
};

/**
 * 廣告欄版面：可左右雙欄，或僅右側疊放。
 */
export function AdRailLayout({
  children,
  width = "narrow",
  rails = "both",
  mobileAd = true,
  className = "",
}: AdRailLayoutProps) {
  if (!ADS.enabled) {
    return <>{children}</>;
  }

  const centerMax =
    width === "wide" ? "max-w-6xl" : "max-w-lg sm:max-w-xl";
  const stickyTop = "top-[calc(var(--header-h)+0.75rem)]";
  const rightOnly = rails === "right";

  return (
    <div
      className={`relative mx-auto flex w-full max-w-[90rem] flex-1 justify-center gap-4 px-3 sm:gap-5 sm:px-4 lg:gap-6 lg:px-6 ${className}`}
    >
      {!rightOnly ? (
        <aside
          className={`sticky ${stickyTop} hidden w-[160px] shrink-0 self-start xl:block 2xl:w-[180px]`}
          aria-label="左側贊助"
        >
          <AdSlot format="side" />
        </aside>
      ) : null}

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
        {rightOnly ? (
          <div className="flex flex-col gap-4">
            <AdSlot format="side" />
            <AdSlot format="side" />
          </div>
        ) : (
          <AdSlot format="side" />
        )}
      </aside>
    </div>
  );
}
