import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import {
  DEMO_PROFILE,
  getDemoMessage,
  getLocalizedDemoMessages,
  demoMessagePath,
} from "@/shared/demo-account";
import { getViewer } from "@/lib/viewer";
import { getRequestLocale, getT } from "@/lib/locale";
import { DATE_BCP47 } from "@/shared/i18n";
import { loginPath } from "@/shared/paths";
import { BRAND } from "@/shared/tools";
import { SHELL_CONTENT } from "@/shared/shell";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const viewer = await getViewer();
  const t = await getT();
  if (viewer.kind === "guest") return { title: t("inbox.loginTitle") };
  const { id } = await params;
  const locale = await getRequestLocale();
  const message = getDemoMessage(id, locale);
  if (!message) return { title: t("inbox.qaTitle") };
  return {
    title: message.title,
    description: message.body.slice(0, 120),
  };
}

export default async function InboxMessagePage({ params }: Props) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath(`/inbox/${id}`));
  }
  if (viewer.kind === "user") {
    redirect("/inbox");
  }
  const t = await getT();
  const locale = await getRequestLocale();
  const message = getDemoMessage(id, locale);
  if (!message) notFound();

  const messages = getLocalizedDemoMessages(locale);
  const index = messages.findIndex((m) => m.id === id);
  const prev = index > 0 ? messages[index - 1] : undefined;
  const next =
    index >= 0 && index < messages.length - 1
      ? messages[index + 1]
      : undefined;

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10">
      <AdRailLayout width="narrow">
        <article className={`${SHELL_CONTENT} w-full`}>
          <p className="text-sm text-[var(--muted)]">
            <Link href="/inbox" className="font-semibold hover:underline">
              {t("inbox.back")}
            </Link>
          </p>
          {message.isFeatured ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                {t("inbox.featured")}
              </span>
            </div>
          ) : null}
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight lg:text-3xl">
            {message.title}
          </h1>
          <time
            className="mt-2 block text-xs text-[var(--muted)]"
            dateTime={message.createdAt}
          >
            {t("inbox.demoNote", {
              when: new Date(message.createdAt).toLocaleString(DATE_BCP47[locale]),
              username: DEMO_PROFILE.username,
            })}
          </time>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[var(--ink)] lg:text-lg">
            {message.body}
          </p>

          <section className="mt-10 space-y-3 border-t border-[var(--line)] pt-8 text-sm leading-relaxed text-[var(--muted)]">
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
              {t("inbox.howTitle", { brand: BRAND.en })}
            </h2>
            <p>
              {t("inbox.howBody")}
            </p>
            <p>
              {t("inbox.otherTopicsA")}{" "}
              <Link href="/inbox" className="underline hover:text-[var(--ink)]">
                {t("inbox.title")}
              </Link>
              {t("inbox.otherTopicsB")}{" "}
              <Link
                href={DEMO_PROFILE.publicPath}
                className="underline hover:text-[var(--ink)]"
              >
                {t("inbox.publicPage")}
              </Link>
              。
            </p>
          </section>

          <nav
            className="mt-8 flex flex-col gap-2 text-sm sm:flex-row sm:justify-between"
            aria-label={t("inbox.adjacentAria")}
          >
            {prev ? (
              <Link
                href={demoMessagePath(prev.id)}
                className="font-semibold text-[var(--mint)] hover:underline"
              >
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={demoMessagePath(next.id)}
                className="font-semibold text-[var(--mint)] hover:underline sm:text-right"
              >
                {next.title} →
              </Link>
            ) : null}
          </nav>
        </article>
      </AdRailLayout>
    </main>
  );
}
