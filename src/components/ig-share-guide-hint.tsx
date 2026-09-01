"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { SHARE_POINT_AT } from "@/shared/share-story-art";

type Rect = { top: number; left: number; width: number; height: number };

export type CoachHintAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

function visibleTarget(
  mobileRef: RefObject<HTMLElement | null>,
  desktopRef: RefObject<HTMLElement | null>,
): HTMLElement | null {
  for (const ref of [mobileRef, desktopRef]) {
    const el = ref.current;
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) return el;
  }
  return null;
}

function readRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  const pad = 5;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

function placeAside(
  rect: Rect,
  tooltipW: number,
  tooltipH: number,
): { top: number; left: number } {
  const gap = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rightSpace = vw - (rect.left + rect.width);
  const leftSpace = rect.left;
  let top = Math.min(
    Math.max(12, rect.top + (rect.height - tooltipH) / 2),
    vh - tooltipH - 12,
  );
  if (rightSpace >= tooltipW + gap + 12) {
    return { top, left: rect.left + rect.width + gap };
  }
  if (leftSpace >= tooltipW + gap + 12) {
    return { top, left: rect.left - tooltipW - gap };
  }
  const left = Math.min(Math.max(12, (vw - tooltipW) / 2), vw - tooltipW - 12);
  let stacked = rect.top - tooltipH - gap;
  if (stacked < 12) stacked = Math.min(rect.top + 12, vh - tooltipH - 12);
  return { top: Math.max(12, stacked), left };
}

export function IgShareGuideHint({
  open,
  mobileRef,
  desktopRef,
  message,
  frameClassName = "rounded-[1.15rem]",
  actions,
  placement = "spotlight",
}: {
  open: boolean;
  mobileRef: RefObject<HTMLElement | null>;
  desktopRef: RefObject<HTMLElement | null>;
  message: string;
  frameClassName?: string;
  actions?: CoachHintAction[];
  placement?: "spotlight" | "aside";
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(118);

  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }

    function update() {
      const el = visibleTarget(mobileRef, desktopRef);
      setRect(el ? readRect(el) : null);
      const h = tooltipRef.current?.offsetHeight;
      if (h && h > 0) setTooltipH(h);
    }

    update();
    const id = window.setInterval(update, 200);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [open, mobileRef, desktopRef, message]);

  useEffect(() => {
    if (!open || placement === "aside") return;
    const el = visibleTarget(mobileRef, desktopRef);
    el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, [open, message, mobileRef, desktopRef, placement]);

  if (!open || !rect) return null;

  const pointerH = Math.min(168, Math.max(120, rect.height * 2.4));
  const scale = pointerH / SHARE_POINT_AT.height;
  const pointerW = SHARE_POINT_AT.width * scale;
  const tipX = SHARE_POINT_AT.tipX * scale;
  const tipY = SHARE_POINT_AT.tipY * scale;

  const spaceRight = window.innerWidth - (rect.left + rect.width);
  const flip = spaceRight < pointerW * 0.42;
  const fingerX = flip ? rect.left + 14 : rect.left + rect.width - 14;
  const fingerY = rect.top + rect.height / 2;
  let imgLeft = flip ? fingerX - (pointerW - tipX) : fingerX - tipX;
  let imgTop = fingerY - tipY;
  imgLeft = Math.min(Math.max(8, imgLeft), window.innerWidth - pointerW - 8);
  imgTop = Math.min(Math.max(8, imgTop), window.innerHeight - pointerH - 8);

  const tooltipWidth = Math.min(260, window.innerWidth - 24);
  let tooltipTop = rect.top + rect.height + 14;
  let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
  tooltipLeft = Math.min(
    Math.max(12, tooltipLeft),
    window.innerWidth - tooltipWidth - 12,
  );
  if (tooltipTop + tooltipH + 12 > window.innerHeight) {
    tooltipTop = Math.max(12, rect.top - tooltipH - 12);
  }
  if (placement === "aside") {
    const parked = placeAside(rect, tooltipWidth, tooltipH);
    tooltipTop = parked.top;
    tooltipLeft = parked.left;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {placement === "spotlight" ? (
        <>
          <div
            className={`ig-guide-hint-frame absolute ${frameClassName}`}
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SHARE_POINT_AT.src}
            alt=""
            width={Math.round(pointerW)}
            height={Math.round(pointerH)}
            className={`ig-guide-hint-pointer absolute ${
              flip ? "ig-guide-hint-pointer-flip" : ""
            }`}
            style={{
              width: pointerW,
              height: pointerH,
              left: imgLeft,
              top: imgTop,
            }}
          />
        </>
      ) : null}

      <div
        className="pointer-events-auto absolute"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
        }}
      >
        <div
          ref={tooltipRef}
          className="animate-rise rounded-2xl border border-[var(--line)] bg-white px-3.5 py-3 shadow-[0_16px_40px_rgba(20,33,43,0.2)]"
        >
          <p className="text-sm font-semibold leading-snug text-[var(--ink)]">
            {message}
          </p>
          {actions && actions.length > 0 ? (
            <div className="mt-2.5 grid gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={
                    action.primary
                      ? "w-full rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      : "w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface)]"
                  }
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
