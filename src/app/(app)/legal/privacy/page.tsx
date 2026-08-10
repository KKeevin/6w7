import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隱私權政策",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        隱私權政策
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">最後更新：2026-08-11 · 簡版</p>
      <div className="mt-8 space-y-6 text-[var(--muted)] leading-relaxed">
        <p>
          6w7（樂玩ㄑ）採最小蒐集原則。我們只蒐集提供服務所需的資料，例如帳號 Email、你建立的連結設定，以及訪客留言內容。
        </p>
        <p>
          匿名留言對連結主人顯示時不會附上訪客身分。為了限流、防濫用與檢舉，伺服器可能保存經雜湊處理的技術指紋（例如 IP／裝置相關雜湊），不會把明文 IP 當作展示用個資。
        </p>
        <p>
          我們不會把金鑰或密鑰放進前端。若你要求刪除帳號，我們會依流程刪除或匿名化你的連結與相關留言。
        </p>
        <p>
          部分公開頁面可能顯示由第三方廣告網路（例如 Google AdSense）提供的廣告。廣告夥伴可能使用 Cookie
          或類似技術提供相關廣告；你可透過瀏覽器設定或廣告網路提供的退出方式管理偏好。
        </p>
        <p>
          本頁為第一版簡述，之後會依實際營運補充保留期限與聯絡方式。
        </p>
      </div>
    </main>
  );
}
