"use client";

import { useEffect } from "react";

type Saved = {
  htmlOverflow: string;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyPaddingRight: string;
  bodyOverscroll: string;
  htmlOverscroll: string;
  scrollY: number;
};

let lockCount = 0;
let saved: Saved | null = null;

function canScrollInside(target: EventTarget | null) {
  let node: Element | null = target instanceof Element ? target : null;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const y =
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 1;
    const x =
      (overflowX === "auto" || overflowX === "scroll") &&
      node.scrollWidth > node.clientWidth + 1;
    if (y || x) return true;
    node = node.parentElement;
  }
  return false;
}

function onGuard(event: Event) {
  if (canScrollInside(event.target)) return;
  event.preventDefault();
}

const guardOpts = { passive: false, capture: true } as const;

function applyLock() {
  if (typeof document === "undefined" || saved) return;
  const html = document.documentElement;
  const body = document.body;
  const scrollbar = window.innerWidth - html.clientWidth;
  saved = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    bodyPaddingRight: body.style.paddingRight,
    bodyOverscroll: body.style.overscrollBehavior,
    htmlOverscroll: html.style.overscrollBehavior,
    scrollY: window.scrollY,
  };
  html.dataset.scrollLocked = "1";
  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";
  body.style.overflow = "hidden";
  body.style.overscrollBehavior = "none";
  body.style.position = "fixed";
  body.style.top = `-${saved.scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  document.addEventListener("wheel", onGuard, guardOpts);
  document.addEventListener("touchmove", onGuard, guardOpts);
}

function releaseLock() {
  if (!saved) return;
  const html = document.documentElement;
  const body = document.body;
  document.removeEventListener("wheel", onGuard, guardOpts);
  document.removeEventListener("touchmove", onGuard, guardOpts);
  delete html.dataset.scrollLocked;
  html.style.overflow = saved.htmlOverflow;
  html.style.overscrollBehavior = saved.htmlOverscroll;
  body.style.overflow = saved.bodyOverflow;
  body.style.overscrollBehavior = saved.bodyOverscroll;
  body.style.position = saved.bodyPosition;
  body.style.top = saved.bodyTop;
  body.style.left = saved.bodyLeft;
  body.style.right = saved.bodyRight;
  body.style.width = saved.bodyWidth;
  body.style.paddingRight = saved.bodyPaddingRight;
  const y = saved.scrollY;
  saved = null;
  window.scrollTo(0, y);
}

/** 鎖住期間若程式把頁面捲到別處，解鎖時跟過去，不要跳回鎖定當下的位置 */
export function noteLockedScrollY(y: number) {
  if (saved) saved.scrollY = y;
}

/** 有 modal 時鎖住背景頁捲動；可疊加，全部關掉才恢復 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    if (lockCount === 0) applyLock();
    lockCount += 1;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
}
