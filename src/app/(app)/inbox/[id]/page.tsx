import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import {
  DEMO_MESSAGES,
  DEMO_PROFILE,
  getDemoMessage,
  demoMessagePath,
} from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";
import { SHELL_CONTENT } from "@/shared/shell";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return DEMO_MESSAGES.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const message = getDemoMessage(id);
  if (!message) return { title: "問答" };
  return {
    title: message.title,
    description: message.body.slice(0, 120),
  };
}

export default async function InboxMessagePage({ params }: Props) {
  const { id } = await params;
  const message = getDemoMessage(id);
  if (!message) notFound();

  const index = DEMO_MESSAGES.findIndex((m) => m.id === id);
  const prev = index > 0 ? DEMO_MESSAGES[index - 1] : undefined;
  const next =
    index >= 0 && index < DEMO_MESSAGES.length - 1
      ? DEMO_MESSAGES[index + 1]
      : undefined;

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10">
      <AdRailLayout width="narrow">
        <article className={`${SHELL_CONTENT} w-full`}>
          <p className="text-sm text-[var(--muted)]">
            <Link href="/inbox" className="font-semibold hover:underline">
              ← 收件匣
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
              {message.topic}
            </span>
            {message.isFeatured ? (
              <span className="inline-flex rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                精選
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight lg:text-3xl">
            {message.title}
          </h1>
          <time
            className="mt-2 block text-xs text-[var(--muted)]"
            dateTime={message.createdAt}
          >
            示範留言 · {new Date(message.createdAt).toLocaleString("zh-TW")} · @
            {DEMO_PROFILE.username}
          </time>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-[var(--ink)] lg:text-lg">
            {message.body}
          </p>

          <section className="mt-10 space-y-3 border-t border-[var(--line)] pt-8 text-sm leading-relaxed text-[var(--muted)]">
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
              這則問答在 {BRAND.en} 裡怎麼運作
            </h2>
            <p>
              訪客在公開頁選主題「{message.topic}
              」後送出，文字只進主人收件匣。示範帳號把範例全文公開，方便還沒註冊的人與搜尋引擎閱讀；真實使用者的留言預設不會這樣公開。
            </p>
            <p>
              想看其他主題，回到{" "}
              <Link href="/inbox" className="underline hover:text-[var(--ink)]">
                收件匣
              </Link>
              ，或去{" "}
              <Link
                href={DEMO_PROFILE.publicPath}
                className="underline hover:text-[var(--ink)]"
              >
                公開留言頁
              </Link>
              。
            </p>
          </section>

          <nav
            className="mt-8 flex flex-col gap-2 text-sm sm:flex-row sm:justify-between"
            aria-label="相鄰問答"
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
