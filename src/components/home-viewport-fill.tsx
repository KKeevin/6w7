"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SHELL_X } from "@/shared/shell";
import { cn } from "@/lib/utils";

const DESKTOP = "(min-width: 1024px)";
/** 約 iPhone SE／最小直式智慧型手機 CSS 高 */
const MIN_PHONE_VIEW_H = 568;
/** 桌機過矮時不硬鎖一屏（筆電瀏覽器被工具列壓很扁） */
const MIN_DESKTOP_VIEW_H = 640;
/** 比 4:5 更扁就當成橫放或被壓扁的視窗，不再硬縮 */
const MAX_PORTRAIT_ASPECT = 0.82;
/** 面板最小縮放：再小視覺會縮到難辨 */
const MIN_PANEL_SCALE = 0.72;

function viewportSize() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function leftoverPx() {
  const { height } = viewportSize();
  const header =
    document.querySelector<HTMLElement>("header")?.offsetHeight ?? 56;
  const footer =
    document.querySelector<HTMLElement>("footer")?.offsetHeight ?? 48;
  return Math.max(0, height - header - footer);
}

function isDesktop() {
  return window.matchMedia(DESKTOP).matches;
}

/** 矮過最小直式手機，或寬高比扁到不像一般直式手機／平板 */
function isBelowMinPhone() {
  const { width, height } = viewportSize();
  if (height < MIN_PHONE_VIEW_H) return true;
  if (width / height > MAX_PORTRAIT_ASPECT) return true;
  return false;
}

function canSqueezeViewport(fillDesktop: boolean) {
  if (isDesktop()) {
    if (!fillDesktop) return false;
    return viewportSize().height >= MIN_DESKTOP_VIEW_H;
  }
  return !isBelowMinPhone();
}

/** 把面板縮進剩餘高度；過矮／過扁時停縮，且不低於最小比例 */
function FitPanel({
  squeeze,
  children,
}: {
  squeeze: boolean;
  children: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{
    scale: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const measure = () => {
      if (!squeeze) {
        setBox(null);
        return;
      }
      const availW = host.clientWidth;
      const availH = host.clientHeight;
      if (availW < 8 || availH < 8) return;
      const naturalW = inner.offsetWidth;
      const naturalH = inner.offsetHeight;
      if (naturalW < 8 || naturalH < 8) return;
      const raw = Math.min(1, availW / naturalW, availH / naturalH);
      const scale = Math.max(MIN_PANEL_SCALE, raw);
      setBox({
        scale,
        width: naturalW * scale,
        height: naturalH * scale,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(inner);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    const media = window.matchMedia(DESKTOP);
    media.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      media.removeEventListener("change", measure);
    };
  }, [squeeze]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "flex min-h-0 min-w-0 max-w-full items-center justify-center",
        squeeze && "h-full",
      )}
    >
      <div
        className="max-w-full"
        style={box ? { width: box.width, height: box.height } : undefined}
      >
        <div
          ref={innerRef}
          style={
            box
              ? {
                  width: box.width / box.scale,
                  transform: `scale(${box.scale})`,
                  transformOrigin: "top left",
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type Props = {
  id?: string;
  labelledBy?: string;
  className?: string;
  innerClassName?: string;
  copy: ReactNode;
  panel: ReactNode;
  /** 桌機也鎖一屏高度（註冊區）；第一屏不要開 */
  fillDesktop?: boolean;
};

/** 一屏：高度 = 目前可視區 − 頂欄 − 頁尾。預設只套手機；`fillDesktop` 連桌機一起。 */
export function HomeViewportSection({
  id,
  labelledBy,
  className,
  innerClassName,
  copy,
  panel,
  fillDesktop = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [squeeze, setSqueeze] = useState(true);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sync = () => {
      const canSqueeze = canSqueezeViewport(fillDesktop);
      setSqueeze(canSqueeze);
      if (isDesktop() && !fillDesktop) {
        section.style.height = "";
        section.style.minHeight = "";
        return;
      }
      const leftover = leftoverPx();
      section.style.minHeight = `${leftover}px`;
      section.style.height = canSqueeze ? `${leftover}px` : "auto";
    };

    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    const media = window.matchMedia(DESKTOP);
    media.addEventListener("change", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      media.removeEventListener("change", sync);
    };
  }, [fillDesktop]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "bg-atmosphere relative overflow-x-clip",
        squeeze &&
          (fillDesktop
            ? "h-[calc(100svh-var(--header-h)-var(--footer-h))] overflow-y-clip"
            : "max-lg:h-[calc(100svh-var(--header-h)-var(--footer-h))] max-lg:overflow-y-clip"),
        className,
      )}
    >
      <div
        className={cn(
          SHELL_X,
          "relative grid min-w-0 grid-cols-1 items-center gap-3 py-3 lg:items-center lg:gap-10",
          squeeze &&
            (fillDesktop
              ? "h-full max-lg:grid-rows-[auto_minmax(0,1fr)] max-lg:items-stretch"
              : "max-lg:h-full max-lg:grid-rows-[auto_minmax(0,1fr)] max-lg:items-stretch"),
          innerClassName,
        )}
      >
        <div className="animate-rise min-w-0 max-w-full">{copy}</div>
        <div
          className={cn(
            "animate-rise-delay min-w-0 max-w-full",
            squeeze && (fillDesktop ? "min-h-0 h-full" : "min-h-0 max-lg:h-full"),
          )}
        >
          <FitPanel squeeze={squeeze}>{panel}</FitPanel>
        </div>
      </div>
    </section>
  );
}
