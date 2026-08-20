/** 分享限動圖：右下角指向圖與連結貼紙對位（1080×1920） */

export const SHARE_POINT_AT = {
  src: "/brand/point-at.png",
  width: 440,
  height: 734,
  /** 顯示尺寸下，指尖相對圖片左上 */
  tipX: 0,
  tipY: 215,
} as const;

export const SHARE_STICKER_BOX = {
  width: 400,
  height: 132,
} as const;

export function sharePointAtLayout(canvasW: number, canvasH: number) {
  const imgX = canvasW - SHARE_POINT_AT.width;
  const imgY = canvasH - SHARE_POINT_AT.height;
  const fingerX = imgX + SHARE_POINT_AT.tipX;
  const fingerY = imgY + SHARE_POINT_AT.tipY;
  return {
    imgX,
    imgY,
    fingerX,
    fingerY,
    stickerX: fingerX - SHARE_STICKER_BOX.width,
    stickerY: Math.round(fingerY - SHARE_STICKER_BOX.height / 2),
  };
}
