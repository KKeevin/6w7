"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canvasToImageFile } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import { ASK_LIMITS, BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

type Props = {
  /** 使用者剛挑的原始檔。呼叫端請用 key 綁定此檔，換檔要重新掛載才會重置縮放 */
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 大頭貼裁切：方框內就是會存下來的範圍，圓圈是實際顯示的區域。
 * 輸出正方形，最長邊 {@link ASK_LIMITS.avatarMaxEdge}，伺服器再轉成 512px PNG。
 */
export function AvatarCropDialog({ file, onCancel, onConfirm }: Props) {
  const t = useT();
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const [stage, setStage] = useState(0);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setStage(entry?.contentRect.width ?? 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const baseScale =
    nat && stage > 0 ? Math.max(stage / nat.w, stage / nat.h) : 0;
  const scale = baseScale * zoom;
  const dispW = nat ? nat.w * scale : 0;
  const dispH = nat ? nat.h * scale : 0;
  const maxOffX = Math.max(0, (dispW - stage) / 2);
  const maxOffY = Math.max(0, (dispH - stage) / 2);

  function applyZoom(next: number, anchor?: { x: number; y: number }) {
    const target = clamp(next, ZOOM_MIN, ZOOM_MAX);
    setZoom(target);
    setOffset((prev) => {
      // 以錨點為中心縮放，手指／游標下的畫面內容不會亂跑
      const ratio = target / zoom;
      const ax = anchor?.x ?? 0;
      const ay = anchor?.y ?? 0;
      const nextX = ax + (prev.x - ax) * ratio;
      const nextY = ay + (prev.y - ay) * ratio;
      const limitX = Math.max(0, (dispW * ratio - stage) / 2);
      const limitY = Math.max(0, (dispH * ratio - stage) / 2);
      return {
        x: clamp(nextX, -limitX, limitX),
        y: clamp(nextY, -limitY, limitY),
      };
    });
  }

  function pan(dx: number, dy: number) {
    setOffset((prev) => ({
      x: clamp(prev.x + dx, -maxOffX, maxOffX),
      y: clamp(prev.y + dy, -maxOffY, maxOffY),
    }));
  }

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      applyZoom(zoom * (event.deltaY > 0 ? 0.94 : 1.06), {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
    // applyZoom 依賴 zoom／尺寸，重綁比用 ref 保存更好讀
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, dispW, dispH, stage]);

  function onPointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent) {
    const prev = pointers.current.get(event.pointerId);
    if (!prev) return;
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (!pinch.current) {
        pinch.current = { dist, zoom };
        return;
      }
      applyZoom((pinch.current.zoom * dist) / Math.max(1, pinch.current.dist));
      return;
    }

    pan(event.clientX - prev.x, event.clientY - prev.y);
  }

  function onPointerUp(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  async function confirm() {
    const img = imgRef.current;
    if (!img || !nat || scale <= 0) return;
    setWorking(true);
    try {
      // 舞台中心對應到原圖的哪個點
      const centerX = nat.w / 2 - offset.x / scale;
      const centerY = nat.h / 2 - offset.y / scale;
      const source = stage / scale;
      const sx = clamp(centerX - source / 2, 0, Math.max(0, nat.w - source));
      const sy = clamp(centerY - source / 2, 0, Math.max(0, nat.h - source));
      const out = Math.max(
        64,
        Math.round(Math.min(ASK_LIMITS.avatarMaxEdge, source)),
      );

      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, source, source, 0, 0, out, out);

      onConfirm(await canvasToImageFile(canvas, "avatar"));
    } catch {
      setFailed(true);
      setWorking(false);
    }
  }

  const ready = Boolean(nat) && stage > 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ink)]/55 p-3 backdrop-blur-[4px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="animate-rise flex max-h-[96dvh] w-full max-w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]">
        <div className="h-1.5 shrink-0 bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]" />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--mint)]">
                {BRAND.en.toUpperCase()} AVATAR
              </p>
              <h3
                id="avatar-crop-title"
                className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
              >
                {t("crop.title")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("crop.cancelAria")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              ✕
            </button>
          </div>

          <div
            ref={stageRef}
            className={cn(
              "relative mt-3 aspect-square w-full shrink-0 touch-none overflow-hidden rounded-2xl bg-[var(--ink)] select-none",
              // 游標要掛在舞台上：拖曳時指標被 setPointerCapture 綁在這層，
              // 掛在裡面的 <img> 會被忽略而變回預設游標
              ready && (dragging ? "cursor-grabbing" : "cursor-grab"),
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(event) => {
                const el = event.currentTarget;
                setNat({ w: el.naturalWidth, h: el.naturalHeight });
              }}
              onError={() => setFailed(true)}
              className="absolute left-1/2 top-1/2 max-w-none"
              style={{
                width: dispW || undefined,
                height: dispH || undefined,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                visibility: ready ? "visible" : "hidden",
              }}
            />

            {/* 圓形指引：圈內是公開頁看得到的範圍，方框內全部都會存起來 */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              aria-hidden
              style={{
                // closest-side：100% 正好是內切圓，只把四個角落壓暗
                background:
                  "radial-gradient(circle closest-side at center, transparent 0, transparent calc(100% - 1px), rgba(20,33,43,0.5) 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 m-auto rounded-full border-2 border-white/70"
              aria-hidden
            />
          </div>

          <div className="mt-3 flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={t("common.zoomOut")}
              onClick={() => applyZoom(zoom - 0.2)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              aria-label={t("common.zoom")}
              onChange={(event) => applyZoom(Number(event.target.value))}
              className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--surface)] accent-[var(--mint)]"
            />
            <button
              type="button"
              aria-label={t("common.zoomIn")}
              onClick={() => applyZoom(zoom + 0.2)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink)] transition hover:bg-[var(--surface)]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 shrink-0 text-center text-[11px] leading-relaxed text-[var(--muted)]">
            {t("crop.hint")}
          </p>

          {failed ? (
            <p
              className="mt-2 shrink-0 text-center text-xs font-medium text-[var(--danger)]"
              role="alert"
            >
              {t("crop.failed")}
            </p>
          ) : null}

          <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!ready || working || failed}
              onClick={() => void confirm()}
            >
              {working ? t("common.processing") : t("crop.use")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
