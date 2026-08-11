import { BRAND } from "@/shared/tools";
import { getSiteUrl } from "@/lib/utils";

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
};

/** IG 限動尺寸圖卡（6w7 自有版型，非 NGL 複製） */
export function StoryCard({
  body,
  reply,
  topic,
  linkTitle,
  shareHost = "6w7.link",
  logoSrc,
}: StoryCardProps) {
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
            {...(resolvedLogo.startsWith("data:")
              ? {}
              : { crossOrigin: "anonymous" as const })}
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
            padding: "40px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              borderRadius: 28,
              overflow: "hidden",
              backgroundColor: "#ffffff",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
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
                {topic ? `主題｜${topic}` : linkTitle || "匿名留言"}
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
                （在此寫下你的回覆）
              </p>
            )}
          </div>
        </div>

        {/* 底部品牌 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#ffffff",
              color: "#14212b",
              borderRadius: 999,
              padding: "14px 28px",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: "#ff5a3c",
                display: "inline-block",
              }}
            />
            {shareHost}
          </div>
          <div style={{ textAlign: "center" as const }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedLogo}
              alt={BRAND.en}
              width={280}
              height={120}
              style={{
                height: 64,
                width: "auto",
                objectFit: "contain",
                margin: "0 auto",
              }}
              {...(resolvedLogo.startsWith("data:")
                ? {}
                : { crossOrigin: "anonymous" as const })}
            />
            <div
              style={{
                marginTop: 10,
                fontSize: 26,
                fontWeight: 600,
                color: "rgba(255,248,246,0.7)",
              }}
            >
              {BRAND.zh} · 匿名問答
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const STORY_CARD_SIZE = { width: W, height: H } as const;
