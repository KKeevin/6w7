"use client";

import { useEffect, useRef, useState } from "react";
import { ADS, adsReady } from "@/shared/ads";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

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
};

/**
 * 只在 AdSense 真正填入時露出。沒播出不畫空框；未填滿時移出主內容流，避免跑版。
 */
export function AdSlot({ format, className = "" }: AdSlotProps) {
  const t = useT();
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [filled, setFilled] = useState(false);
  const [unfilled, setUnfilled] = useState(false);
  const slot = SLOT_BY_FORMAT[format];
  const live = adsReady() && Boolean(slot);

  useEffect(() => {
    if (!live || !insRef.current) return;
    const el = insRef.current;

    const sync = () => {
      const status = el.getAttribute("data-ad-status");
      if (status === "filled") {
        setFilled(true);
        setUnfilled(false);
      } else if (status === "unfilled") {
        setFilled(false);
        setUnfilled(true);
      }
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });

    if (!pushed.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // 交給上面的 observer 收斂狀態，不在 effect 內直接 setState
        el.setAttribute("data-ad-status", "unfilled");
      }
    }

    return () => obs.disconnect();
  }, [live]);

  if (!live) return null;

  return (
    <div
      data-ad-filled={filled ? "" : undefined}
      className={cn(
        unfilled && "hidden",
        filled
          ? "overflow-hidden rounded-2xl border border-[var(--line)]/80 bg-white/70 shadow-sm"
          : "pointer-events-none absolute w-full opacity-0",
        className,
      )}
      aria-hidden={!filled}
    >
      {filled ? (
        <div className="flex items-center justify-between border-b border-[var(--line)]/50 px-2.5 py-1">
          <span className="text-[0.65rem] font-semibold tracking-wide text-[var(--muted)]">
            {t("ads.sponsor")}
          </span>
        </div>
      ) : null}
      <ins
        ref={insRef}
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
