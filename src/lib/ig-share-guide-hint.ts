/** 分享頁「限動教學」新手提示（本機，非密鑰） */

const userKey = (userId: string) => `6w7.hideIgShareGuideHint.${userId}`;
const DEMO_SESSION_KEY = "6w7.hideIgShareGuideHint.demoSession";

export function isIgShareGuideHintHidden(
  userId: string,
  opts?: { demo?: boolean },
): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (opts?.demo) {
      return window.sessionStorage.getItem(DEMO_SESSION_KEY) === "1";
    }
    return window.localStorage.getItem(userKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function hideIgShareGuideHint(
  userId: string,
  opts?: { demo?: boolean },
) {
  try {
    if (opts?.demo) {
      window.sessionStorage.setItem(DEMO_SESSION_KEY, "1");
      return;
    }
    window.localStorage.setItem(userKey(userId), "1");
  } catch {
    /* private mode／禁用儲存 */
  }
}

/** 示範帳號每次登入再顯示一次 */
export function resetDemoIgShareGuideHint() {
  try {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* private mode／禁用儲存 */
  }
}
