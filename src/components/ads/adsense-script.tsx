import Script from "next/script";
import { ADS, adsClientReady } from "@/shared/ads";

/**
 * 有 ca-pub 就載入（放進 head），供 Google 驗證網站擁有權與之後播廣告。
 * 版位是否顯示另由 NEXT_PUBLIC_ADS_ENABLED 控制。
 */
export function AdSenseScript() {
  if (!adsClientReady()) return null;
  return (
    <Script
      id="adsense-loader"
      async
      strategy="beforeInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
      crossOrigin="anonymous"
    />
  );
}
