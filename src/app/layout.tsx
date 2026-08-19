import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND } from "@/shared/tools";
import "./globals.css";

/** 台灣流量為主，Neon 在 Singapore；預設 iad1 會拉長 TTFB */
export const preferredRegion = "sin1";

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

export const metadata: Metadata = {
  title: {
    default: `${BRAND.en}（${BRAND.zh}）`,
    template: `%s · ${BRAND.en}`,
  },
  description: BRAND.tagline,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${display.variable} ${body.variable} min-h-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://cdn.6w7.link" />
        <link rel="dns-prefetch" href="https://cdn.6w7.link" />
      </head>
      {/* suppressHydrationWarning：避免密碼管理等擴充注入 bis_register 等屬性觸發 hydration 警告 */}
      <body
        className="flex min-h-dvh flex-col antialiased"
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
