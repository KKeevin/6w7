/** 系統預設的 AskLink 標題；展示時依介面語言翻譯，不當作使用者自訂文案。 */
export const DEFAULT_ASK_TITLE = "匿名問我";

export function displayAskTitle(
  stored: string | null | undefined,
  localized: string,
) {
  if (!stored || stored === DEFAULT_ASK_TITLE) return localized;
  return stored;
}
