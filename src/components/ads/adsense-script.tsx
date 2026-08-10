import Script from "next/script";
import { ADS, adsReady } from "@/shared/ads";

/** 僅在啟用且有 client id 時載入 AdSense */
export function AdSenseScript() {
  if (!adsReady()) return null;
  return (
    <Script
      id="adsense-loader"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`}
      crossOrigin="anonymous"
    />
  );
}
