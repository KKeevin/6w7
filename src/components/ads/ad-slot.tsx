"use client";

import { useEffect, useRef } from "react";
import { ADS, adsReady } from "@/shared/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdFormat = "side" | "mobile";

const SLOT_BY_FORMAT: Record<AdFormat, string> = {
  side: ADS.slotSide,
  mobile: ADS.slotMobile,
};

type AdSlotProps = {
  format: AdFormat;
  className?: string;
  /** 無廣告碼時是否仍顯示佔位（方便對版） */
  showPlaceholder?: boolean;
};

/**
 * Google AdSense 單元；未設定時顯示品牌風格佔位。
 * 版型刻意克制，避免干擾留言主流程。
 */
export function AdSlot({
  format,
  className = "",
  showPlaceholder = true,
}: AdSlotProps) {
  const pushed = useRef(false);
  const slot = SLOT_BY_FORMAT[format];
  const live = adsReady() && Boolean(slot);

  useEffect(() => {
    if (!live || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* AdSense 未載入或被擋時忽略 */
    }
  }, [live]);

  if (!ADS.enabled) return null;

  if (!live) {
    if (!showPlaceholder) return null;
    return (
      <div
        className={`flex flex-col overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-white/50 ${className}`}
        aria-hidden
      >
        <div className="flex items-center justify-between border-b border-[var(--line)]/60 px-2.5 py-1.5">
          <span className="text-[0.65rem] font-semibold tracking-wide text-[var(--muted)]">
            贊助
          </span>
          <span className="text-[0.6rem] text-[var(--muted)]/80">6w7</span>
        </div>
        <div
          className={`flex flex-1 items-center justify-center bg-[var(--surface)]/60 px-3 text-center text-[0.7rem] leading-relaxed text-[var(--muted)] ${
            format === "side" ? "min-h-[280px]" : "min-h-[100px] py-6"
          }`}
        >
          廣告版位
          <br />
          <span className="opacity-70">設定 AdSense 後顯示</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--line)]/80 bg-white/70 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--line)]/50 px-2.5 py-1">
        <span className="text-[0.65rem] font-semibold tracking-wide text-[var(--muted)]">
          贊助
        </span>
      </div>
      <ins
        className="adsbygoogle block"
        style={{
          display: "block",
          minHeight: format === "side" ? 280 : 100,
          width: "100%",
        }}
        data-ad-client={ADS.client}
        data-ad-slot={slot}
        data-ad-format={format === "side" ? "vertical" : "horizontal"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
