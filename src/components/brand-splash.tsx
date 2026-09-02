"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/components/i18n-provider";
import {
  noteLockedScrollY,
  useLockBodyScroll,
} from "@/lib/lock-body-scroll";

export const HOME_LOGO_SPLASH_MS = 800;
export const HOME_LOGO_SPLASH_EVENT = "6w7:home-logo-splash";
const STORAGE_KEY = "6w7.home.logoSplash";

export function BrandSplashLockup() {
  const t = useT();
  const kicker = t("share.kicker");
  const letters = [...kicker];
  const compact = letters.filter((ch) => ch.trim()).length <= 6;

  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex flex-col items-stretch">
        <div className="inline-flex items-end">
          <BrandLogo height={52} priority />
          <span className="-ml-0.5 translate-y-[-3px] font-[family-name:var(--font-display)] text-[1.65rem] font-bold leading-none tracking-tight text-[var(--ink)]">
            .link
          </span>
        </div>
        {compact ? (
          <p className="mt-1.5 flex w-full justify-between pl-1 text-sm font-semibold leading-none text-[var(--muted)]">
            {letters.map((ch, i) => (
              <span key={`${ch}-${i}`}>{ch}</span>
            ))}
          </p>
        ) : null}
      </div>
      {compact ? null : (
        <p className="mt-3 whitespace-nowrap text-base font-medium tracking-[0.32em] text-[var(--muted)]">
          {kicker}
        </p>
      )}
    </div>
  );
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function triggerHomeLogoSplash() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(HOME_LOGO_SPLASH_EVENT));
}

function scrollHomeTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  noteLockedScrollY(0);
  if (window.location.pathname === "/" && window.location.hash) {
    window.history.replaceState(null, "", "/");
  }
}

/** Header logo：全畫面 logo 置中片刻（無教程文案），再停在首頁最上方 */
export function HomeLogoSplashHost() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number>(0);
  useLockBodyScroll(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && pathname === "/") scrollHomeTop();
  }, [open, pathname]);

  useEffect(() => {
    function show() {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* private mode */
      }
      scrollHomeTop();
      if (prefersReducedMotion()) {
        setOpen(false);
        return;
      }
      setOpen(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(false), HOME_LOGO_SPLASH_MS);
    }

    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") show();
    } catch {
      /* private mode */
    }
    window.addEventListener(HOME_LOGO_SPLASH_EVENT, show);
    return () => {
      window.removeEventListener(HOME_LOGO_SPLASH_EVENT, show);
      window.clearTimeout(timer.current);
    };
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="bg-atmosphere fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("common.home")}
    >
      <div className="home-logo-splash-rise">
        <BrandSplashLockup />
      </div>
    </div>,
    document.body,
  );
}
