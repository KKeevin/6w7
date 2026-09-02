import Image from "next/image";
import Link from "next/link";
import { HomeDemoCta } from "@/components/home-demo-cta";
import { HomeDressShot } from "@/components/home-dress-shot";
import { HomeHero } from "@/components/home-hero";
import { HomeReplyShot } from "@/components/home-reply-shot";
import { HomeShareShot } from "@/components/home-share-shot";
import { HomeStart } from "@/components/home-start";
import { HomeScrollMagnet } from "@/components/home-scroll-magnet";
import { HomePreviewStage } from "@/components/home-preview-stage";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { SHELL_X } from "@/shared/shell";
import { BRAND } from "@/shared/tools";
import { HomeAskShot } from "@/components/home-ask-shot";
import { HomeInboxShot } from "@/components/home-inbox-shot";
import { HomeRegisterShot } from "@/components/home-register-shot";
import type { Locale, Translator } from "@/shared/i18n";

type Props = {
  signedIn: boolean;
  t: Translator;
  locale: Locale;
};

export function HomeLanding({ signedIn, t, locale }: Props) {
  const steps = [
    {
      n: "01",
      title: t("home.how1Title"),
      body: t("home.how1Body", { username: "your.ig.id" }),
      visual: <HomeRegisterShot />,
    },
    {
      n: "02",
      title: t("home.how2Title"),
      body: t("home.how2Body"),
      visual: <HomeDressShot />,
    },
    {
      n: "03",
      title: t("home.how3Title"),
      body: t("home.how3Body"),
      visual: <HomeShareShot />,
    },
    {
      n: "04",
      title: t("home.how4Title"),
      body: t("home.how4Body"),
      visual: <HomeAskShot />,
    },
    {
      n: "05",
      title: t("home.how5Title"),
      body: t("home.how5Body"),
      visual: <HomeInboxShot />,
    },
    {
      n: "06",
      title: t("home.how6Title"),
      body: t("home.how6Body"),
      visual: <HomeReplyShot />,
    },
  ];
  const feats = [
    { title: t("home.feat3Title"), body: t("home.feat3Body") },
    { title: t("home.feat1Title"), body: t("home.feat1Body") },
    { title: t("home.feat2Title"), body: t("home.feat2Body") },
  ];

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col">
      <HomeScrollMagnet />
      <HomeHero
        copy={
          <>
            <p className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-[var(--mint)]">
              {BRAND.domain}
            </p>
            <div
              className={cn(
                "mt-2.5 sm:mt-5",
                locale === "en" ? "max-w-xl overflow-x-clip" : null,
              )}
            >
              <h1
                className={cn(
                  "font-[family-name:var(--font-display)] text-[1.9rem] font-extrabold leading-[1.08] tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[3.4rem]",
                  locale === "en"
                    ? "home-hero-title-condensed"
                    : "max-w-xl text-balance",
                )}
              >
                {t("home.heroBefore")}
                <span className="text-[var(--mint)]">{t("home.heroAccent")}</span>
                {t("home.heroAfter")}
              </h1>
            </div>
            <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-[var(--muted)] sm:mt-4 sm:text-lg">
              {t("meta.tagline")}
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {signedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-11 w-full px-8 text-base sm:h-12 sm:w-auto",
                    )}
                  >
                    {t("home.goDashboard")}
                  </Link>
                  <Link
                    href="/inbox"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-11 w-full px-8 text-base sm:h-12 sm:w-auto",
                    )}
                  >
                    {t("home.goInbox")}
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href="#start"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "animate-accepting-hint h-11 w-full px-8 text-base shadow-[0_10px_28px_rgba(255,90,60,0.28)] sm:h-12 sm:w-auto",
                    )}
                  >
                    {t("home.registerOwn")}
                  </a>
                  <HomeDemoCta className="h-11 sm:h-12" />
                </>
              )}
            </div>
            {signedIn ? null : (
              <p className="mt-2 max-w-sm text-pretty text-[12px] leading-relaxed text-[var(--muted)] sm:mt-3 sm:text-[13px]">
                {t("home.tryHint")}
              </p>
            )}
          </>
        }
        preview={<HomePreviewStage />}
      />

      <section
        id="how"
        className="overflow-x-hidden border-y border-[var(--line)] bg-white"
        aria-labelledby="how-title"
      >
        <div className={`${SHELL_X} py-14 sm:py-16`}>
          <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--accent)]">
            {t("home.howRange")}
          </p>
          <h2
            id="how-title"
            className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            {t("home.howTitle")}
          </h2>
          <ol className="mt-10 space-y-10">
            {steps.map((step, index) => (
              <li
                key={step.n}
                data-home-step={step.n}
                className={cn(
                  "grid min-w-0 items-center gap-6 border-t border-[var(--line)] pt-10 first:border-t-0 first:pt-0 sm:grid-cols-2 sm:gap-10",
                  index % 2 === 1 && "sm:[&>*:first-child]:order-2",
                )}
              >
                <div>
                  <span className="font-[family-name:var(--font-display)] text-5xl font-extrabold leading-none text-[var(--mint)]/25">
                    {step.n}
                  </span>
                  <h3 className="-mt-2 text-xl font-bold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                    {step.body}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex min-w-0 max-w-full overflow-x-hidden transition-transform duration-200 hover:-translate-y-1",
                    index % 2 === 1
                      ? "justify-center sm:justify-start"
                      : "justify-center sm:justify-end",
                  )}
                >
                  {step.visual}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="feat"
        className="bg-[var(--ink)] text-[var(--accent-fg)]"
        aria-labelledby="feat-title"
      >
        <div className={`${SHELL_X} relative overflow-visible py-14 sm:py-16`}>
          <div className="pr-24 sm:pr-32 lg:max-w-3xl lg:pr-0">
            <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--mint)]">
              {BRAND.en}
            </p>
            <h2
              id="feat-title"
              className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
            >
              {t("home.featTitle")}
            </h2>
          </div>
          <div className="pointer-events-none absolute top-[4.75rem] right-4 z-10 sm:right-6 lg:top-0 lg:right-6">
            <Image
              src={BRAND.inboxEmptySrc}
              alt=""
              width={180}
              height={140}
              className="home-float h-auto w-32 opacity-90 sm:w-36 lg:w-48"
            />
          </div>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {feats.map((feat) => (
              <li
                key={feat.title}
                className="bg-[var(--ink)] p-5 transition-colors duration-200 hover:bg-[#1b2c38] sm:p-6"
              >
                <h3 className="text-lg font-semibold text-white">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {feat.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {signedIn ? null : <HomeStart t={t} />}
    </div>
  );
}
