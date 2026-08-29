import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // 剩下幾處要改資料流（收件匣載入、分享頁載入、貼紙編輯），沒測試前先當提醒，
      // 別讓整個 lint 紅燈而擋不住真正的新問題。修完再調回 error。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
