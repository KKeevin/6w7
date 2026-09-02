"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  HOME_LOGO_SPLASH_EVENT,
  HOME_LOGO_SPLASH_MS,
} from "@/components/brand-splash";
import {
  attachHomeScrollMagnet,
  goToHomeMagnet,
  nextHomeMagnetY,
} from "@/lib/home-start-scroll";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

type Fab = "hidden" | "next" | "top";

const BACK_TO_TOP_AFTER_MS = 2000;

/** 首頁手機捲動磁吸＋往下跳下一格／回到最上面 */
export function HomeScrollMagnet() {
  const t = useT();
  const [fab, setFab] = useState<Fab>("hidden");
  const show = fab !== "hidden";
  const toTop = fab === "top";

  useEffect(() => attachHomeScrollMagnet(), []);

  useEffect(() => {
    let logoReturn = false;
    let logoReturnTimer = 0;
    let endTimer = 0;

    function clearEndTimer() {
      window.clearTimeout(endTimer);
      endTimer = 0;
    }

    function sync() {
      if (logoReturn) {
        clearEndTimer();
        setFab("next");
        return;
      }
      if (document.documentElement.dataset.scrollLocked === "1") {
        clearEndTimer();
        setFab("hidden");
        return;
      }
      if (nextHomeMagnetY() != null) {
        clearEndTimer();
        setFab("next");
        return;
      }
      setFab((prev) => (prev === "top" ? "top" : "hidden"));
      if (endTimer) return;
      endTimer = window.setTimeout(() => {
        endTimer = 0;
        if (document.documentElement.dataset.scrollLocked === "1") return;
        if (nextHomeMagnetY() != null) {
          setFab("next");
          return;
        }
        setFab("top");
      }, BACK_TO_TOP_AFTER_MS);
    }

    function onLogoSplash() {
      logoReturn = true;
      clearEndTimer();
      setFab("next");
      window.clearTimeout(logoReturnTimer);
      logoReturnTimer = window.setTimeout(() => {
        logoReturn = false;
        sync();
      }, HOME_LOGO_SPLASH_MS + 80);
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("resize", sync);
    window.addEventListener(HOME_LOGO_SPLASH_EVENT, onLogoSplash);
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });
    return () => {
      window.clearTimeout(logoReturnTimer);
      clearEndTimer();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      window.removeEventListener(HOME_LOGO_SPLASH_EVENT, onLogoSplash);
      mo.disconnect();
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--footer-h)+0.7rem)] z-[45] flex justify-end px-3 lg:hidden"
    >
      <button
        type="button"
        aria-hidden={!show}
        tabIndex={show ? 0 : -1}
        aria-label={t(toTop ? "home.backToTop" : "home.nextStop")}
        className={cn(
          "pointer-events-auto flex w-[3.35rem] flex-col items-center gap-0.5 rounded-[1.2rem] border-2 border-[var(--ink)] px-1 py-2 font-[family-name:var(--font-display)] text-[10px] font-bold leading-none tracking-tight shadow-[3px_3px_0_0_var(--ink)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_0_var(--ink)]",
          toTop
            ? "bg-[linear-gradient(165deg,#148f76_0%,var(--mint)_48%,#4ec8ad_100%)] text-white"
            : "bg-[linear-gradient(180deg,#E4CF44_0%,#9267A5_100%)] text-white [text-shadow:0_1px_0_rgba(20,33,43,0.28)]",
          show ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => {
          if (toTop) {
            setFab("next");
            goToHomeMagnet(0);
            return;
          }
          const y = nextHomeMagnetY();
          if (y != null) goToHomeMagnet(y);
        }}
      >
        {toTop ? (
          <>
            <span>{t("home.backToTopShort")}</span>
            <ChevronUp
              className="home-top-bob h-5 w-5"
              strokeWidth={2.6}
              aria-hidden
            />
          </>
        ) : (
          <>
            <ChevronDown
              className="home-next-bob h-5 w-5"
              strokeWidth={2.6}
              aria-hidden
            />
            <span>{t("home.nextStopShort")}</span>
          </>
        )}
      </button>
    </div>
  );
}
