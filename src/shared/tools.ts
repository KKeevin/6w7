/** 工具註冊表 — 新增工具先改這裡（AGENTS.md §6）
 *  coming_soon 僅供內部；對外 UI 只用 getPublicTools()
 */

export type ToolStatus = "active" | "coming_soon";

export type ToolDefinition = {
  toolId: string;
  name: string;
  nameEn: string;
  description: string;
  href: string;
  status: ToolStatus;
};

export const TOOLS: ToolDefinition[] = [
  {
    toolId: "ask",
    name: "匿名問答",
    nameEn: "Ask",
    description: "產生專屬短連結，在社群分享後收取匿名留言。",
    href: "/dashboard",
    status: "active",
  },
  {
    toolId: "face",
    name: "AI 換臉",
    nameEn: "Face",
    description: "之後開放。同一帳號即可使用。",
    href: "/tools/face",
    status: "coming_soon",
  },
  {
    toolId: "imagegen",
    name: "AI 產圖",
    nameEn: "Image",
    description: "之後開放。創作小工具陸續上架。",
    href: "/tools/imagegen",
    status: "coming_soon",
  },
];

/** MVP：尚無公開工具目錄；第二個工具真正上線後再改為 true */
export const SHOW_TOOLS_DIRECTORY = false;

/** 使用者可見的工具（永不包含 coming_soon） */
export function getPublicTools(): ToolDefinition[] {
  if (!SHOW_TOOLS_DIRECTORY) return [];
  return TOOLS.filter((t) => t.status === "active");
}

export const BRAND = {
  en: "6w7",
  zh: "樂玩ㄑ",
  domain: "6w7.link",
  tagline: "用你的 IG 帳號，立刻拿到專屬匿名連結。",
  /** 瀏覽器標題後綴／首頁標題 */
  titleProduct: "6w7 匿名問答",
  titleHome: "6w7 匿名問答",
  /** meta description／OG 描述 */
  seoDescription:
    "6w7 匿名問答：用 IG 帳號註冊就有專屬短連結，貼到限動就能收匿名提問，收件頁面能自由布置貼圖貼紙，亦可製作多種限動圖卡分享至 IG。",
  /** 對外聯絡信箱（聯絡我們頁／頁尾）；請確保此信箱收得到信 */
  contactEmail: "service@6w7.link",
  /** 靜態資源：public/brand/logo.png */
  logoSrc: "/brand/logo.png",
  /** 分享限動圖右下角指向圖：public/brand/point-at.png */
  pointAtSrc: "/brand/point-at.png",
  /** 收件匣沒有留言時的插畫：public/brand/inbox-empty.png */
  inboxEmptySrc: "/brand/inbox-empty.png",
  /** 分享頁「限動教學」彈窗：手機規格 walkthrough（CDN） */
  shareIgGuideVideoSrc:
    "https://cdn.6w7.link/walkthrough/guide_share_to_ig_001.mp4",
  /** 換 logo 後遞增，用來清瀏覽器／元件快取（勿加在 Next Image src query） */
  logoVersion: 3,
} as const;

export const ASK_LIMITS = {
  bodyMin: 1,
  bodyMax: 500,
  titleMax: 80,
  promptMax: 200,
  topicsMax: 5,
  /** 公開短連結長度：https://6w7.link/{slug} */
  slugLength: 6,
  stickerLibraryMax: 20,
  stickerCanvasMax: 12,
  /** 使用者可挑的原始圖片上限；超過就在前端擋下，不送出請求 */
  imageUploadMaxBytes: 30 * 1024 * 1024,
  /** 瀏覽器先壓到這個大小才送 API（雲端函式的請求本文有上限） */
  uploadTargetBytes: 4 * 1024 * 1024,
  /** 頭貼預壓最長邊；伺服器最後固定輸出 512px PNG */
  avatarMaxEdge: 1024,
  /** 貼紙最長邊；前端預壓與伺服器輸出一致 */
  stickerMaxEdge: 1600,
  stickerScaleMin: 0.35,
  stickerScaleMax: 2.8,
  inboxPageSize: 10,
} as const;
