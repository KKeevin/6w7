import type { Metadata } from "next";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { BrandLogo } from "@/components/brand-logo";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";

export const metadata: Metadata = {
  title: "聯絡我們",
  description: `如何聯絡 ${BRAND.en}（${BRAND.zh}）：帳號協助、刪除資料、檢舉濫用與合作來信。`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const mailto = `mailto:${BRAND.contactEmail}`;

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article
          className={`${SHELL_CONTENT} w-full space-y-5 text-[var(--muted)] leading-relaxed`}
        >
          <BrandLogo height={36} />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
            聯絡我們
          </h1>
          <p>
            {BRAND.en}（{BRAND.zh}
            ）是匿名留言連結服務。這頁給需要找平台的人用：帳號、隱私、檢舉或合作。想留給某個使用者的匿名話，請走對方的短網址，不要寄到這裡。
          </p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            怎麼寫信
          </h2>
          <p>
            請來信{" "}
            <a href={mailto} className="font-semibold text-[var(--ink)] underline">
              {BRAND.contactEmail}
            </a>
            。主旨請寫清楚類型，例如「帳號協助」「刪除資料」「檢舉濫用」或「合作」。我們會依來信內容處理，不會把你的信公開到任何留言牆上。
          </p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            我們處理什麼
          </h2>
          <p>
            帳號登入問題、停用或刪除帳號、隱私權相關請求、違法或傷害他人內容的檢舉，以及媒體／合作詢問。涉及未成年人或不當內容的檢舉會優先看。
          </p>
          <p>
            請不要請我們點擊網站上的廣告，也不要鼓勵別人去點。廣告相關成效請用你自己的分析工具查看；點擊自己的廣告違反{" "}
            <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
              服務條款
            </Link>
            與 AdSense 政策。
          </p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            其他入口
          </h2>
          <p>
            想了解產品怎麼運作，請看{" "}
            <Link href="/about" className="underline hover:text-[var(--ink)]">
              關於 {BRAND.en}
            </Link>
            。資料怎麼蒐集見{" "}
            <Link href="/legal/privacy" className="underline hover:text-[var(--ink)]">
              隱私權政策
            </Link>
            。
          </p>
        </article>
      </AdRailLayout>
    </main>
  );
}
