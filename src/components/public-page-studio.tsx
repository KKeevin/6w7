"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ImagePlus,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import { StickerLayer } from "@/components/sticker-layer";
import { Button } from "@/components/ui/button";
import { ASK_LIMITS } from "@/shared/tools";
import {
  clampStickerScale,
  wrapRotation,
  type MediaLibraryItem,
  type PublicSticker,
} from "@/shared/page-stickers";
import { cn } from "@/lib/utils";

type Props = {
  canEdit: boolean;
  initialEdit?: boolean;
  initialStickers: PublicSticker[];
  children: React.ReactNode;
};

export function PublicPageStudio({
  canEdit,
  initialEdit = false,
  initialStickers,
  children,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | null>(null);
  const stickersRef = useRef<PublicSticker[]>(initialStickers);
  const saveChain = useRef(Promise.resolve());
  const [editing, setEditing] = useState(initialEdit && canEdit);
  const [stickers, setStickers] = useState<PublicSticker[]>(initialStickers);
  const [library, setLibrary] = useState<MediaLibraryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selected = stickers.find((item) => item.id === selectedId) ?? null;
  stickersRef.current = stickers;

  useEffect(() => {
    if (!editing || !canEdit) return;
    let cancelled = false;
    setLoadingLib(true);
    fetch("/api/v1/stickers")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || "載入失敗");
        if (cancelled) return;
        setLibrary(data.library ?? []);
        if (Array.isArray(data.stickers)) {
          stickersRef.current = data.stickers;
          setStickers(data.stickers);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "載入失敗");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingLib(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editing, canEdit]);

  useEffect(() => {
    if (!editing) setSelectedId(null);
  }, [editing]);

  useEffect(() => {
    if (!editing || !canEdit) return;
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        event.preventDefault();
        finishEditing();
        return;
      }
      const current = stickersRef.current.find((item) => item.id === selectedId);
      if (!current) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeFromCanvas(current.id);
        return;
      }
      const step = event.shiftKey ? 5 : 1;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateSticker(current.id, { x: Math.max(4, current.x - step) });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        updateSticker(current.id, { x: Math.min(96, current.x + step) });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSticker(current.id, { y: Math.max(4, current.y - step) });
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSticker(current.id, { y: Math.min(96, current.y + step) });
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        updateSticker(current.id, {
          scale: clampStickerScale(current.scale + 0.08),
        });
      } else if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        updateSticker(current.id, {
          scale: clampStickerScale(current.scale - 0.08),
        });
      } else if (event.key === "[" || event.key === ",") {
        event.preventDefault();
        updateSticker(current.id, {
          rotation: wrapRotation(current.rotation - 15),
        });
      } else if (event.key === "]" || event.key === ".") {
        event.preventDefault();
        updateSticker(current.id, {
          rotation: wrapRotation(current.rotation + 15),
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // finishEditing / updateSticker are stable enough via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, canEdit, selectedId]);

  function queueSave() {
    if (!canEdit) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      enqueuePersist();
    }, 450);
  }

  function enqueuePersist() {
    saveChain.current = saveChain.current.then(() => persist()).catch(() => undefined);
  }

  async function persist() {
    const next = stickersRef.current;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/stickers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: next.map((item) => ({
            id: item.id,
            assetId: item.assetId,
            x: item.x,
            y: item.y,
            scale: item.scale,
            rotation: item.rotation,
            zIndex: item.zIndex,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "儲存失敗");
      if (Array.isArray(data.stickers)) {
        stickersRef.current = data.stickers;
        setStickers(data.stickers);
      }
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  function updateSticker(id: string, patch: Partial<PublicSticker>) {
    setStickers((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      stickersRef.current = next;
      queueSave();
      return next;
    });
  }

  function selectSticker(id: string | null) {
    if (id && id !== selectedId) {
      const max = stickersRef.current.reduce(
        (n, item) => Math.max(n, item.zIndex),
        0,
      );
      const current = stickersRef.current.find((item) => item.id === id);
      if (current && current.zIndex < max) {
        updateSticker(id, { zIndex: max + 1 });
      }
    }
    setSelectedId(id);
  }

  async function addFromLibrary(assetId: string) {
    setError(null);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await saveChain.current;
    try {
      const res = await fetch("/api/v1/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "加入失敗");
      const sticker = data.sticker as PublicSticker;
      setStickers((prev) => {
        const next = [...prev, sticker];
        stickersRef.current = next;
        return next;
      });
      setSelectedId(sticker.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加入失敗");
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await saveChain.current;
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/v1/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "上傳失敗");
      const asset = data.asset as MediaLibraryItem;
      setLibrary((prev) => [asset, ...prev]);
      if (stickersRef.current.length < ASK_LIMITS.stickerCanvasMax) {
        await addFromLibrary(asset.id);
      } else {
        setError("圖存好了，但畫面已經放滿，先移掉一張再加。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAsset(assetId: string) {
    setError(null);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    await saveChain.current;
    try {
      const res = await fetch(`/api/v1/media/${assetId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "刪除失敗");
      setLibrary((prev) => prev.filter((item) => item.id !== assetId));
      setStickers((prev) => {
        const next = prev.filter((item) => item.assetId !== assetId);
        stickersRef.current = next;
        return next;
      });
      setSelectedId((id) => {
        const still = stickersRef.current.find((item) => item.id === id);
        return still ? id : null;
      });
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
    }
  }

  function removeFromCanvas(id: string) {
    setStickers((prev) => {
      const next = prev.filter((item) => item.id !== id);
      stickersRef.current = next;
      queueSave();
      return next;
    });
    setSelectedId(null);
  }

  function finishEditing() {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
      enqueuePersist();
    }
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 flex-col",
        editing && "pb-44",
      )}
    >
      <div
        className={cn(
          "relative isolate flex min-w-0 flex-1 flex-col overflow-hidden rounded-t-3xl",
          editing &&
            "rounded-[1.5rem] ring-2 ring-inset ring-[var(--mint)]/35",
        )}
      >
        <StickerLayer
          stickers={stickers}
          interactive={editing}
          selectedId={selectedId}
          onSelect={selectSticker}
          onMove={(id, x, y) => updateSticker(id, { x, y })}
          onScale={(id, scale) =>
            updateSticker(id, { scale: clampStickerScale(scale) })
          }
          onRotate={(id, rotation) =>
            updateSticker(id, { rotation: wrapRotation(rotation) })
          }
        />
        <div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col",
            editing && "z-10 pointer-events-none select-none",
          )}
        >
          {children}
        </div>
      </div>

      {canEdit && !editing ? (
        <div className="pointer-events-none absolute right-3 top-3 z-40 sm:right-4 sm:top-4">
          <Button
            type="button"
            size="sm"
            className="pointer-events-auto shadow-md"
            onClick={() => setEditing(true)}
          >
            裝扮此頁
          </Button>
        </div>
      ) : null}

      {editing ? (
        <>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-40 flex items-start justify-between gap-2 sm:inset-x-4">
            <p className="max-w-[70%] rounded-2xl bg-[var(--ink)]/88 px-3 py-1.5 text-xs font-medium leading-snug text-white shadow">
              {saving
                ? "儲存中…"
                : savedFlash
                  ? "已儲存"
                  : selected
                    ? "拖曳移動 · 角落拉縮放 · 上方圓鈕旋轉"
                    : "從下方點圖片放到頁上，再拖到喜歡的位置"}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="pointer-events-auto shadow-md"
              onClick={finishEditing}
            >
              <Check className="h-4 w-4" />
              完成
            </Button>
          </div>

          {selected ? (
            <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(var(--footer-h)+8.25rem)] z-40 flex justify-center sm:inset-x-4">
              <div className="flex items-center gap-0.5 rounded-2xl border border-[var(--line)] bg-white/95 p-1 shadow-lg backdrop-blur">
                <ToolBtn
                  label="縮小"
                  onClick={() =>
                    updateSticker(selected.id, {
                      scale: clampStickerScale(selected.scale - 0.12),
                    })
                  }
                >
                  <Minus className="h-4 w-4" />
                </ToolBtn>
                <span className="min-w-[2.75rem] text-center text-[11px] font-semibold tabular-nums text-[var(--muted)]">
                  {Math.round(selected.scale * 100)}%
                </span>
                <ToolBtn
                  label="放大"
                  onClick={() =>
                    updateSticker(selected.id, {
                      scale: clampStickerScale(selected.scale + 0.12),
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                </ToolBtn>
                <span className="mx-0.5 h-5 w-px bg-[var(--line)]" aria-hidden />
                <ToolBtn
                  label="左轉 15°"
                  onClick={() =>
                    updateSticker(selected.id, {
                      rotation: wrapRotation(selected.rotation - 15),
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn
                  label="右轉 15°"
                  onClick={() =>
                    updateSticker(selected.id, {
                      rotation: wrapRotation(selected.rotation + 15),
                    })
                  }
                >
                  <RotateCw className="h-4 w-4" />
                </ToolBtn>
                <span className="mx-0.5 h-5 w-px bg-[var(--line)]" aria-hidden />
                <ToolBtn
                  label="從畫面拿掉（圖庫還在）"
                  danger
                  onClick={() => removeFromCanvas(selected.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </ToolBtn>
              </div>
            </div>
          ) : null}

          <div className="fixed inset-x-0 bottom-[var(--footer-h)] z-50 border-t border-[var(--line)] bg-[var(--bg)]/96 shadow-[0_-10px_30px_rgba(20,33,43,0.08)] backdrop-blur-md">
            <div className="mx-auto flex max-w-lg items-end gap-2 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={
                  uploading || library.length >= ASK_LIMITS.stickerLibraryMax
                }
                className="flex h-[4.75rem] w-[3.35rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--mint)] bg-white text-[var(--mint)] transition hover:bg-[var(--mint)]/10 disabled:opacity-50"
              >
                {uploading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="mt-1 text-[10px] font-bold">匯入</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)]">
                    媒體列
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">
                    {library.length}/{ASK_LIMITS.stickerLibraryMax} · 點一下加入 ·
                    X 刪檔
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {loadingLib ? (
                    <p className="py-4 text-xs text-[var(--muted)]">載入圖庫…</p>
                  ) : library.length === 0 ? (
                    <p className="py-4 text-xs text-[var(--muted)]">
                      還沒有圖片。點左側匯入，再擺到頁面上。
                    </p>
                  ) : (
                    library.map((item) => (
                      <div key={item.id} className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => void addFromLibrary(item.id)}
                          className="block h-[4.75rem] w-[4.75rem] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:border-[var(--mint)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                        {confirmDeleteId === item.id ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[var(--ink)]/82 p-1 text-center">
                            <p className="text-[9px] font-semibold leading-tight text-white">
                              是否刪除？
                            </p>
                            <div className="mt-1 flex gap-1">
                              <button
                                type="button"
                                className="rounded bg-[var(--danger)] px-1.5 py-0.5 text-[9px] font-bold text-white"
                                onClick={() => void deleteAsset(item.id)}
                              >
                                刪
                              </button>
                              <button
                                type="button"
                                className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-bold"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                否
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label="刪除這張圖（含儲存檔）"
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-white shadow"
                            onClick={(event) => {
                              event.stopPropagation();
                              setConfirmDeleteId(item.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {error ? (
              <p className="px-4 pb-2 text-center text-xs text-[var(--danger)]">
                {error}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {canEdit ? (
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void uploadFile(file);
        }}
      />
      ) : null}
    </div>
  );
}

function ToolBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl transition",
        danger
          ? "text-[var(--danger)] hover:bg-[var(--danger)]/10"
          : "text-[var(--ink)] hover:bg-[var(--surface)]",
      )}
    >
      {children}
    </button>
  );
}
