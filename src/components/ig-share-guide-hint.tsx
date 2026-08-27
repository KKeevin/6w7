"use client";

import { useEffect, useState, type RefObject } from "react";
import { SHARE_POINT_AT } from "@/shared/share-story-art";

type Rect = { top: number; left: number; width: number; height: number };

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

export function IgShareGuideHint({
  open,
  mobileRef,
  desktopRef,
  onDismiss,
}: {
  open: boolean;
  mobileRef: RefObject<HTMLElement | null>;
  desktopRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }

    function update() {
      const el = visibleTarget(mobileRef, desktopRef);
      setRect(el ? readRect(el) : null);
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
  }, [open, mobileRef, desktopRef]);

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
  if (tooltipTop + 118 > window.innerHeight) {
    tooltipTop = Math.max(12, rect.top - 118);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <div
        className="ig-guide-hint-frame absolute rounded-[1.15rem]"
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

      <div
        className="pointer-events-auto absolute"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: tooltipWidth,
        }}
      >
        <div className="animate-rise rounded-2xl border border-[var(--line)] bg-white px-3.5 py-3 shadow-[0_16px_40px_rgba(20,33,43,0.2)]">
          <p className="text-sm font-semibold leading-snug text-[var(--ink)]">
            不會發限動？點這裡看我示範一次
          </p>
          <button
            type="button"
            className="mt-2.5 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={onDismiss}
          >
            不要再顯示
          </button>
        </div>
      </div>
    </div>
  );
}
