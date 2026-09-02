"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { triggerHomeLogoSplash } from "@/components/brand-splash";
import { BRAND } from "@/shared/tools";
import { useT } from "@/components/i18n-provider";

export function HeaderHomeLink() {
  const t = useT();

  return (
    <Link
      href="/"
      className="chrome-scale-start group flex min-w-0 items-end gap-0 justify-self-start"
      aria-label={t("common.home")}
      onClick={(event) => {
        triggerHomeLogoSplash();
        if (window.location.pathname === "/") {
          event.preventDefault();
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, "", "/");
          }
        }
      }}
    >
      <BrandLogo height={28} priority className="shrink-0" />
      <span className="hidden overflow-visible pb-1 text-xs leading-none text-[var(--muted)] group-hover:text-[var(--ink)] sm:inline">
        {BRAND.zh}
      </span>
    </Link>
  );
}
