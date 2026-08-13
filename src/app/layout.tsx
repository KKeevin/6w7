import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { BRAND } from "@/shared/tools";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      {/* suppressHydrationWarning：避免密碼管理等擴充注入 bis_register 等屬性觸發 hydration 警告 */}
      <body
        className="flex min-h-dvh flex-col antialiased"
        suppressHydrationWarning
      >
        <AdSenseScript />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
