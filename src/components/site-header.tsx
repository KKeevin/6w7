import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { prisma } from "@/lib/db";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderNav } from "@/components/site-header-nav";
import { BRAND } from "@/shared/tools";
import { SHELL_X } from "@/shared/shell";
import { getT } from "@/lib/locale";

function UserIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.6-3.2 4.2-4.8 6.5-4.8s4.9 1.6 6.5 4.8" />
    </svg>
  );
}

export async function SiteHeader() {
  const viewer = await getViewer();
  const t = await getT();
  const signedIn = viewer.kind === "user" || viewer.kind === "demo";

  const nav = signedIn
    ? [
        { href: "/dashboard", label: t("nav.shortUrl") },
        { href: "/inbox", label: t("nav.inbox") },
      ]
    : [];

  const username =
    viewer.kind === "guest"
      ? ""
      : viewer.user.username || viewer.user.name || "";

  let needsEmail = false;
  if (viewer.kind === "user") {
    const row = await prisma.user.findUnique({
      where: { id: viewer.user.id },
      select: { emailVerified: true },
    });
    needsEmail = !row?.emailVerified;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-20 h-[var(--header-h)] border-b border-[var(--line)]/70 bg-[var(--bg)]/90 backdrop-blur-md">
      <div
        className={`${SHELL_X} grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3`}
      >
        <Link
          href={signedIn ? "/dashboard" : "/"}
          className="chrome-scale-start group flex min-w-0 items-end gap-0 justify-self-start"
        >
          <BrandLogo height={28} priority className="shrink-0" />
          <span className="hidden overflow-visible pb-1 text-xs leading-none text-[var(--muted)] group-hover:text-[var(--ink)] sm:inline">
            {BRAND.zh}
          </span>
        </Link>

        <div className="chrome-scale-mid w-fit max-w-full min-w-0 justify-self-center">
          <HeaderNav items={nav} />
        </div>

        {signedIn ? (
          <Link
            href={needsEmail ? "/settings#email" : "/settings"}
            className="chrome-scale-end relative flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition hover:border-[var(--mint)] hover:text-[var(--ink)]"
            title={
              username
                ? t("nav.settingsUser", { username })
                : t("nav.settings")
            }
            aria-label={
              username
                ? t("nav.settingsAria", { username })
                : t("nav.settings")
            }
          >
            <UserIcon className="h-5 w-5" />
            {needsEmail ? (
              <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg)]" />
            ) : null}
          </Link>
        ) : (
          <Link
            href="/login"
            className="chrome-scale-end inline-flex h-9 items-center justify-self-end rounded-xl border border-[var(--line)] px-3 text-sm font-medium hover:bg-[var(--surface)]"
          >
            {t("nav.login")}
          </Link>
        )}
      </div>
    </header>
  );
}
