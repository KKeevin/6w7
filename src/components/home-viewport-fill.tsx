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

function onViewportChange(handler: () => void) {
  window.addEventListener("resize", handler);
  const view = window.visualViewport;
  view?.addEventListener("resize", handler);
  view?.addEventListener("scroll", handler);
  const media = window.matchMedia(DESKTOP);
  media.addEventListener("change", handler);
  return () => {
    window.removeEventListener("resize", handler);
    view?.removeEventListener("resize", handler);
    view?.removeEventListener("scroll", handler);
    media.removeEventListener("change", handler);
  };
}

type FitBox = {
  scale: number;
  width: number;
  height: number;
};

function sameBox(a: FitBox | null, b: FitBox) {
  if (!a) return false;
  return (
    Math.abs(a.scale - b.scale) < 0.002 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * 把面板縮進宿主剩餘空間。
 * 寬度一律以宿主 clientWidth 為準，避免量到「已經縮過的自己」越縮越窄。
 */
function FitPanel({
  squeeze,
  fillWidth,
  children,
}: {
  squeeze: boolean;
  /** 表單等應吃滿欄寬；手機預覽維持內容固有寬 */
  fillWidth?: boolean;
  children: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<FitBox | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    const measure = () => {
      if (!squeeze) {
        setBox(null);
        inner.style.transform = "";
        inner.style.width = "";
        return;
      }
      const availW = host.clientWidth;
      const availH = host.clientHeight;
      if (availW < 8 || availH < 8) return;

      inner.style.transform = "none";
      inner.style.width = fillWidth ? `${availW}px` : "max-content";

      const naturalW = fillWidth ? availW : Math.max(inner.offsetWidth, 1);
      const naturalH = inner.offsetHeight;
      if (naturalW < 8 || naturalH < 8) return;

      const raw = Math.min(1, availW / naturalW, availH / naturalH);
      const scale = Math.max(MIN_PANEL_SCALE, raw);
      const next: FitBox = {
        scale,
        width: naturalW * scale,
        height: naturalH * scale,
      };
      setBox((prev) => (sameBox(prev, next) ? prev : next));
    };

    measure();
    const frame = window.requestAnimationFrame(() => {
      measure();
      window.requestAnimationFrame(measure);
    });
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(inner);
    const stopViewport = onViewportChange(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      stopViewport();
    };
  }, [squeeze, fillWidth]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "flex w-full min-h-0 min-w-0 max-w-full items-center justify-center overflow-hidden",
        squeeze && "h-full",
      )}
    >
      <div
        className="max-w-full"
        style={box ? { width: box.width, height: box.height } : undefined}
      >
        <div
          ref={innerRef}
          className={fillWidth ? "w-full" : undefined}
          style={
            box
              ? {
                  width: box.width / box.scale,
                  transform: `scale(${box.scale})`,
                  transformOrigin: fillWidth ? "top center" : "top left",
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
  /** 面板（註冊表單）吃滿格子寬，高度不夠再整塊縮小 */
  fillWidth?: boolean;
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
  fillWidth = false,
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
    const stopViewport = onViewportChange(sync);
    return stopViewport;
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
            "animate-rise-delay min-w-0 w-full max-w-full",
            squeeze && (fillDesktop ? "min-h-0 h-full" : "min-h-0 max-lg:h-full"),
          )}
        >
          <FitPanel squeeze={squeeze} fillWidth={fillWidth}>
            {panel}
          </FitPanel>
        </div>
      </div>
    </section>
  );
}
