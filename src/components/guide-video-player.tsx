"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GuideVideoPlayer({
  src,
  onEnded,
}: {
  src: string;
  onEnded?: () => void;
}) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const dragging = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);

  const revealChrome = useCallback((keep = false) => {
    setChromeVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (keep || !video || video.paused || video.ended) return;
      setChromeVisible(false);
    }, 2200);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0;
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
    revealChrome();
  }, [revealChrome]);

  function seekFromClientX(clientX: number) {
    const video = videoRef.current;
    const track = trackRef.current;
    if (!video || !track || !Number.isFinite(video.duration)) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setCurrent(video.currentTime);
    setEnded(false);
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
      revealChrome();
    };
    const onPause = () => {
      setPlaying(false);
      setChromeVisible(true);
    };
    const onEndedPlay = () => {
      setPlaying(false);
      setEnded(true);
      setChromeVisible(true);
      onEndedRef.current?.();
    };
    const onTime = () => {
      if (!dragging.current) setCurrent(video.currentTime);
    };
    const onMeta = () => setDuration(video.duration || 0);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEndedPlay);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);

    void video.play().catch(() => {});
    rootRef.current?.focus({ preventScroll: true });

    return () => {
      video.pause();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEndedPlay);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [revealChrome]);

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 select-none outline-none"
      role="region"
      aria-label={t("guide.videoAria")}
      tabIndex={0}
      onMouseMove={() => revealChrome()}
      onKeyDown={(e) => {
        const video = videoRef.current;
        if (!video) return;
        if (e.key === " " || e.key === "k" || e.key === "K") {
          e.preventDefault();
          togglePlay();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          video.currentTime = Math.min(
            video.duration || 0,
            video.currentTime + 5,
          );
        } else if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          setMuted((m) => !m);
          revealChrome();
        }
      }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        preload="auto"
        disablePictureInPicture
        controls={false}
        muted={muted}
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src={src} type="video/mp4" />
        {t("guide.cannotPlay")}
      </video>

      <div
        className="absolute inset-0 z-10 cursor-pointer"
        aria-hidden
        onClick={togglePlay}
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200",
          playing ? "opacity-0" : "opacity-100",
        )}
        aria-hidden
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_10px_28px_rgba(255,90,60,0.45)]">
          {ended ? (
            <RotateCcw className="h-7 w-7" strokeWidth={2.4} />
          ) : (
            <Play className="ml-0.5 h-8 w-8" strokeWidth={2.4} fill="currentColor" />
          )}
        </span>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[var(--ink)]/90 via-[var(--ink)]/45 to-transparent px-3 pb-3 pt-10 transition-opacity duration-200",
          chromeVisible || !playing ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          ref={trackRef}
          className="group relative flex h-5 cursor-pointer items-center"
          role="slider"
          aria-label={t("guide.progress")}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
          tabIndex={0}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekFromClientX(e.clientX);
            revealChrome(true);
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            seekFromClientX(e.clientX);
          }}
          onPointerUp={(e) => {
            if (!dragging.current) return;
            dragging.current = false;
            seekFromClientX(e.clientX);
            revealChrome();
          }}
          onKeyDown={(e) => {
            const video = videoRef.current;
            if (!video) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation();
              const delta = e.key === "ArrowLeft" ? -5 : 5;
              video.currentTime = Math.min(
                video.duration || 0,
                Math.max(0, video.currentTime + delta),
              );
            }
          }}
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--mint)] shadow-sm"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-white">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint)]"
            aria-label={playing ? t("guide.pause") : ended ? t("guide.replay") : t("guide.play")}
            onClick={togglePlay}
          >
            {ended ? (
              <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
            ) : playing ? (
              <Pause className="h-4 w-4" strokeWidth={2.4} fill="currentColor" />
            ) : (
              <Play className="ml-px h-4 w-4" strokeWidth={2.4} fill="currentColor" />
            )}
          </button>

          <p className="min-w-0 flex-1 font-[family-name:var(--font-display)] text-[10px] font-bold tracking-[0.14em] text-white/70">
            {BRAND.en}
          </p>

          <span className="tabular-nums text-[11px] font-semibold text-white/90">
            {formatTime(current)}
            <span className="text-white/45"> / {formatTime(duration)}</span>
          </span>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mint)]"
            aria-label={muted ? t("guide.unmute") : t("guide.mute")}
            onClick={() => {
              setMuted((m) => !m);
              revealChrome();
            }}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" strokeWidth={2.4} />
            ) : (
              <Volume2 className="h-4 w-4" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
