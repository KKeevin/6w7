"use client";

import { useEffect, useState, type RefObject } from "react";

/** 等比縮放下限：再小正文字會看不清 */
export const UNIFORM_FIT_MIN = 0.9;
/** 等比縮放上限：避免超寬螢幕把區塊拉出可讀範圍 */
export const UNIFORM_FIT_MAX = 1.22;

const DESKTOP_MQ = "(min-width: 1024px)";

export type UniformFit = {
  scale: number;
  width: number;
  height: number;
};

/**
 * 依視窗把整塊內容做「等比」縮放（寬高同一個倍數），
 * 內部標題／卡片／預覽的相對大小不變。
 */
export function useUniformFitScale(
  slotRef: RefObject<HTMLElement | null>,
  boardRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): UniformFit {
  const [fit, setFit] = useState<UniformFit>({
    scale: 1,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const slot = slotRef.current;
    const board = boardRef.current;
    if (!enabled || !slot || !board) {
      setFit({ scale: 1, width: 0, height: 0 });
      return;
    }

    const mq = window.matchMedia(DESKTOP_MQ);
    let frame = 0;

    function apply() {
      if (!mq.matches) {
        setFit({ scale: 1, width: 0, height: 0 });
        return;
      }
      const natW = board.offsetWidth;
      const natH = board.offsetHeight;
      if (natW <= 0 || natH <= 0) return;

      const footer = document.querySelector("footer");
      const footerH =
        footer instanceof HTMLElement ? footer.getBoundingClientRect().height : 48;
      const availW = Math.max(320, window.innerWidth - 32);
      const availH = Math.max(
        240,
        window.innerHeight - slot.getBoundingClientRect().top - footerH - 8,
      );
      const next = Math.min(
        UNIFORM_FIT_MAX,
        Math.max(UNIFORM_FIT_MIN, Math.min(availW / natW, availH / natH)),
      );
      const scale = Math.round(next * 1000) / 1000;
      setFit((prev) => {
        if (
          prev.scale === scale &&
          prev.width === natW &&
          prev.height === natH
        ) {
          return prev;
        }
        return { scale, width: natW, height: natH };
      });
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    }

    schedule();
    mq.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [boardRef, enabled, slotRef]);

  return fit;
}
