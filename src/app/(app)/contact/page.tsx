import type { Metadata } from "next";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { BrandLogo } from "@/components/brand-logo";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("contact.title"),
    description: t("contact.metaDesc", { brand: BRAND.en, zh: BRAND.zh }),
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const t = await getT();
  const mailto = `mailto:${BRAND.contactEmail}`;

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article
          className={`${SHELL_CONTENT} w-full space-y-5 text-[var(--muted)] leading-relaxed`}
        >
          <BrandLogo height={36} />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
            {t("contact.title")}
          </h1>
          <p>{t("contact.intro", { brand: BRAND.en, zh: BRAND.zh })}</p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("contact.howTitle")}
          </h2>
          <p>
            <a href={mailto} className="font-semibold text-[var(--ink)] underline">
              {BRAND.contactEmail}
            </a>
            <span className="block sm:inline sm:before:content-['._']">
              {t("contact.howBody", { email: BRAND.contactEmail })}
            </span>
          </p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("contact.handleTitle")}
          </h2>
          <p>{t("contact.handle1")}</p>
          <p>
            {t("contact.handle2a")}{" "}
            <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
              {t("footer.terms")}
            </Link>{" "}
            {t("contact.handle2b")}
          </p>

          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("contact.otherTitle")}
          </h2>
          <p>
            {t("contact.other1a")}{" "}
            <Link href="/about" className="underline hover:text-[var(--ink)]">
              {t("contact.aboutBrand", { brand: BRAND.en })}
            </Link>
            {t("contact.other1b")}{" "}
            <Link href="/legal/privacy" className="underline hover:text-[var(--ink)]">
              {t("footer.privacy")}
            </Link>
            {t("contact.other1c")}
          </p>
        </article>
      </AdRailLayout>
    </main>
  );
}
