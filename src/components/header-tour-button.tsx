"use client";

import { usePathname, useRouter } from "next/navigation";
import { requestShareTour } from "@/lib/ig-share-guide-hint";
import { useT } from "@/components/i18n-provider";

/** 與頂欄使用者圖示同一套線條：羅盤＝再開導覽 */
function TourCompassIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.25 14.35 12 12 16.75 9.65 12Z" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HeaderTourButton() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();

  function start() {
    const onSharePage =
      pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    if (onSharePage) {
      requestShareTour();
      return;
    }
    router.push("/dashboard?tour=1");
  }

  return (
    <button
      type="button"
      onClick={start}
      title={t("nav.tour")}
      aria-label={t("nav.tour")}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--mint)] hover:text-[var(--ink)]"
    >
      <TourCompassIcon className="h-5 w-5" />
    </button>
  );
}
