/**
 * 以 Canvas 直接繪製限動圖卡。
 * 手機 Safari／IG 內建瀏覽器對 html-to-image（SVG foreignObject）常不畫 <img>，
 * 即使已轉成 data URL 也會空白；Canvas drawImage 才穩。
 */

import { BRAND } from "@/shared/tools";
import { fetchAsDataUrl } from "@/lib/save-image";

export const STORY_PNG_SIZE = { width: 1080, height: 1920 } as const;

const FONT =
  '"Syne", "Figtree", "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

function brandLogoUrl() {
  return `${window.location.origin}${BRAND.logoSrc}?v=${BRAND.logoVersion}`;
}

function absoluteUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

async function tryLoadDataUrl(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return null;
  const data = url.startsWith("data:") ? url : await fetchAsDataUrl(absoluteUrl(url));
  if (!data) return null;
  try {
    return await loadImage(data);
  } catch {
    return null;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const ch of para) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
) {
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, x, y, w, h);
  return { w, h };
}

function drawCoverCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  diameter: number,
) {
  const r = diameter / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const scale = Math.max(diameter / img.naturalWidth, diameter / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

export type ShareStoryRenderInput = {
  username: string;
  prompt: string;
  imageUrl?: string | null;
  displayName?: string | null;
};

/** 分享頁限動底圖 → PNG data URL */
export async function renderShareStoryPng(
  input: ShareStoryRenderInput,
): Promise<string> {
  const { width: W, height: H } = STORY_PNG_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  const [logo, avatar] = await Promise.all([
    tryLoadDataUrl(brandLogoUrl()),
    tryLoadDataUrl(input.imageUrl),
  ]);

  // 底色
  ctx.fillStyle = "#0f1a22";
  ctx.fillRect(0, 0, W, H);

  // 氣氛光暈
  const g1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, W * 0.55);
  g1.addColorStop(0, "rgba(26,166,138,0.35)");
  g1.addColorStop(1, "rgba(26,166,138,0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(W * 0.9, H * 0.3, 0, W * 0.9, H * 0.3, W * 0.5);
  g2.addColorStop(0, "rgba(49,151,229,0.28)");
  g2.addColorStop(1, "rgba(49,151,229,0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  const g3 = ctx.createRadialGradient(W * 0.5, H, 0, W * 0.5, H, W * 0.45);
  g3.addColorStop(0, "rgba(255,90,60,0.22)");
  g3.addColorStop(1, "rgba(255,90,60,0)");
  ctx.fillStyle = g3;
  ctx.fillRect(0, 0, W, H);

  // 左側色條
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, "#1aa68a");
  bar.addColorStop(0.55, "#3197e5");
  bar.addColorStop(1, "#ff5a3c");
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 22, H);

  // 頂部 logo + 標籤
  let logoDrawnW = 0;
  if (logo) {
    const drawn = drawContain(ctx, logo, 96, 88, 200, 52);
    logoDrawnW = drawn.w;
  } else {
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText(BRAND.en, 96, 128);
    logoDrawnW = ctx.measureText(BRAND.en).width;
  }
  ctx.fillStyle = "rgba(255,248,246,0.55)";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText("匿名問答", 96 + logoDrawnW + 16, 122);

  // 中央頭貼
  const avatarCx = W / 2;
  const avatarCy = 520;
  const avatarD = 220;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarD / 2 + 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,248,246,0.9)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarD / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#1aa68a";
  ctx.fill();

  if (avatar) {
    drawCoverCircle(ctx, avatar, avatarCx, avatarCy, avatarD);
  } else {
    const initial = (input.displayName || input.username).slice(0, 1).toUpperCase();
    ctx.fillStyle = "#fff";
    ctx.font = `800 96px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, avatarCx, avatarCy + 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // @username
  ctx.fillStyle = "rgba(255,248,246,0.65)";
  ctx.font = `600 32px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`@${input.username}`, avatarCx, 680);

  // prompt
  const promptSize =
    input.prompt.length > 60 ? 44 : input.prompt.length > 30 ? 52 : 58;
  ctx.fillStyle = "#fff8f6";
  ctx.font = `800 ${promptSize}px ${FONT}`;
  const promptLines = wrapText(ctx, input.prompt, 820);
  const promptLineH = promptSize * 1.25;
  let promptY = 760;
  for (const line of promptLines.slice(0, 8)) {
    ctx.fillText(line, avatarCx, promptY);
    promptY += promptLineH;
  }

  // CTA pill
  const cta = "匿名留言給我吧";
  ctx.font = `600 28px ${FONT}`;
  const ctaW = ctx.measureText(cta).width + 72;
  const ctaH = 64;
  const ctaX = avatarCx - ctaW / 2;
  const ctaY = promptY + 24;
  roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 999);
  ctx.fillStyle = "rgba(255,248,246,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,248,246,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,248,246,0.85)";
  ctx.textBaseline = "middle";
  ctx.fillText(cta, avatarCx, ctaY + ctaH / 2);
  ctx.textBaseline = "alphabetic";

  // 連結貼紙虛線框
  const boxW = 520;
  const boxH = 200;
  const boxX = (W - boxW) / 2;
  const boxY = H - 80 - 64 - 20 - boxH;
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = "rgba(255,248,246,0.35)";
  ctx.lineWidth = 3;
  roundRect(ctx, boxX, boxY, boxW, boxH, 24);
  ctx.fillStyle = "rgba(255,248,246,0.06)";
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,248,246,0.5)";
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText("連結貼紙可放這裡", avatarCx, boxY + boxH / 2 + 8);

  // 品牌腳
  ctx.fillStyle = "rgba(255,248,246,0.5)";
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(`${BRAND.en}（${BRAND.zh}）`, avatarCx, H - 80);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

