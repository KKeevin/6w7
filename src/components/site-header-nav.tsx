"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/notifications/notification-provider";
import { useT } from "@/components/i18n-provider";

export type HeaderNavItem = {
  href: string;
  label: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-md bg-[var(--accent)] px-1 text-[0.625rem] font-bold leading-none text-white shadow-sm"
      aria-hidden
    >
      {label}
    </span>
  );
}

/** 單列導覽：手機緊湊、桌機稍寬，皆與 logo／帳號同一行 */
export function HeaderNav({ items }: { items: HeaderNavItem[] }) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const t = useT();
  if (items.length === 0) return null;

  return (
    <nav
      className="flex min-w-0 items-center justify-center gap-1 sm:gap-1.5"
      aria-label={t("nav.inbox")}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const isInbox = item.href === "/inbox";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={
              isInbox && unreadCount > 0
                ? t("nav.inboxUnread", {
                    label: item.label,
                    count: unreadCount,
                  })
                : undefined
            }
            className={`relative rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition sm:px-3 sm:text-sm ${
              active
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            }`}
          >
            {item.label}
            {isInbox ? <UnreadBadge count={unreadCount} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
