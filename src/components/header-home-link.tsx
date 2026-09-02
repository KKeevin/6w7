"use client";

import Link from "next/link";
import { BrandDomainMark } from "@/components/brand-logo";
import { triggerHomeLogoSplash } from "@/components/brand-splash";
import { useT } from "@/components/i18n-provider";

export function HeaderHomeLink() {
  const t = useT();

  return (
    <Link
      href="/"
      className="chrome-scale-start group flex min-w-0 items-end justify-self-start"
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
      <BrandDomainMark height={28} priority />
    </Link>
  );
}
