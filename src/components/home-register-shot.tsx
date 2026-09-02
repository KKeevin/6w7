"use client";

import { useEffect, useRef, useState } from "react";
import {
  HomeShotCursor,
  SHOT_CURSOR_MOVE_MS,
  shotPoint,
  type ShotCursorKind,
} from "@/components/home-shot-cursor";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import { BRAND } from "@/shared/tools";

const DEMO_HANDLE = "your.ig.id";
const PASS_LEN = 8;
const REPLAY_GAP_MS = 500;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function FakeField({
  prefix,
  value,
  caret,
  focused,
}: {
  prefix?: string;
  value: string;
  caret: boolean;
  focused?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center rounded-lg border bg-[var(--bg)] px-2.5 text-[12px] text-[var(--ink)] transition-colors duration-200",
        focused
          ? "border-[var(--mint)] bg-white ring-2 ring-[var(--mint)]/25"
          : "border-[var(--line)]",
      )}
    >
      {prefix ? (
        <span className="mr-0.5 font-semibold text-[var(--muted)]">{prefix}</span>
      ) : null}
      <span className="min-w-0 truncate font-medium tracking-wide">{value}</span>
      {caret ? <span className="home-caret ml-px" aria-hidden /> : null}
    </div>
  );
}

type CursorState = {
  x: number;
  y: number;
  shown: boolean;
  kind: ShotCursorKind;
  pressed: boolean;
};

/** 怎麼玩 01：游標點欄位輸入 → 按註冊 → 專屬連結 */
export function HomeRegisterShot() {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [passLen, setPassLen] = useState(0);
  const [field, setField] = useState<"user" | "pass" | "btn" | "done">("user");
  const [pressed, setPressed] = useState(false);
  const [scene, setScene] = useState<"form" | "link">("form");
  const [cursor, setCursor] = useState<CursorState>({
    x: 28,
    y: 64,
    shown: false,
    kind: "arrow",
    pressed: false,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setUsername(DEMO_HANDLE);
      setPassLen(PASS_LEN);
      setField("done");
      setScene("link");
      return;
    }

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
        setScene("form");
        setUsername("");
        setPassLen(0);
        setPressed(false);
        setField("user");
        setCursor((prev) => ({ ...prev, shown: false, kind: "arrow", pressed: false }));
        await wait(280);
        if (signal.cancelled || id !== runId) return;

        moveTo(userRef.current, "arrow", { x: 0.62, y: 0.5 });
        await wait(SHOT_CURSOR_MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        moveTo(userRef.current, "text", { x: 0.62, y: 0.5 });
        await clickCursor();
        if (signal.cancelled || id !== runId) return;

        for (const ch of DEMO_HANDLE) {
          if (signal.cancelled || id !== runId) return;
          setUsername((prev) => prev + ch);
          await wait(72);
        }
        await wait(180);
        if (signal.cancelled || id !== runId) return;

        setField("pass");
        moveTo(passRef.current, "arrow", { x: 0.55, y: 0.5 });
        await wait(SHOT_CURSOR_MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        moveTo(passRef.current, "text", { x: 0.55, y: 0.5 });
        await clickCursor();
        if (signal.cancelled || id !== runId) return;

        for (let i = 1; i <= PASS_LEN; i += 1) {
          if (signal.cancelled || id !== runId) return;
          setPassLen(i);
          await wait(58);
        }
        await wait(200);
        if (signal.cancelled || id !== runId) return;

        setField("btn");
        moveTo(btnRef.current, "pointer", { x: 0.58, y: 0.5 });
        await wait(SHOT_CURSOR_MOVE_MS);
        if (signal.cancelled || id !== runId) return;
        await wait(120);
        setPressed(true);
        await clickCursor();
        setPressed(false);
        await wait(120);
        if (signal.cancelled || id !== runId) return;

        setCursor((prev) => ({ ...prev, shown: false }));
        setScene("link");
        setField("done");
        await wait(1400);
        if (signal.cancelled || id !== runId) return;
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
  }, []);

  const url = t("home.deviceUrl", { username: DEMO_HANDLE });

  return (
    <div
      ref={rootRef}
      className="w-full max-w-[17.5rem] select-none"
      aria-hidden
    >
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_14px_34px_rgba(20,33,43,0.1)]">
        <div className="h-1.5 bg-gradient-to-r from-[var(--mint)] to-[var(--accent)]" />
        <div ref={stageRef} className="relative min-h-[13.75rem]">
          <div
            className={cn(
              "px-3 py-3 transition duration-300 ease-out",
              scene === "link"
                ? "pointer-events-none -translate-x-4 opacity-0"
                : "translate-x-0 opacity-100",
            )}
          >
            <p className="text-[11px] font-semibold text-[var(--muted)]">
              {t("auth.registerTitle")}
            </p>
            <label className="mt-2.5 block text-[10px] font-semibold text-[var(--ink)]">
              {t("auth.igId")}
            </label>
            <div ref={userRef}>
              <FakeField
                prefix="@"
                value={username}
                caret={field === "user"}
                focused={field === "user"}
              />
            </div>
            <label className="mt-2 block text-[10px] font-semibold text-[var(--ink)]">
              {t("auth.password")}
            </label>
            <div ref={passRef}>
              <FakeField
                value={"•".repeat(passLen)}
                caret={field === "pass"}
                focused={field === "pass"}
              />
            </div>
            <div
              ref={btnRef}
              className={cn(
                "mt-3 rounded-lg bg-[var(--accent)] py-1.5 text-center text-[11px] font-semibold text-[var(--accent-fg)] shadow-sm transition duration-150",
                pressed && "scale-[0.96] brightness-95",
                field === "btn" && "ring-2 ring-[var(--accent)]/40",
              )}
            >
              {t("auth.registerStart")}
            </div>
          </div>

          <div
            className={cn(
              "absolute inset-0 flex flex-col justify-center px-3 py-3 transition duration-300 ease-out",
              scene === "link"
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-5 opacity-0",
            )}
          >
            <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--mint)]">
              {BRAND.en.toUpperCase()}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
              {t("home.how1LinkTitle")}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-[family-name:var(--font-display)] text-[1.05rem] font-bold leading-snug tracking-tight text-[var(--ink)]">
                {url}
              </p>
              <span className="inline-flex shrink-0 rounded-full bg-[var(--mint)]/12 px-2.5 py-1 text-[10px] font-semibold text-[var(--mint)]">
                {t("nav.shortUrl")}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--muted)]">@{DEMO_HANDLE}</p>
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
    </div>
  );
}
