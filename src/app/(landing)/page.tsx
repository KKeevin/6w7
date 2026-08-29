import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { BrandLogo } from "@/components/brand-logo";
import { HomeAuthPanel } from "@/components/home-auth-panel";
import { BRAND } from "@/shared/tools";

const SITE = `https://${BRAND.domain}`;

export const metadata: Metadata = {
  title: {
    absolute: BRAND.titleHome,
  },
  description: BRAND.seoDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: `${BRAND.en}（${BRAND.zh}）`,
    locale: "zh_TW",
    url: "/",
    title: BRAND.titleHome,
    description: BRAND.seoDescription,
    images: [
      {
        url: BRAND.logoSrc,
        width: 920,
        height: 360,
        alt: `${BRAND.en}（${BRAND.zh}）`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.titleHome,
    description: BRAND.seoDescription,
    images: [BRAND.logoSrc],
  },
};

/** 讓 Google 認得站名與品牌別名（6w7／樂玩ㄑ），不要每次自己拼一個 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: `${BRAND.en}（${BRAND.zh}）`,
      alternateName: [BRAND.en, BRAND.zh],
      url: SITE,
      logo: `${SITE}${BRAND.logoSrc}`,
      email: BRAND.contactEmail,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: `${BRAND.en}（${BRAND.zh}）`,
      url: SITE,
      inLanguage: "zh-Hant-TW",
      description: BRAND.seoDescription,
      publisher: { "@id": `${SITE}/#organization` },
    },
  ],
};

export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer.kind === "user" || viewer.kind === "demo") {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* 左側品牌區 */}
      <section className="relative flex shrink-0 flex-col justify-center px-6 pb-5 pt-10 sm:px-10 sm:pb-6 sm:pt-12 lg:w-[56%] lg:flex-none lg:px-12 lg:py-6 xl:px-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_20%,rgba(49,151,229,0.18),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_80%,rgba(255,90,60,0.12),transparent_50%)]" />

        <div className="relative z-10 mx-auto w-full max-w-md text-center lg:mx-0 lg:max-w-xl lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <BrandLogo height={40} priority className="lg:hidden" />
            <BrandLogo height={64} priority className="hidden lg:block" />
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold leading-tight tracking-tight text-[var(--ink)] sm:text-3xl lg:mt-8 lg:text-5xl lg:leading-[1.12] [@media(max-height:740px)]:lg:mt-4 [@media(max-height:740px)]:lg:text-3xl">
            用連結收下
            <span className="text-[#3197e5]">匿名訊息</span>
            。
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)] sm:text-base lg:mx-0 lg:mt-4 lg:max-w-lg lg:text-lg [@media(max-height:740px)]:lg:mt-2 [@media(max-height:740px)]:lg:text-sm">
            {BRAND.tagline}
          </p>
        </div>
      </section>

      {/* 右側登入／註冊 */}
      <section className="flex flex-1 items-start justify-center px-4 pt-4 pb-8 sm:px-8 sm:pt-5 lg:w-[44%] lg:flex-none lg:items-center lg:bg-white lg:px-10 lg:py-6 lg:shadow-[-12px_0_32px_rgba(20,33,43,0.04)]">
        <div className="w-full max-w-[380px] rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7 lg:border-0 lg:p-0 lg:shadow-none">
          <Suspense
            fallback={<p className="text-sm text-[var(--muted)]">載入中…</p>}
          >
            <HomeAuthPanel />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
