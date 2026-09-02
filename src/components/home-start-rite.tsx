"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import { useLockBodyScroll } from "@/lib/lock-body-scroll";
import {
  prefersReducedMotion,
  scrollStartToEnd,
  wait,
} from "@/lib/home-start-scroll";

/** Strict Mode 連跑兩次時略過；真正再進 `?mode=register` 仍會播 */
let lastRegisterRiteAt = 0;

function markStartHash() {
  const url = new URL(window.location.href);
  if (url.hash === "#start") return;
  url.hash = "start";
  history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function pulseStartPair() {
  const pair = document.querySelector(".home-start-pair");
  if (!pair) return;
  pair.classList.remove("home-start-pair-catch");
  void (pair as HTMLElement).offsetWidth;
  pair.classList.add("home-start-pair-catch");
  window.setTimeout(() => pair.classList.remove("home-start-pair-catch"), 500);
}

function takeRegisterRiteSlot() {
  const now = Date.now();
  if (now - lastRegisterRiteAt < 900) return false;
  lastRegisterRiteAt = now;
  return true;
}

/** 「註冊拿自己的連結」：6 → 7 交接後落到註冊區底 */
export function HomeStartRite() {
  const t = useT();
  const searchParams = useSearchParams();
  const registerMode = searchParams.get("mode") === "register";
  const [digit, setDigit] = useState<"6" | "7" | null>(null);
  const [mounted, setMounted] = useState(false);
  const busy = useRef(false);
  useLockBodyScroll(digit !== null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function runHandoff() {
      if (busy.current) return;
      busy.current = true;
      markStartHash();
      if (prefersReducedMotion()) {
        scrollStartToEnd("instant");
        busy.current = false;
        return;
      }
      try {
        setDigit("6");
        await wait(320);
        setDigit("7");
        await wait(440);
        setDigit(null);
        await wait(32);
        scrollStartToEnd("instant");
        pulseStartPair();
      } finally {
        busy.current = false;
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('a[href="#start"]')) return;
      event.preventDefault();
      void runHandoff();
    }

    function onHash() {
      if (window.location.hash === "#start" && !busy.current) {
        scrollStartToEnd("smooth");
      }
    }

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);

    if (registerMode) {
      if (takeRegisterRiteSlot()) void runHandoff();
    } else if (window.location.hash === "#start") {
      requestAnimationFrame(() => scrollStartToEnd("smooth"));
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, [registerMode]);

  if (!mounted || !digit) return null;

  return createPortal(
    <div
      className="home-start-rite"
      role="dialog"
      aria-modal="true"
      aria-label={t("home.riteToStart")}
    >
      <div className="home-rite-handoff" data-show={digit}>
        <span className="home-rite-digit home-rite-digit-6" aria-hidden>
          6
        </span>
        <span className="home-rite-digit home-rite-digit-7" aria-hidden>
          7
        </span>
      </div>
    </div>,
    document.body,
  );
}
