/** 全站殼層對齊：header／footer／內容水平邊距一致 */
export const SHELL_X = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** 帳號／收件等內頁主欄（桌機同寬；桌機整體放大） */
export const SHELL_CONTENT =
  "mx-auto w-full max-w-xl lg:origin-top lg:[zoom:1.12]";

/** 內頁 main：atmosphere 滿幅於殼層內，內容再置中同寬 */
export const PAGE_MAIN = `bg-atmosphere flex-1 ${SHELL_X} py-8 sm:py-10 lg:py-12`;

export const SHELL = {
  maxWidthClass: "max-w-6xl",
  contentMaxClass: "max-w-xl",
  headerH: "h-[var(--header-h)]",
  footerH: "h-[var(--footer-h)]",
  /** 內容區避開固定 header（與 footer 同一條左右軌道） */
  padHeader: "pt-[var(--header-h)]",
  /** 內容區避開固定 footer */
  padFooter: "pb-[var(--footer-h)]",
} as const;
