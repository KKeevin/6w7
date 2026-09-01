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
    title: t("about.metaTitle", { brand: BRAND.en }),
    description: t("about.metaDesc", { brand: BRAND.en, zh: BRAND.zh }),
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const t = await getT();
  const brandVars = { brand: BRAND.en, zh: BRAND.zh, domain: BRAND.domain };

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article
          className={`${SHELL_CONTENT} w-full space-y-5 text-[var(--muted)] leading-relaxed`}
        >
          <BrandLogo height={36} />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
            {t("about.title", brandVars)}
          </h1>
          <p>{t("about.p1", brandVars)}</p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("about.originTitle")}
          </h2>
          <p>{t("about.origin1")}</p>
          <p>{t("about.origin2")}</p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("about.startTitle")}
          </h2>
          <p>{t("about.start1")}</p>
          <p>{t("about.start2")}</p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("about.anonTitle")}
          </h2>
          <p>{t("about.anon1")}</p>
          <p>{t("about.anon2")}</p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("about.demoTitle")}
          </h2>
          <p>
            {t("about.demo1a")}{" "}
            <Link href="/login" className="underline hover:text-[var(--ink)]">
              {t("about.loginPage")}
            </Link>{" "}
            {t("about.demo1b")}{" "}
            <Link href="/lewanq" className="underline hover:text-[var(--ink)]">
              6w7.link/lewanq
            </Link>{" "}
            {t("about.demo1c")}
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            {t("about.dataTitle")}
          </h2>
          <p>
            {t("about.data1a")}{" "}
            <Link href="/legal/privacy" className="underline hover:text-[var(--ink)]">
              {t("footer.privacy")}
            </Link>
            {t("about.data1b")}{" "}
            <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
              {t("footer.terms")}
            </Link>{" "}
            {t("about.data1c")}{" "}
            <Link href="/contact" className="underline hover:text-[var(--ink)]">
              {t("footer.contact")}
            </Link>
            。
          </p>
          <p>{t("about.data2")}</p>
          <p>
            {t("about.data3a")}{" "}
            <a
              href={`https://${BRAND.domain}`}
              className="underline hover:text-[var(--ink)]"
            >
              {BRAND.domain}
            </a>
            {t("about.data3b")}{" "}
            <Link href="/" className="underline hover:text-[var(--ink)]">
              {t("about.home")}
            </Link>{" "}
            {t("about.data3c")}
          </p>
        </article>
      </AdRailLayout>
    </main>
  );
}
