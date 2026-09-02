"use client";

import { useEffect, useRef, useState } from "react";
import { HomeShotCursor, shotPoint } from "@/components/home-shot-cursor";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

const HOLD_MS = 1050;
const MOVE_MS = 460;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** 怎麼玩 05：游標在第一則／第二則來回 hover */
export function HomeInboxShot() {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const row0Ref = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<0 | 1 | null>(null);
  const [cursor, setCursor] = useState({ x: 18, y: 52, shown: false });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setHover(0);
      setCursor((prev) => ({ ...prev, shown: false }));
      return;
    }

    const signal = { cancelled: false };
    let runId = 0;

    function pointAt(index: 0 | 1) {
      const pos = shotPoint(
        stageRef.current,
        index === 0 ? row0Ref.current : row1Ref.current,
        { x: 0.56, y: 0.38 },
      );
      if (!pos) return;
      setCursor({ ...pos, shown: true });
    }

    async function play(id: number) {
      await wait(240);
      if (signal.cancelled || id !== runId) return;
      pointAt(0);
      setHover(0);

      while (!signal.cancelled && id === runId) {
        await wait(HOLD_MS);
        if (signal.cancelled || id !== runId) return;
        pointAt(1);
        await wait(MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        setHover(1);

        await wait(HOLD_MS);
        if (signal.cancelled || id !== runId) return;
        pointAt(0);
        await wait(MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        setHover(0);
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          runId += 1;
          signal.cancelled = false;
          void play(runId);
        } else {
          runId += 1;
          signal.cancelled = true;
          setHover(null);
          setCursor((prev) => ({ ...prev, shown: false }));
        }
      },
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => {
      signal.cancelled = true;
      runId += 1;
      io.disconnect();
    };
  }, []);

  const lines = [t("home.sample1"), t("home.sample2")];

  return (
    <div
      ref={rootRef}
      className="w-full max-w-[17rem] select-none"
      aria-hidden
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_14px_34px_rgba(20,33,43,0.1)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
          <span className="text-xs font-semibold">{t("nav.inbox")}</span>
          <span className="animate-mark rounded-md bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
            2
          </span>
        </div>
        {lines.map((line, i) => {
          const active = hover === i;
          return (
            <div
              key={line}
              ref={i === 0 ? row0Ref : row1Ref}
              className={cn(
                "flex items-start gap-2 border-b border-[var(--line)]/70 px-3 py-2.5 last:border-b-0",
                "transition-colors duration-300",
                i === 0 && active && "bg-[#dcf3ec]",
                i === 1 && active && "bg-[#f0f3f6]",
                i === 0 && !active && "bg-white",
                i === 1 && !active && "bg-white",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full transition-colors duration-300",
                  i === 0
                    ? active
                      ? "bg-[var(--mint)]"
                      : "animate-mark bg-[var(--mint)]"
                    : active
                      ? "bg-[var(--muted)]"
                      : "bg-[var(--line)]",
                )}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--ink)]">
                  {line}
                </p>
                <p
                  className={cn(
                    "text-[10px] transition-colors duration-300",
                    i === 0 && active
                      ? "text-[var(--mint)]"
                      : "text-[var(--muted)]",
                  )}
                >
                  {i === 0 ? t("home.inboxNew") : "6w7"}
                </p>
              </div>
            </div>
          );
        })}
        <HomeShotCursor
          x={cursor.x}
          y={cursor.y}
          shown={cursor.shown}
          kind="pointer"
          moveMs={MOVE_MS}
        />
      </div>
    </div>
  );
}
