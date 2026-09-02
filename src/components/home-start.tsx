import { Suspense, type ReactNode } from "react";
import { HomeAuthPanel } from "@/components/home-auth-panel";
import { HomeSixSevenPair } from "@/components/home-preview-stage";
import { HomeStartScroll } from "@/components/home-start-scroll";
import { HomeViewportSection } from "@/components/home-viewport-fill";
import type { Translator } from "@/shared/i18n";

type Props = {
  t: Translator;
};

function StartCopy({ t }: { t: Translator }) {
  return (
    <>
      <HomeSixSevenPair className="home-start-pair" />
      <h2
        id="start-title"
        className="mt-2.5 max-w-md text-balance font-[family-name:var(--font-display)] text-[1.7rem] font-extrabold tracking-tight sm:mt-5 sm:text-4xl"
      >
        {t("home.startTitle")}
      </h2>
      <p className="mt-2 max-w-md text-pretty text-sm text-[var(--muted)] sm:mt-3 sm:text-base">
        {t("home.startLead")}
      </p>
    </>
  );
}

function StartPanel({ fallback }: { fallback: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_20px_50px_rgba(20,33,43,0.12)]">
      <div className="h-1.5 bg-gradient-to-r from-[var(--mint)] to-[var(--accent)]" />
      <div className="p-5 sm:p-7">
        <Suspense fallback={fallback}>
          <HomeAuthPanel embedded />
        </Suspense>
      </div>
    </div>
  );
}

/** 首頁註冊區：手機同樣填滿頂欄與頁尾之間的可視區 */
export function HomeStart({ t }: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <HomeStartScroll />
      </Suspense>
      <HomeViewportSection
        id="start"
        labelledBy="start-title"
        fillDesktop
        fillWidth
        className="scroll-mb-[var(--footer-h)]"
        innerClassName="lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-10"
        copy={<StartCopy t={t} />}
        panel={
          <StartPanel
            fallback={
              <p className="text-sm text-[var(--muted)]">{t("common.loading")}</p>
            }
          />
        }
      />
    </>
  );
}
