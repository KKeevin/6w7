import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { BrandLogo } from "@/components/brand-logo";
import { PublicAskForm } from "@/components/public-ask-form";
import { PublicAskExplainer } from "@/components/public-ask-explainer";
import { getPublicAskLink } from "@/services/ask-link.service";
import { ensureDemoAccountIfMissing } from "@/services/demo-account.service";
import { AppError } from "@/shared/errors";
import { isValidSlugFormat, isReservedSlug } from "@/shared/slug";
import { isDemoUsername } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isDemoUsername(slug)) {
    try {
      await ensureDemoAccountIfMissing();
    } catch {
      /* 建立示範帳號失敗時仍走一般查詢 */
    }
  }
  if (isReservedSlug(slug) || !isValidSlugFormat(slug)) {
    return { title: "匿名留言" };
  }
  try {
    const link = await getPublicAskLink(slug);
    return {
      title: `@${link.slug}`,
      description: link.prompt,
    };
  } catch {
    return { title: "匿名留言" };
  }
}

export default async function PublicAskPage({ params }: Props) {
  const { slug } = await params;

  if (isDemoUsername(slug)) {
    await ensureDemoAccountIfMissing();
  }

  if (isReservedSlug(slug) || !isValidSlugFormat(slug)) {
    notFound();
  }

  let link;
  try {
    link = await getPublicAskLink(slug);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  return (
    <AdRailLayout width="narrow">
      <div className="bg-atmosphere flex w-full flex-1 flex-col rounded-3xl">
        <div className="flex min-h-[calc(100dvh-var(--footer-h))] flex-col px-4 py-8 sm:px-6 sm:py-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandLogo height={26} priority />
            <span className="text-sm font-medium text-[var(--muted)]">
              {BRAND.zh}
            </span>
          </Link>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--line)] bg-[var(--surface)]">
              {link.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={link.image}
                  alt=""
                  width={96}
                  height={96}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--muted)]">
                  {(link.displayName || link.slug).slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">@{link.slug}</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight">
              {link.prompt}
            </h1>
          </div>

          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            採完全匿名提問，請放心問答！
          </p>

          <PublicAskForm link={link} />
        </div>
        <div className="px-4 pb-8 sm:px-6 sm:pb-10">
          <PublicAskExplainer />
        </div>
      </div>
    </AdRailLayout>
  );
}
