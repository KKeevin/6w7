"use client";

import { useEffect, useRef, useState } from "react";
import { burstMemeFireworks } from "@/components/meme-drift";
import {
  HomeShotCursor,
  SHOT_CURSOR_MOVE_MS,
  shotPoint,
  type ShotCursorKind,
} from "@/components/home-shot-cursor";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import { DEMO_PROFILE } from "@/shared/demo-account";

const REPLAY_GAP_MS = 500;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type CursorState = {
  x: number;
  y: number;
  shown: boolean;
  kind: ShotCursorKind;
  pressed: boolean;
};

/** 怎麼玩 04：游標點輸入框 → 打字 → 手指按送出（煙火＋送出中） */
export function HomeAskShot() {
  const t = useT();
  const sample = t("home.sample1");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [caret, setCaret] = useState(true);
  const [pressed, setPressed] = useState(false);
  const [sending, setSending] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({
    x: 36,
    y: 52,
    shown: false,
    kind: "arrow",
    pressed: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTyped(sample);
      setCaret(false);
      setSending(false);
      return;
    }

    const chars = Array.from(sample);
    const signal = { cancelled: false };
    let runId = 0;

    function moveTo(
      target: HTMLElement | null,
      kind: ShotCursorKind,
      align?: { x: number; y: number },
    ) {
      const pos = shotPoint(stageRef.current, target, align);
      if (!pos) return;
      setCursor((prev) => ({
        ...prev,
        ...pos,
        shown: true,
        kind,
        pressed: false,
      }));
    }

    async function clickCursor() {
      setCursor((prev) => ({ ...prev, pressed: true }));
      await wait(90);
      setCursor((prev) => ({ ...prev, pressed: false }));
    }

    async function play(id: number) {
      while (!signal.cancelled && id === runId) {
        setTyped("");
        setCaret(true);
        setPressed(false);
        setSending(false);
        setCursor((prev) => ({ ...prev, shown: false, kind: "arrow", pressed: false }));
        await wait(240);
        if (signal.cancelled || id !== runId) return;

        moveTo(boxRef.current, "arrow", { x: 0.42, y: 0.48 });
        await wait(SHOT_CURSOR_MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        moveTo(boxRef.current, "text", { x: 0.42, y: 0.48 });
        await clickCursor();
        if (signal.cancelled || id !== runId) return;

        let next = "";
        for (const ch of chars) {
          if (signal.cancelled || id !== runId) return;
          next += ch;
          setTyped(next);
          await wait(90);
        }
        setCaret(false);
        await wait(220);
        if (signal.cancelled || id !== runId) return;

        moveTo(btnRef.current, "pointer", { x: 0.58, y: 0.5 });
        await wait(SHOT_CURSOR_MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        await wait(100);
        setPressed(true);
        await clickCursor();
        setPressed(false);
        setSending(true);
        await wait(280);
        if (signal.cancelled || id !== runId) return;
        burstMemeFireworks(btnRef.current, { scale: 0.52 });
        await wait(1200);
        if (signal.cancelled || id !== runId) return;
        setCursor((prev) => ({ ...prev, shown: false }));
        await wait(REPLAY_GAP_MS);
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
  }, [sample]);

  return (
    <div
      ref={rootRef}
      className="w-full max-w-[16.5rem] select-none"
      aria-hidden
    >
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white px-3 py-3 shadow-[0_14px_34px_rgba(20,33,43,0.1)]"
      >
        <p className="text-[10px] font-semibold text-[var(--muted)]">
          @{DEMO_PROFILE.username}
        </p>
        <div
          ref={boxRef}
          className={cn(
            "mt-2 flex min-h-12 items-start rounded-xl border bg-[var(--bg)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--ink)] transition-colors duration-200",
            caret
              ? "border-[var(--mint)] bg-white ring-2 ring-[var(--mint)]/25"
              : "border-[var(--line)]",
          )}
        >
          <span>{typed}</span>
          {caret ? <span className="home-caret ml-px" aria-hidden /> : null}
        </div>
        <div
          ref={btnRef}
          className={cn(
            "mt-2 rounded-lg bg-[var(--accent)] py-1.5 text-center text-[11px] font-semibold text-[var(--accent-fg)] shadow-sm transition duration-150",
            pressed && "scale-[0.96] brightness-95",
            sending && "opacity-90",
          )}
        >
          {sending ? t("ask.sending") : t("home.previewSend")}
        </div>
        <HomeShotCursor
          x={cursor.x}
          y={cursor.y}
          shown={cursor.shown}
          kind={cursor.kind}
          pressed={cursor.pressed}
        />
      </div>
    </div>
  );
}
