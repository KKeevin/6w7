"use client";

import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

/** 限動圖卡底部：logo + .link，下方「匿名問答」對齊兩端 */
export function StoryBrandLockup({ logoSrc }: { logoSrc: string }) {
  const t = useT();
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 6,
        flexShrink: 0,
        alignSelf: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "flex-end",
          gap: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={BRAND.en}
          width={280}
          height={120}
          style={{
            height: 64,
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        <span
          style={{
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1,
            color: "rgba(255,248,246,0.88)",
            letterSpacing: "-0.04em",
            marginLeft: -4,
            transform: "translateY(-7px)",
          }}
        >
          .link
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          paddingLeft: 8,
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 1,
          color: "rgba(255,248,246,0.7)",
        }}
      >
        {t("share.kicker").split("").map((ch, i) => (
          <span key={`${ch}-${i}`}>{ch}</span>
        ))}
      </div>
    </div>
  );
}
