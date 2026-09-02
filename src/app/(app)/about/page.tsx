import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { BrandLogo } from "@/components/brand-logo";
import { CopyContactEmail } from "@/components/copy-contact-email";
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

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ink)]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const t = await getT();
  const brandVars = { brand: BRAND.en, zh: BRAND.zh, domain: BRAND.domain };

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article
          className={`${SHELL_CONTENT} w-full space-y-8 text-[var(--muted)] leading-relaxed`}
        >
          <header className="space-y-4">
            <BrandLogo height={36} />
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)]">
              {t("about.title", brandVars)}
            </h1>
            <p>{t("about.p1", brandVars)}</p>
          </header>

          <Section title={t("about.originTitle")}>
            <p>{t("about.origin1")}</p>
            <p>{t("about.origin2")}</p>
          </Section>

          <Section title={t("about.startTitle")}>
            <p>{t("about.start1")}</p>
            <p>{t("about.start2")}</p>
          </Section>

          <Section title={t("about.anonTitle")}>
            <p>{t("about.anon1")}</p>
            <p>{t("about.anon2")}</p>
          </Section>

          <Section title={t("about.demoTitle")}>
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
          </Section>

          <Section title={t("about.dataTitle")}>
            <p>
              {t("about.data1a")}{" "}
              <Link
                href="/legal/privacy"
                className="underline hover:text-[var(--ink)]"
              >
                {t("footer.privacy")}
              </Link>
              {t("about.data1b")}{" "}
              <Link
                href="/legal/terms"
                className="underline hover:text-[var(--ink)]"
              >
                {t("footer.terms")}
              </Link>{" "}
              {t("about.data1c")}{" "}
              <a href="#contact" className="underline hover:text-[var(--ink)]">
                {t("footer.contact")}
              </a>
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
          </Section>

          <section
            id="contact"
            className="scroll-mt-[calc(var(--header-h)+0.75rem)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(20,33,43,0.08)]"
          >
            <div className="h-1.5 bg-gradient-to-r from-[var(--mint)] to-[var(--accent)]" />
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--mint)]">
                {BRAND.en.toUpperCase()}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--ink)]">
                {t("contact.title")}
              </h2>
              <p className="mt-2">{t("contact.intro")}</p>

              <CopyContactEmail />

              <p className="mt-3 text-sm">{t("contact.howBody")}</p>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
                {t("contact.handleTitle")}
              </h3>
              <p className="mt-2">{t("contact.handle1")}</p>
              <p className="mt-3 text-sm">
                {t("contact.handle2a")}{" "}
                <Link
                  href="/legal/terms"
                  className="underline hover:text-[var(--ink)]"
                >
                  {t("footer.terms")}
                </Link>{" "}
                {t("contact.handle2b")}
              </p>
            </div>
          </section>
        </article>
      </AdRailLayout>
    </main>
  );
}
