import type { Metadata } from "next";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";

export const metadata: Metadata = {
  title: "隱私權政策",
};

export default function PrivacyPage() {
  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article className={`${SHELL_CONTENT} w-full`}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            隱私權政策
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            最後更新：2026-08-14 · 簡版
          </p>
          <div className="mt-8 space-y-6 text-[var(--muted)] leading-relaxed">
            <p>
              6w7（樂玩ㄑ）採最小蒐集原則。我們只蒐集提供服務所需的資料，例如帳號
              Email、你建立的連結設定，以及訪客留言內容。
            </p>
            <p>
              匿名留言對連結主人顯示時不會附上訪客身分。為了限流、防濫用與檢舉，伺服器可能保存經雜湊處理的技術指紋（例如
              IP／裝置相關雜湊），不會把明文 IP 當作展示用個資。
            </p>
            <p>
              我們不會把金鑰或密鑰放進前端。若你要求刪除帳號，我們會依流程刪除或匿名化你的連結與相關留言。
            </p>
            <p>
              部分有原創說明文字的頁面可能顯示由第三方廣告網路（例如 Google
              AdSense）提供的廣告，包括關於我們、聯絡我們、隱私權政策、服務條款、公開留言頁、示範帳號，以及登入後附說明的短網址與收件匣。登入、註冊、帳號設定與錯誤頁不會放送廣告。廣告夥伴可能使用
              Cookie
              或類似技術提供相關廣告；你可透過瀏覽器設定或廣告網路提供的退出方式管理偏好。
            </p>
            <p>
              帳號刪除、隱私權請求或檢舉，請來信{" "}
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="underline hover:text-[var(--ink)]"
              >
                {BRAND.contactEmail}
              </a>
              ，或到{" "}
              <Link href="/contact" className="underline hover:text-[var(--ink)]">
                聯絡我們
              </Link>
              。本頁為第一版簡述，之後會依實際營運補充保留期限。
            </p>
          </div>
        </article>
      </AdRailLayout>
    </main>
  );
}
