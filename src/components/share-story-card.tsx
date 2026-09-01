"use client";

import { BRAND } from "@/shared/tools";
import { getSiteUrl } from "@/lib/utils";
import { StoryBrandLockup } from "@/components/story-brand-lockup";
import {
  SHARE_POINT_AT,
  SHARE_STICKER_BOX,
  sharePointAtLayout,
} from "@/shared/share-story-art";
import { useT } from "@/components/i18n-provider";

const W = 1080;
const H = 1920;

function assetUrl(path: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `${getSiteUrl()}${path}`;
}

function logoUrl() {
  return `${assetUrl(BRAND.logoSrc)}?v=${BRAND.logoVersion}`;
}

function pointAtUrl() {
  return assetUrl(SHARE_POINT_AT.src);
}

export type ShareStoryCardProps = {
  username: string;
  prompt: string;
  /** 頭貼絕對／相對／data URL；無則顯示字首 */
  imageUrl?: string | null;
  displayName?: string | null;
  /** 匯出用：預先轉好的 logo data URL，手機較穩 */
  logoSrc?: string | null;
};

/** 分享頁限動底圖（邀請留言用，與收件匣回覆圖卡版型不同） */
export function ShareStoryCard({
  username,
  prompt,
  imageUrl,
  displayName,
  logoSrc,
}: ShareStoryCardProps) {
  const t = useT();
  const initial = (displayName || username).slice(0, 1).toUpperCase();
  const resolvedLogo = logoSrc || logoUrl();
  const resolvedPointAt = pointAtUrl();
  const art = sharePointAtLayout(W, H);

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0f1a22",
        fontFamily:
          '"Syne", "Figtree", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',
        color: "#fff8f6",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      {/* 氣氛光暈 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 20% 15%, rgba(26,166,138,0.35), transparent 55%), radial-gradient(ellipse 70% 45% at 90% 30%, rgba(49,151,229,0.28), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,90,60,0.22), transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 22,
          background: "linear-gradient(180deg, #1aa68a 0%, #3197e5 55%, #ff5a3c 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 4,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "88px 72px 80px 96px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedLogo}
            alt={BRAND.en}
            width={200}
            height={80}
            style={{ height: 52, width: "auto", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: 36,
            minHeight: 0,
            padding: "16px 0 120px",
          }}
        >
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: "50%",
              overflow: "hidden",
              border: "6px solid rgba(255,248,246,0.9)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
              backgroundColor: "#1aa68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                width={220}
                height={220}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 96, fontWeight: 800, color: "#fff" }}>
                {initial}
              </span>
            )}
          </div>

          <div style={{ fontSize: 32, fontWeight: 600, color: "rgba(255,248,246,0.65)" }}>
            @{username}
          </div>

          <p
            style={{
              margin: 0,
              maxWidth: 820,
              fontSize:
                prompt.length > 60 ? 44 : prompt.length > 30 ? 52 : 58,
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              wordBreak: "break-word" as const,
            }}
          >
            {prompt}
          </p>
        </div>

        <div
          style={{
            flexShrink: 0,
            alignSelf: "center",
            marginBottom: 8,
          }}
        >
          <StoryBrandLockup logoSrc={resolvedLogo} />
        </div>
      </div>

      {/* 連結貼紙：對準右下指向圖的指尖 */}
      <div
        style={{
          position: "absolute",
          left: art.stickerX,
          top: art.stickerY,
          width: SHARE_STICKER_BOX.width,
          height: SHARE_STICKER_BOX.height,
          zIndex: 2,
          borderRadius: 24,
          border: "3px dashed rgba(255,248,246,0.35)",
          backgroundColor: "rgba(255,248,246,0.06)",
          padding: "20px 28px",
          textAlign: "center" as const,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "rgba(255,248,246,0.5)",
          }}
        >
          {t("shareStory.linkHint")}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedPointAt}
        alt=""
        width={SHARE_POINT_AT.width}
        height={SHARE_POINT_AT.height}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: SHARE_POINT_AT.width,
          height: SHARE_POINT_AT.height,
          objectFit: "contain",
          objectPosition: "right bottom",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export const SHARE_STORY_SIZE = { width: W, height: H } as const;
