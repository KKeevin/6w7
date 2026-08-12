/** 此裝置是否曾成功註冊／登入過（僅本機提示用，非安全依據） */
const STORAGE_KEY = "6w7.deviceHasAccount";

export function markDeviceHasAccount() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode／禁用儲存 */
  }
}

/** null = 讀不到（SSR／禁用）；true／false = 有／無紀錄 */
export function readDeviceHasAccount(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return null;
  }
}

/**
 * 決定預設表單模式：
 * URL ?mode= 優先 → 再看本機是否用過 → 最後才用頁面 defaultMode
 */
export function resolveAuthMode(options: {
  modeParam: string | null;
  defaultMode: "login" | "register";
}): "login" | "register" {
  if (options.modeParam === "login" || options.modeParam === "register") {
    return options.modeParam;
  }
  const hasAccount = readDeviceHasAccount();
  if (hasAccount === true) return "login";
  if (hasAccount === false) return "register";
  return options.defaultMode;
}
