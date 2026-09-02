import type { Metadata } from "next";
import { getViewer } from "@/lib/viewer";
import { HomeLanding } from "@/components/home-landing";
import { BRAND } from "@/shared/tools";
import { getRequestLocale, getT } from "@/lib/locale";
import { HTML_LANG, OG_LOCALE } from "@/shared/i18n";

const SITE = `https://${BRAND.domain}`;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getRequestLocale();
  return {
    title: {
      absolute: t("meta.productTitle"),
    },
    description: t("meta.seoDescription"),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: `${BRAND.en}（${BRAND.zh}）`,
      locale: OG_LOCALE[locale],
      url: "/",
      title: t("meta.productTitle"),
      description: t("meta.seoDescription"),
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
      title: t("meta.productTitle"),
      description: t("meta.seoDescription"),
      images: [BRAND.logoSrc],
    },
  };
}

/** 讓 Google 認得站名與品牌別名（6w7／樂玩ㄑ），不要每次自己拼一個 */
export default async function HomePage() {
  const viewer = await getViewer();
  const signedIn = viewer.kind === "user" || viewer.kind === "demo";
  const t = await getT();
  const locale = await getRequestLocale();
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
        inLanguage: HTML_LANG[locale],
        description: t("meta.seoDescription"),
        publisher: { "@id": `${SITE}/#organization` },
      },
    ],
  };

  return (
    <main className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeLanding signedIn={signedIn} t={t} locale={locale} />
    </main>
  );
}
