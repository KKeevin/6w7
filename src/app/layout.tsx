import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { MemeDrift } from "@/components/meme-drift";
import { I18nProvider } from "@/components/i18n-provider";
import { HomeLogoSplashHost } from "@/components/brand-splash";
import { getRequestLocale, getT } from "@/lib/locale";
import { BRAND } from "@/shared/tools";
import { HTML_LANG, OG_LOCALE } from "@/shared/i18n";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const locale = await getRequestLocale();
  return {
    title: {
      default: t("meta.productTitle"),
      template: `%s | ${t("meta.productTitle")}`,
    },
    description: t("meta.seoDescription"),
    applicationName: BRAND.en,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    ),
    openGraph: {
      type: "website",
      siteName: `${BRAND.en}（${BRAND.zh}）`,
      locale: OG_LOCALE[locale],
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${display.variable} ${body.variable} min-h-full max-w-full overflow-x-clip`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://cdn.6w7.link" />
        <link rel="dns-prefetch" href="https://cdn.6w7.link" />
      </head>
      {/* suppressHydrationWarning：避免密碼管理等擴充注入 bis_register 等屬性觸發 hydration 警告 */}
      <body
        className="flex min-h-dvh min-w-0 w-full flex-col antialiased"
        suppressHydrationWarning
      >
        <I18nProvider locale={locale}>
          {children}
          <HomeLogoSplashHost />
          <MemeDrift />
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
