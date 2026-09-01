import type { ReactNode } from "react";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { AdSlot } from "@/components/ads/ad-slot";
import { ADS, adsMobileReady, adsSideReady } from "@/shared/ads";
import { getT } from "@/lib/locale";

type AdRailLayoutProps = {
  children: ReactNode;
  /** 有實質說明文字的公開頁用 narrow */
  width?: "narrow" | "wide";
  mobileAd?: boolean;
  className?: string;
};

/**
 * 主內容永遠置中並左右留白。廣告有播出才出現在側邊留白／內容下方，不擠壓主欄。
 * 登入／註冊／忘記密碼／重設密碼／驗證信箱／設定／404 不要包這層。
 */
export async function AdRailLayout({
  children,
  width = "narrow",
  mobileAd = true,
  className = "",
}: AdRailLayoutProps) {
  const t = await getT();
  const centerMax = width === "wide" ? "max-w-6xl" : "max-w-lg sm:max-w-xl";
  const stickyTop = "top-[calc(var(--header-h)+0.75rem)]";
  const sideLive = ADS.enabled && adsSideReady();
  const mobileLive = ADS.enabled && adsMobileReady() && mobileAd;
  const sideVisible = width === "wide" ? "2xl:block" : "xl:block";

  return (
    <div
      className={`relative mx-auto flex w-full max-w-[90rem] flex-1 justify-center px-3 sm:px-4 lg:px-6 ${className}`.trim()}
    >
      {ADS.enabled ? <AdSenseScript /> : null}
      <div
        className={`relative flex min-w-0 w-full flex-1 flex-col ${centerMax}`}
      >
        {children}
        {mobileLive ? (
          <div className="relative xl:hidden has-[[data-ad-filled]]:mt-8">
            <AdSlot format="mobile" />
          </div>
        ) : null}
        {sideLive ? (
          <aside
            className={`pointer-events-none absolute top-0 left-full ml-4 hidden w-[160px] ${sideVisible} 2xl:ml-6 2xl:w-[180px]`}
            aria-label={t("ads.sponsor")}
          >
            <div
              className={`pointer-events-auto sticky ${stickyTop} flex flex-col gap-4`}
            >
              <AdSlot format="side" />
              <AdSlot format="side" />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
