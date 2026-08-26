"use client";

import { useEffect, useRef } from "react";
import type { PublicSticker } from "@/shared/page-stickers";
import {
  clampStickerScale,
  wrapRotation,
} from "@/shared/page-stickers";
import { cn } from "@/lib/utils";

const BASE_WIDTH = 28;

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

type DragMode = "move" | "scale" | "rotate" | "pinch";

type DragState = {
  mode: DragMode;
  id: string;
  pointerId: number;
  origX: number;
  origY: number;
  origScale: number;
  origRot: number;
  startClientX: number;
  startClientY: number;
  startDist: number;
  startAngle: number;
  stageWidth: number;
  stageHeight: number;
  centerX: number;
  centerY: number;
};

export function StickerLayer({
  stickers,
  interactive = false,
  selectedId,
  onSelect,
  onMove,
  onScale,
  onRotate,
}: {
  stickers: PublicSticker[];
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onScale?: (id: string, scale: number) => void;
  onRotate?: (id: string, rotation: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stickersRef = useRef(stickers);
  const dragRef = useRef<DragState | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    id: string;
    startDist: number;
    startScale: number;
    startAngle: number;
    startRot: number;
  } | null>(null);

  stickersRef.current = stickers;

  useEffect(() => {
    if (!interactive) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (event: WheelEvent) => {
      const node = (event.target as HTMLElement | null)?.closest(
        "[data-sticker-id]",
      );
      if (!node) return;
      event.preventDefault();
      const id = node.getAttribute("data-sticker-id");
      const sticker = stickersRef.current.find((item) => item.id === id);
      if (!id || !sticker) return;
      onSelect?.(id);
      const next =
        sticker.scale * (event.deltaY > 0 ? 0.94 : 1.06);
      onScale?.(id, clampStickerScale(next));
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [interactive, onScale, onSelect]);

  function stageCenter(sticker: PublicSticker, rect: DOMRect) {
    return {
      x: rect.left + (sticker.x / 100) * rect.width,
      y: rect.top + (sticker.y / 100) * rect.height,
    };
  }

  function beginDrag(
    event: React.PointerEvent,
    sticker: PublicSticker,
    mode: DragMode,
  ) {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const center = stageCenter(sticker, rect);
    dragRef.current = {
      mode,
      id: sticker.id,
      pointerId: event.pointerId,
      origX: sticker.x,
      origY: sticker.y,
      origScale: sticker.scale,
      origRot: sticker.rotation,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startDist: Math.max(
        8,
        dist({ x: event.clientX, y: event.clientY }, center),
      ),
      startAngle: angleDeg(center, { x: event.clientX, y: event.clientY }),
      stageWidth: rect.width,
      stageHeight: rect.height,
      centerX: center.x,
      centerY: center.y,
    };
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function applyDrag(event: PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2) {
      const pts = [...pointersRef.current.values()];
      if (!pinchRef.current) {
        const current = stickersRef.current.find((item) => item.id === drag.id);
        pinchRef.current = {
          id: drag.id,
          startDist: dist(pts[0]!, pts[1]!),
          startScale: current?.scale ?? drag.origScale,
          startAngle: angleDeg(pts[0]!, pts[1]!),
          startRot: current?.rotation ?? drag.origRot,
        };
      }
      const pinch = pinchRef.current;
      const factor = dist(pts[0]!, pts[1]!) / Math.max(1, pinch.startDist);
      onScale?.(pinch.id, clampStickerScale(pinch.startScale * factor));
      onRotate?.(
        pinch.id,
        wrapRotation(pinch.startRot + (angleDeg(pts[0]!, pts[1]!) - pinch.startAngle)),
      );
      return;
    }

    if (event.pointerId !== drag.pointerId) return;

    if (drag.mode === "move") {
      const dx = ((event.clientX - drag.startClientX) / drag.stageWidth) * 100;
      const dy = ((event.clientY - drag.startClientY) / drag.stageHeight) * 100;
      onMove?.(
        drag.id,
        Math.min(96, Math.max(4, drag.origX + dx)),
        Math.min(96, Math.max(4, drag.origY + dy)),
      );
      return;
    }

    if (drag.mode === "scale") {
      const currentDist = dist(
        { x: event.clientX, y: event.clientY },
        { x: drag.centerX, y: drag.centerY },
      );
      onScale?.(
        drag.id,
        clampStickerScale(drag.origScale * (currentDist / drag.startDist)),
      );
      return;
    }

    if (drag.mode === "rotate") {
      const current = angleDeg(
        { x: drag.centerX, y: drag.centerY },
        { x: event.clientX, y: event.clientY },
      );
      onRotate?.(drag.id, wrapRotation(drag.origRot + (current - drag.startAngle)));
    }
  }

  function endPointer(event: PointerEvent) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  return (
    <div
      ref={stageRef}
      className={cn(
        "absolute inset-0 z-20",
        interactive ? "pointer-events-auto touch-none" : "pointer-events-none",
      )}
      onPointerDown={(event) => {
        if (!interactive) return;
        if (event.target === event.currentTarget) onSelect?.(null);
      }}
    >
      {stickers.map((sticker) => {
        const selected = interactive && selectedId === sticker.id;
        return (
          <div
            key={sticker.id}
            data-sticker-id={sticker.id}
            className={cn(
              "absolute left-0 top-0 will-change-transform",
              interactive && "cursor-grab active:cursor-grabbing",
            )}
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              width: `${BASE_WIDTH * sticker.scale}%`,
              zIndex: selected ? 80 : 20 + sticker.zIndex,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
            }}
            onPointerDown={(event) => {
              if (!interactive) return;
              event.stopPropagation();
              (event.currentTarget as HTMLElement).setPointerCapture(
                event.pointerId,
              );
              onSelect?.(sticker.id);
              beginDrag(event, sticker, "move");

              const move = (ev: PointerEvent) => applyDrag(ev);
              const up = (ev: PointerEvent) => {
                endPointer(ev);
                if (pointersRef.current.size === 0) {
                  window.removeEventListener("pointermove", move);
                  window.removeEventListener("pointerup", up);
                  window.removeEventListener("pointercancel", up);
                }
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
              window.addEventListener("pointercancel", up);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sticker.url}
              alt=""
              draggable={false}
              className={cn(
                "block h-auto w-full select-none",
                selected &&
                  "rounded-[4px] outline outline-2 outline-[var(--mint)] outline-offset-2",
              )}
            />
            {selected ? (
              <>
                <button
                  type="button"
                  aria-label="旋轉"
                  className="absolute left-1/2 top-0 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-[2.15rem] items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] shadow-md"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    onSelect?.(sticker.id);
                    beginDrag(event, sticker, "rotate");
                    const move = (ev: PointerEvent) => applyDrag(ev);
                    const up = (ev: PointerEvent) => {
                      endPointer(ev);
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <span
                    className="pointer-events-none absolute top-full left-1/2 h-5 w-px -translate-x-1/2 bg-[var(--mint)]"
                    aria-hidden
                  />
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                    <path
                      d="M3 8a5 5 0 1 1 1.5 3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M3 11.5V8h3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="縮放"
                  className="absolute right-0 bottom-0 z-10 h-8 w-8 translate-x-1/3 translate-y-1/3 cursor-nwse-resize"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    onSelect?.(sticker.id);
                    beginDrag(event, sticker, "scale");
                    const move = (ev: PointerEvent) => applyDrag(ev);
                    const up = (ev: PointerEvent) => {
                      endPointer(ev);
                      window.removeEventListener("pointermove", move);
                      window.removeEventListener("pointerup", up);
                    };
                    window.addEventListener("pointermove", move);
                    window.addEventListener("pointerup", up);
                  }}
                >
                  <span className="absolute right-1.5 bottom-1.5 h-3.5 w-3.5 rounded-[3px] border-2 border-[var(--mint)] bg-white shadow" />
                </button>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
