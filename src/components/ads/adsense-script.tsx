import Script from "next/script";
import { ADS, adsClientReady } from "@/shared/ads";

/**
 * 僅掛在有發布商內容的版面（AdRailLayout），勿放進根 layout。
 * 全站載入會讓登入頁也被判定「無內容畫面播廣告」。
 * beforeInteractive 只能寫在根 layout；lazyOnload 避免廣告腳本卡住 LCP。
 */
export function AdSenseScript() {
  if (!adsClientReady()) return null;
  return (
    <Script
      id="adsense-loader"
      strategy="lazyOnload"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
      crossOrigin="anonymous"
    />
  );
}