export type InboxStoryRenderInput = {
  body: string;
  reply?: string;
  topic?: string | null;
  linkTitle?: string;
  shareHost?: string;
};

/** 收件匣回覆限動圖卡 → PNG data URL */
export async function renderInboxStoryPng(
  input: InboxStoryRenderInput,
): Promise<string> {
  const { width: W, height: H } = STORY_PNG_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  const logo = await tryLoadDataUrl(brandLogoUrl());
  const shareHost = input.shareHost || "6w7.link";
  const reply = input.reply?.trim() || "";

  ctx.fillStyle = "#14212b";
  ctx.fillRect(0, 0, W, H);

  const glow1 = ctx.createRadialGradient(180, 140, 0, 180, 140, 260);
  glow1.addColorStop(0, "rgba(26,166,138,0.45)");
  glow1.addColorStop(1, "rgba(26,166,138,0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W - 40, 440, 0, W - 40, 440, 240);
  glow2.addColorStop(0, "rgba(255,90,60,0.28)");
  glow2.addColorStop(1, "rgba(255,90,60,0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // 頂部 logo
  if (logo) {
    drawContain(ctx, logo, 72, 80, 220, 56);
  } else {
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 44px ${FONT}`;
    ctx.fillText(BRAND.en, 72, 125);
  }

  // 白卡片
  const cardX = 72;
  const cardY = 220;
  const cardW = W - 144;
  const cardH = 720;
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 左側紅條
  ctx.fillStyle = "#ff5a3c";
  ctx.fillRect(cardX, cardY, 18, cardH);

  const label = input.topic
    ? `主題｜${input.topic}`
    : input.linkTitle || "匿名留言";
  ctx.fillStyle = "#1aa68a";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(label, cardX + 62, cardY + 70);

  const bodySize =
    input.body.length > 80 ? 42 : input.body.length > 40 ? 48 : 56;
  ctx.fillStyle = "#14212b";
  ctx.font = `700 ${bodySize}px ${FONT}`;
  const bodyLines = wrapText(ctx, input.body, cardW - 130);
  let by = cardY + 130;
  for (const line of bodyLines.slice(0, 10)) {
    ctx.fillText(line, cardX + 62, by);
    by += bodySize * 1.35;
  }

  ctx.fillStyle = "#14212b";
  roundRect(ctx, cardX + 62, by + 16, 72, 4, 2);
  ctx.fill();

  // 回覆
  ctx.textAlign = "center";
  if (reply) {
    const replySize = reply.length > 60 ? 40 : 48;
    ctx.fillStyle = "#fff8f6";
    ctx.font = `600 ${replySize}px ${FONT}`;
    const replyLines = wrapText(ctx, reply, W - 160);
    let ry = cardY + cardH + 100;
    for (const line of replyLines.slice(0, 6)) {
      ctx.fillText(line, W / 2, ry);
      ry += replySize * 1.4;
    }
  } else {
    ctx.fillStyle = "rgba(255,248,246,0.35)";
    ctx.font = `500 32px ${FONT}`;
    ctx.fillText("（在此寫下你的回覆）", W / 2, cardY + cardH + 100);
  }

  // 底部 host pill
  ctx.font = `700 28px ${FONT}`;
  const pillText = shareHost;
  const pillW = ctx.measureText(pillText).width + 70;
  const pillH = 56;
  const pillX = (W - pillW) / 2;
  const pillY = H - 220;
  roundRect(ctx, pillX, pillY, pillW, pillH, 999);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#ff5a3c";
  roundRect(ctx, pillX + 20, pillY + 20, 16, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#14212b";
  ctx.textBaseline = "middle";
  ctx.fillText(pillText, W / 2 + 10, pillY + pillH / 2);
  ctx.textBaseline = "alphabetic";

  // 底部 logo
  if (logo) {
    const maxH = 64;
    const scale = Math.min(280 / logo.naturalWidth, maxH / logo.naturalHeight);
    const lw = logo.naturalWidth * scale;
    const lh = logo.naturalHeight * scale;
    ctx.drawImage(logo, (W - lw) / 2, H - 140, lw, lh);
  } else {
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText(BRAND.en, W / 2, H - 100);
  }

  ctx.fillStyle = "rgba(255,248,246,0.7)";
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText(`${BRAND.zh} · 匿名問答`, W / 2, H - 50);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}
