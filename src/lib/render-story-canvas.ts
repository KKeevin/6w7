/**
 * 以 Canvas 直接繪製限動圖卡。
 * 手機 Safari／IG 內建瀏覽器對 html-to-image（SVG foreignObject）常不畫 <img>，
 * 即使已轉成 data URL 也會空白；Canvas drawImage 才穩。
 */

import { BRAND } from "@/shared/tools";
import { fetchAsDataUrl } from "@/lib/save-image";
import {
  SHARE_POINT_AT,
  SHARE_STICKER_BOX,
  sharePointAtLayout,
} from "@/shared/share-story-art";

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

const LOCKUP_LOGO_H = 64;
const LOCKUP_CAPTION_SIZE = 24;
const LOCKUP_CAPTION_GAP = 6;
const LOCKUP_CAPTION_INSET = 8;
const LOCKUP_LINK_SIZE = 36;
export const STORY_BRAND_LOCKUP_H =
  LOCKUP_LOGO_H + LOCKUP_CAPTION_GAP + LOCKUP_CAPTION_SIZE;

/** 底部品牌：logo + .link，下方「匿名問答」拉開對齊 */
function drawBrandLockup(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  centerX: number,
  topY: number,
  caption = "匿名問答",
) {
  ctx.font = `700 ${LOCKUP_LINK_SIZE}px ${FONT}`;
  const linkLabel = ".link";
  const linkW = ctx.measureText(linkLabel).width;
  const logoLinkOverlap = 4;
  let groupX = centerX;
  let groupW = 0;

  if (logo) {
    const scale = Math.min(
      280 / logo.naturalWidth,
      LOCKUP_LOGO_H / logo.naturalHeight,
    );
    const lw = logo.naturalWidth * scale;
    const lh = logo.naturalHeight * scale;
    groupW = lw + linkW - logoLinkOverlap;
    groupX = centerX - groupW / 2;
    const imgY = topY + (LOCKUP_LOGO_H - lh) / 2;
    ctx.drawImage(logo, groupX, imgY, lw, lh);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,248,246,0.88)";
    ctx.fillText(linkLabel, groupX + lw - logoLinkOverlap, imgY + lh - 8);
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 40px ${FONT}`;
    const fallback = `${BRAND.en}.link`;
    groupW = ctx.measureText(fallback).width;
    groupX = centerX - groupW / 2;
    ctx.fillText(fallback, centerX, topY + LOCKUP_LOGO_H);
  }

  ctx.font = `600 ${LOCKUP_CAPTION_SIZE}px ${FONT}`;
  ctx.fillStyle = "rgba(255,248,246,0.7)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const chars = [...caption];
  const charWs = chars.map((ch) => ctx.measureText(ch).width);
  const glyphW = charWs.reduce((sum, w) => sum + w, 0);
  const spread =
    chars.length > 1
      ? (groupW - LOCKUP_CAPTION_INSET - glyphW) / (chars.length - 1)
      : 0;
  let cx = groupX + LOCKUP_CAPTION_INSET;
  const captionY = topY + LOCKUP_LOGO_H + LOCKUP_CAPTION_GAP;
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], cx, captionY);
    cx += charWs[i] + spread;
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
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
  askCaption?: string;
  linkHint?: string;
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

  const [logo, avatar, pointAt] = await Promise.all([
    tryLoadDataUrl(brandLogoUrl()),
    tryLoadDataUrl(input.imageUrl),
    tryLoadDataUrl(SHARE_POINT_AT.src),
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

  // 頂部小 logo（底部已有完整品牌 lockup，避免重複「匿名問答」）
  if (logo) {
    drawContain(ctx, logo, 96, 88, 200, 52);
  } else {
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText(BRAND.en, 96, 128);
  }

  // 中央頭貼
  const avatarCx = W / 2;
  const avatarCy = 456;
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
  ctx.fillText(`@${input.username}`, avatarCx, 616);

  // prompt
  const promptSize =
    input.prompt.length > 60 ? 44 : input.prompt.length > 30 ? 52 : 58;
  ctx.fillStyle = "#fff8f6";
  ctx.font = `800 ${promptSize}px ${FONT}`;
  const promptLines = wrapText(ctx, input.prompt, 820);
  const promptLineH = promptSize * 1.25;
  let promptY = 696;
  for (const line of promptLines.slice(0, 8)) {
    ctx.fillText(line, avatarCx, promptY);
    promptY += promptLineH;
  }

  // 連結貼紙虛線框：對準右下指向圖指尖；品牌 lockup 蓋在人物上方以免被擋
  const padBottom = 80;
  const groupMarginBottom = 8;
  const art = sharePointAtLayout(W, H);
  const boxW = SHARE_STICKER_BOX.width;
  const boxH = SHARE_STICKER_BOX.height;
  const boxX = art.stickerX;
  const boxY = art.stickerY;
  const lockupTop =
    H - padBottom - groupMarginBottom - STORY_BRAND_LOCKUP_H;
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    input.linkHint ?? "連結貼紙可放這裡",
    boxX + boxW / 2,
    boxY + boxH / 2,
  );
  ctx.textBaseline = "alphabetic";

  if (pointAt) {
    ctx.drawImage(
      pointAt,
      art.imgX,
      art.imgY,
      SHARE_POINT_AT.width,
      SHARE_POINT_AT.height,
    );
  }

  drawBrandLockup(ctx, logo, avatarCx, lockupTop, input.askCaption);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

export type InboxStoryRenderInput = {
  body: string;
  reply?: string;
  topic?: string | null;
  linkTitle?: string;
  shareHost?: string;
  askCaption?: string;
  topicLabel?: string;
};

/** 收件匣回覆限動圖卡 → PNG data URL（版型對齊 `StoryCard` 預覽） */
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
  const reply = input.reply?.trim() || "";
  const body = input.body || "";

  const padX = 72;
  const padTop = 80;
  const padBottom = 72;
  const logoH = 56;
  const midPadY = 40;
  const gapMain = 48;
  const barW = 18;
  const cardRadius = 28;
  const innerPadX = 44;
  const innerPadTop = 48;
  const innerPadBottom = 56;
  const innerGap = 28;
  const labelSize = 26;
  const underlineH = 4;
  const underlineW = 72;
  const underlineGap = 8;

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

  if (logo) {
    drawContain(ctx, logo, padX, padTop, 220, logoH);
  } else {
    ctx.fillStyle = "#fff8f6";
    ctx.font = `800 44px ${FONT}`;
    ctx.textBaseline = "top";
    ctx.fillText(BRAND.en, padX, padTop);
  }

  const cardX = padX;
  const cardW = W - padX * 2;
  const textMaxW = cardW - barW - innerPadX * 2;

  let bodySize = body.length > 80 ? 42 : body.length > 40 ? 48 : 56;
  const replySize = reply.length > 60 ? 40 : 48;
  const replyLineH = replySize * 1.4;

  ctx.font = `600 ${replySize}px ${FONT}`;
  const replyLines = reply ? wrapText(ctx, reply, W - padX * 2 - 48) : [];
  const replyH = reply
    ? Math.max(1, Math.min(replyLines.length, 6)) * replyLineH
    : 0;
  const replyGap = reply ? gapMain : 0;

  const footerH = STORY_BRAND_LOCKUP_H;
  const footerTop = H - padBottom - footerH;
  const middleTop = padTop + logoH + midPadY;
  const middleBottom = footerTop - midPadY;
  const maxBlockH = Math.max(280, middleBottom - middleTop);

  let bodyLines: string[] = [];
  let bodyLineH = bodySize * 1.35;
  let cardH = 0;
  let blockH = 0;

  for (let i = 0; i < 8; i += 1) {
    ctx.font = `700 ${bodySize}px ${FONT}`;
    bodyLines = wrapText(ctx, body, textMaxW);
    bodyLineH = bodySize * 1.35;
    const maxBodyLines = Math.max(
      1,
      Math.floor(
        (maxBlockH -
          replyGap -
          replyH -
          innerPadTop -
          labelSize -
          innerGap -
          underlineGap -
          underlineH -
          innerPadBottom) /
          bodyLineH,
      ),
    );
    bodyLines = bodyLines.slice(0, Math.min(bodyLines.length, maxBodyLines));
    const bodyH = bodyLines.length * bodyLineH;
    cardH =
      innerPadTop +
      labelSize +
      innerGap +
      bodyH +
      underlineGap +
      underlineH +
      innerPadBottom;
    blockH = cardH + replyGap + replyH;
    if (blockH <= maxBlockH || bodySize <= 32) break;
    bodySize -= 4;
  }

  const cardY = middleTop + Math.max(0, (maxBlockH - blockH) / 2 - 56);
  const replyY = cardY + cardH + replyGap;

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.clip();
  ctx.fillStyle = "#ff5a3c";
  ctx.fillRect(cardX, cardY, barW, cardH);
  ctx.restore();

  const textX = cardX + barW + innerPadX;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const label =
    input.topicLabel ??
    (input.topic ? `主題｜${input.topic}` : input.linkTitle || "匿名問我");
  ctx.fillStyle = "#1aa68a";
  ctx.font = `700 ${labelSize}px ${FONT}`;
  ctx.fillText(label, textX, cardY + innerPadTop);

  ctx.fillStyle = "#14212b";
  ctx.font = `700 ${bodySize}px ${FONT}`;
  let by = cardY + innerPadTop + labelSize + innerGap;
  for (const line of bodyLines) {
    ctx.fillText(line, textX, by);
    by += bodyLineH;
  }

  ctx.fillStyle = "#14212b";
  roundRect(
    ctx,
    textX,
    by + underlineGap,
    underlineW,
    underlineH,
    2,
  );
  ctx.fill();

  if (reply) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff8f6";
    ctx.font = `600 ${replySize}px ${FONT}`;
    let ry = replyY;
    for (const line of replyLines.slice(0, 6)) {
      ctx.fillText(line, W / 2, ry);
      ry += replyLineH;
    }
  }

  drawBrandLockup(ctx, logo, W / 2, footerTop, input.askCaption);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return canvas.toDataURL("image/png");
}
