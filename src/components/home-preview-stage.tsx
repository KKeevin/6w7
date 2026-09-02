"use client";

import Image from "next/image";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

/** 第一屏手機框：固定窄寬，看起來才像直式手機 */
const HERO_PHONE_WIDTH = "14rem";

function SqueezeLine({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const node = textRef.current;
    if (!box || !node) return;

    const measure = () => {
      const avail = box.clientWidth;
      const need = node.scrollWidth;
      const next = need > avail && avail > 0 ? avail / need : 1;
      setScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(node);
    return () => observer.disconnect();
  }, [text]);

  return (
    <p ref={boxRef} className={cn("min-w-0 overflow-hidden", className)}>
      <span
        ref={textRef}
        className="block w-max whitespace-nowrap"
        style={{
          marginLeft: "50%",
          transform: `translateX(-50%) scaleX(${scale})`,
          transformOrigin: "center",
        }}
      >
        {text}
      </span>
    </p>
  );
}

function SixSevenMark({
  digit,
  className,
  style,
}: {
  digit: "6" | "7";
  className?: string;
  style?: CSSProperties;
}) {
  const mint = digit === "6";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl font-[family-name:var(--font-display)] text-xl font-extrabold text-white shadow-[0_8px_18px_rgba(20,33,43,0.18)] transition-transform duration-200 hover:scale-110",
        mint ? "bg-[var(--mint)]" : "bg-[var(--accent)]",
        className,
      )}
      style={style}
    >
      {digit}
    </span>
  );
}

/** 首頁手機預覽：貼紙晃、手機浮、輸入列輪播 */
export function HomePreviewStage() {
  const t = useT();
  const lines = [t("home.sample1"), t("home.sample2")];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % lines.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [lines.length]);

  return (
    <div className="relative mx-auto w-max max-w-full px-8 pb-12 pt-4 lg:mx-0">
      <div className="relative" style={{ width: HERO_PHONE_WIDTH }}>
        <SixSevenMark
          digit="6"
          className="home-wiggle absolute -left-3 top-16 z-10 sm:-left-5"
          style={{ ["--home-tilt" as string]: "-14deg" }}
        />
        <SixSevenMark
          digit="7"
          className="home-wiggle-late absolute -right-2 top-40 z-10 sm:-right-4"
          style={{ ["--home-tilt" as string]: "12deg" }}
        />
        <div className="home-float relative w-full min-w-0 rounded-[2.35rem] bg-[var(--ink)] p-[9px] shadow-[0_28px_60px_rgba(20,33,43,0.28)]">
          <div className="absolute inset-x-0 top-[16px] z-10 flex justify-center">
            <span className="h-3.5 w-16 rounded-full bg-black/35" />
          </div>
          <div className="bg-atmosphere w-full min-w-0 overflow-hidden rounded-[1.85rem] px-3 pb-3.5 pt-8">
            <p className="text-center text-[10px] font-semibold tracking-wide text-[var(--muted)]">
              {t("home.deviceUrl", { username: DEMO_PROFILE.username })}
            </p>
            <div className="mx-auto mt-4 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-full border-2 border-[var(--line)] bg-[var(--surface)]">
              <Image
                src={BRAND.landingPreviewAvatarSrc}
                alt={t("demo.avatar")}
                width={72}
                height={72}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2 text-center text-xs text-[var(--muted)]">
              @{DEMO_PROFILE.username}
            </p>
            <SqueezeLine
              text={t("home.previewAsk")}
              className="mt-3 font-[family-name:var(--font-display)] text-[1.05rem] font-bold leading-none text-[var(--ink)]"
            />
            <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
              {t("share.anonReassure")}
            </p>
            <div className="mt-4 flex min-h-16 items-start rounded-2xl border border-[var(--line)] bg-white px-3 py-2.5 text-xs text-[var(--ink)]">
              <span key={index} className="animate-rise">
                {lines[index]}
              </span>
              <span className="home-caret" aria-hidden />
            </div>
            <div className="animate-accepting-hint mt-2 rounded-xl bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-[var(--accent-fg)]">
              {t("home.previewSend")}
            </div>
          </div>
        </div>
        <Image
          src={BRAND.pointAtSrc}
          alt=""
          width={88}
          height={88}
          className="home-point pointer-events-none absolute -bottom-0.5 -right-1.5 w-[4.75rem] sm:w-[5.25rem]"
        />
      </div>
    </div>
  );
}

export function HomeSixSevenPair({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end", className)}>
      <SixSevenMark
        digit="6"
        className="home-wiggle"
        style={{ ["--home-tilt" as string]: "-6deg" }}
      />
      <SixSevenMark
        digit="7"
        className="home-wiggle-late ml-2"
        style={{ ["--home-tilt" as string]: "6deg" }}
      />
    </div>
  );
}
