"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** 對齊實際可視區（含 iOS 工具列），讓彈窗整塊進得去、不必再捲 */
export function useDialogFrameHeight(paddingPx = 12) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const sync = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setHeight(Math.max(280, Math.floor(vh - paddingPx)));
    };
    sync();
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
    };
  }, [paddingPx]);

  return height;
}

type FitMediaFrameProps = {
  width: number;
  height: number;
  children: ReactNode;
  className?: string;
  frameClassName?: string;
};

/** 在剩餘空間內等比縮放 9:16 媒體，不撐出捲軸 */
export function FitMediaFrame({
  width,
  height,
  children,
  className,
  frameClassName,
}: FitMediaFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fit = () => {
      const availW = host.clientWidth;
      const availH = host.clientHeight;
      if (availW < 8 || availH < 8) return;
      setScale(Math.min(availW / width, availH / height, 1));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, [width, height]);

  const scaledW = width * scale;
  const scaledH = height * scale;

  return (
    <div
      ref={hostRef}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 items-center justify-center",
        className,
      )}
    >
      <div
        className={cn("overflow-hidden", frameClassName)}
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          style={
            {
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
