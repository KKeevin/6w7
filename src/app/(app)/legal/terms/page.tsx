import type { Metadata } from "next";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("terms.title"),
    description: t("terms.metaDesc", { brand: BRAND.en, zh: BRAND.zh }),
    alternates: { canonical: "/legal/terms" },
  };
}

export default async function TermsPage() {
  const t = await getT();
  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article className={`${SHELL_CONTENT} w-full`}>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {t("terms.title")}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{t("terms.updated")}</p>
          <div className="mt-8 space-y-6 text-[var(--muted)] leading-relaxed">
            <p>{t("terms.p1")}</p>
            <p>{t("terms.p2")}</p>
            <p>{t("terms.p3")}</p>
            <p>{t("terms.p4")}</p>
          </div>
        </article>
      </AdRailLayout>
    </main>
  );
}
