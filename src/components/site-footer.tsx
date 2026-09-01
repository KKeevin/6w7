import Link from "next/link";
import { BRAND } from "@/shared/tools";
import { SHELL_X } from "@/shared/shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FooterCondensedText } from "@/components/footer-condensed-text";
import { getT } from "@/lib/locale";

/** 全站統一尺寸的固定 footer，避免換頁位移 */
export async function SiteFooter() {
  const t = await getT();
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 h-[var(--footer-h)] border-t border-[var(--line)]/70 bg-[var(--bg)]/90 shadow-[0_-8px_24px_rgba(20,33,43,0.06)] backdrop-blur-md">
      <div
        className={`${SHELL_X} grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4 text-xs text-[var(--muted)]`}
      >
        <p className="chrome-scale-start min-w-0 justify-self-start truncate">
          {t("footer.copy", {
            year: new Date().getFullYear(),
            domain: BRAND.domain,
          })}
        </p>
        <div className="chrome-scale-end col-start-3 flex shrink-0 flex-wrap items-center justify-end justify-self-end gap-2 sm:gap-4">
          <LanguageSwitcher />
          <Link href="/about" className="hover:text-[var(--ink)]">
            <FooterCondensedText>{t("footer.about")}</FooterCondensedText>
          </Link>
          <Link href="/contact" className="hover:text-[var(--ink)]">
            <FooterCondensedText>{t("footer.contact")}</FooterCondensedText>
          </Link>
          <Link href="/legal/privacy" className="hover:text-[var(--ink)]">
            <FooterCondensedText>{t("footer.privacy")}</FooterCondensedText>
          </Link>
          <Link href="/legal/terms" className="hover:text-[var(--ink)]">
            <FooterCondensedText>{t("footer.terms")}</FooterCondensedText>
          </Link>
        </div>
      </div>
    </footer>
  );
}
