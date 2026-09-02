"use client";

import type { CSSProperties } from "react";

export type ShotCursorKind = "arrow" | "text" | "pointer";

export const SHOT_CURSOR_MOVE_MS = 420;

type Props = {
  x: number;
  y: number;
  shown: boolean;
  kind: ShotCursorKind;
  pressed?: boolean;
  moveMs?: number;
};

const OFFSET: Record<ShotCursorKind, { x: number; y: number }> = {
  arrow: { x: 0, y: 0 },
  text: { x: -6, y: -10 },
  pointer: { x: -7, y: -1 },
};

export function shotPoint(
  stage: HTMLElement | null,
  target: HTMLElement | null,
  align: { x?: number; y?: number } = {},
) {
  if (!stage || !target) return null;
  const s = stage.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  return {
    x: r.left - s.left + r.width * (align.x ?? 0.58),
    y: r.top - s.top + r.height * (align.y ?? 0.48),
  };
}

function CursorGlyph({ kind }: { kind: ShotCursorKind }) {
  if (kind === "text") {
    return (
      <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden>
        <path
          d="M2 1.2h10M7 1.2v19.6M2 20.8h10M2 1.2v3.1M12 1.2v3.1M2 17.7v3.1M12 17.7v3.1"
          fill="none"
          stroke="#fff"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M2 1.2h10M7 1.2v19.6M2 20.8h10M2 1.2v3.1M12 1.2v3.1M2 17.7v3.1M12 17.7v3.1"
          fill="none"
          stroke="#14212b"
          strokeWidth="1.55"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "pointer") {
    return (
      <svg width="22" height="24" viewBox="0 0 32 34" aria-hidden>
        <path
          d="M11.2 2.4c1.15 0 2.08.93 2.08 2.08v10.4h.22V8.1c0-1.15.93-2.08 2.08-2.08s2.08.93 2.08 2.08v8.05h.22V9.7c0-1.15.93-2.08 2.08-2.08s2.08.93 2.08 2.08v9.4c0 4.85-3.12 8.35-8.55 8.35h-2.05c-3.2 0-6-1.85-7.2-4.7L5.4 17.6c-.5-1.15.08-2.48 1.28-2.95.75-.3 1.62-.1 2.2.48l3.24 3.12V4.48c0-1.15.93-2.08 2.08-2.08Z"
          fill="#fff"
          stroke="#14212b"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="24" viewBox="0 0 24 28" aria-hidden>
      <path
        d="M3.1 1.8 21.6 16.4l-7.8.2 4.3 9.4-3.4 1.5-4.3-9.3-5.8 5.4Z"
        fill="#fff"
        stroke="#14212b"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 怎麼玩小動畫用的假游標：箭頭／I 型／手指 */
export function HomeShotCursor({
  x,
  y,
  shown,
  kind,
  pressed = false,
  moveMs = SHOT_CURSOR_MOVE_MS,
}: Props) {
  const offset = OFFSET[kind];
  return (
    <span
      className="pointer-events-none absolute top-0 left-0 z-10 origin-top-left drop-shadow-[0_2px_5px_rgba(20,33,43,0.28)]"
      style={
        {
          opacity: shown ? 1 : 0,
          transform: `translate(${x + offset.x}px, ${y + offset.y}px) scale(${pressed ? 0.84 : 1})`,
          transition: shown
            ? `transform ${pressed ? 90 : moveMs}ms cubic-bezier(0.22, 0.82, 0.24, 1), opacity 180ms ease`
            : "opacity 180ms ease",
        } as CSSProperties
      }
      aria-hidden
    >
      <CursorGlyph kind={kind} />
    </span>
  );
}
