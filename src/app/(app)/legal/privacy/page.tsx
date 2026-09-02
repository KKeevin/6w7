import type { Metadata } from "next";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("privacy.title"),
    description: t("privacy.metaDesc", { brand: BRAND.en, zh: BRAND.zh }),
    alternates: { canonical: "/legal/privacy" },
  };
}

export default async function PrivacyPage() {
  const t = await getT();
  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article className={`${SHELL_CONTENT} w-full`}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {t("privacy.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("privacy.updated")}</p>
          <div className="mt-8 space-y-6 text-[var(--muted)] leading-relaxed">
            <p>{t("privacy.p1", { email: BRAND.contactEmail })}</p>
            <p>{t("privacy.p2")}</p>
            <p>{t("privacy.p3")}</p>
            <p>{t("privacy.p4")}</p>
            <p>
              {t("privacy.p5a")}{" "}
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="underline hover:text-[var(--ink)]"
              >
                {BRAND.contactEmail}
              </a>
              {t("privacy.p5b")}{" "}
              <Link
                href="/about#contact"
                className="underline hover:text-[var(--ink)]"
              >
                {t("footer.contact")}
              </Link>
              {t("privacy.p5c")}
            </p>
          </div>
        </article>
      </AdRailLayout>
    </main>
  );
}
