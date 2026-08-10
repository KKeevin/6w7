import Link from "next/link";
import { BRAND } from "@/shared/tools";
import { SHELL_X } from "@/shared/shell";

/** 全站統一尺寸的固定 footer，避免換頁位移 */
export function SiteFooter() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 h-[var(--footer-h)] border-t border-[var(--line)]/70 bg-[var(--bg)]/90 shadow-[0_-8px_24px_rgba(20,33,43,0.06)] backdrop-blur-md">
      <div
        className={`${SHELL_X} flex h-full items-center justify-between gap-4 text-xs text-[var(--muted)]`}
      >
        <p className="min-w-0 truncate">
          © {new Date().getFullYear()} {BRAND.en}（{BRAND.zh}）· {BRAND.domain}
        </p>
        <div className="flex shrink-0 gap-4">
          <Link href="/legal/privacy" className="hover:text-[var(--ink)]">
            隱私權
          </Link>
          <Link href="/legal/terms" className="hover:text-[var(--ink)]">
            服務條款
          </Link>
        </div>
      </div>
    </footer>
  );
}
