"use client";

import { BRAND } from "@/shared/tools";
import { getSiteUrl } from "@/lib/utils";
import { StoryBrandLockup } from "@/components/story-brand-lockup";
import { useT } from "@/components/i18n-provider";
import { displayAskTitle } from "@/shared/ask-title";

const W = 1080;
const H = 1920;

function logoUrl() {
  const path = `${BRAND.logoSrc}?v=${BRAND.logoVersion}`;
  // html-to-image 匯出時需絕對路徑
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return `${getSiteUrl()}${path}`;
}

export type StoryCardProps = {
  body: string;
  reply?: string;
  topic?: string | null;
  linkTitle?: string;
  shareHost?: string;
  /** 匯出用 logo data URL */
  logoSrc?: string | null;
  /** 預覽模式：點提問文字放大閱讀 */
  onBodyClick?: () => void;
};

/** IG 限動尺寸圖卡（6w7 自有版型，非 NGL 複製） */
export function StoryCard({
  body,
  reply,
  topic,
  linkTitle,
  logoSrc,
  onBodyClick,
}: StoryCardProps) {
  const t = useT();
  const resolvedLogo = logoSrc || logoUrl();
  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#14212b",
        fontFamily:
          '"Figtree", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif',
        color: "#fff8f6",
        display: "flex",
        flexDirection: "column",
        padding: "80px 72px 72px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(26,166,138,0.45) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 200,
          right: -160,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,90,60,0.28) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* 頂部品牌標 */}
        <div style={{ flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedLogo}
            alt={BRAND.en}
            width={220}
            height={90}
            style={{ height: 56, width: "auto", objectFit: "contain" }}
          />
        </div>

        {/* 問題＋答案垂直置中 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "stretch",
            gap: 48,
            minHeight: 0,
            padding: "16px 0 80px",
          }}
        >
          <div style={{ position: "relative", width: "100%", flexShrink: 0 }}>
          <div
            role={onBodyClick ? "button" : undefined}
            tabIndex={onBodyClick ? 0 : undefined}
            onClick={onBodyClick}
            onKeyDown={
              onBodyClick
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onBodyClick();
                    }
                  }
                : undefined
            }
            style={{
              display: "flex",
              borderRadius: 28,
              overflow: "hidden",
              backgroundColor: "#ffffff",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              cursor: onBodyClick ? "pointer" : "default",
              textAlign: "left",
              border: "none",
              padding: 0,
              width: "100%",
              font: "inherit",
              color: "inherit",
            }}
          >
            <div
              style={{ width: 18, backgroundColor: "#ff5a3c", flexShrink: 0 }}
            />
            <div
              style={{
                flex: 1,
                padding: "48px 44px 56px",
                color: "#14212b",
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#1aa68a",
                }}
              >
                {topic
                  ? t("story.topicPrefix", { topic })
                  : displayAskTitle(linkTitle, t("share.askTitle"))}
              </div>
              <div
                style={{
                  fontSize: body.length > 80 ? 42 : body.length > 40 ? 48 : 56,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  whiteSpace: "pre-wrap" as const,
                  wordBreak: "break-word" as const,
                }}
              >
                {body}
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 4,
                  width: 72,
                  backgroundColor: "#14212b",
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          {onBodyClick ? (
            <>
              <span className="story-read-hint-box" aria-hidden />
              <span className="story-read-hint-label">{t("story.readHint")}</span>
            </>
          ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center" as const,
              padding: "0 24px",
            }}
          >
            {reply?.trim() ? (
              <p
                style={{
                  margin: 0,
                  fontSize: reply.length > 60 ? 40 : 48,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap" as const,
                  wordBreak: "break-word" as const,
                  color: "#fff8f6",
                }}
              >
                {reply.trim()}
              </p>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 32,
                  color: "rgba(255,248,246,0.35)",
                  fontWeight: 500,
                }}
              >
                {t("story.replyPreview")}
              </p>
            )}
          </div>
        </div>

        {/* 底部品牌 */}
        <StoryBrandLockup logoSrc={resolvedLogo} />
      </div>
    </div>
  );
}

export const STORY_CARD_SIZE = { width: W, height: H } as const;
