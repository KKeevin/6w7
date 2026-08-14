/**
 * 廣告版位設定（前端可讀的公開設定）。
 * 正式投放建議 Google AdSense；未設定 client 時顯示佔位框方便對版。
 */
export const ADS = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  /** ca-pub-xxxxxxxx */
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "",
  /** 桌機右側直式（上、下各一格） */
  slotSide: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE?.trim() || "",
  /** 行動／窄螢幕（內容下方） */
  slotMobile: process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE?.trim() || "",
} as const;

/** 有發布商 ID 即可載入驗證／廣告腳本（不必等版位 slot） */
export function adsClientReady() {
  return Boolean(ADS.client);
}

/** 開關開啟且有 client：顯示版位（有 slot 才播真廣告） */
export function adsReady() {
  return Boolean(ADS.enabled && ADS.client);
}
