import { prisma } from "@/lib/db";
import { localeForMail } from "@/lib/account-locale";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildTransactionalMail } from "@/lib/mail-template";
import { allowRateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/utils";
import { translate, type MessageKey } from "@/shared/i18n";
import { BRAND } from "@/shared/tools";
import type { NotificationSummary } from "@/shared/notifications";

export type { NotificationSummary };

/** 未讀摘要：Web／未來 App 共用（不含留言全文，避免通知外洩） */
export async function getNotificationSummary(
  userId: string,
): Promise<NotificationSummary> {
  const link = await prisma.askLink.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!link) {
    return {
      unreadCount: 0,
      latestId: null,
      latestAt: null,
      latestTopic: null,
    };
  }

  const where = {
    linkId: link.id,
    isRead: false,
    isArchived: false,
    status: { not: "deleted" as const },
  };

  const [unreadCount, latest] = await Promise.all([
    prisma.message.count({ where }),
    prisma.message.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, topic: true },
    }),
  ]);

  return {
    unreadCount,
    latestId: latest?.id ?? null,
    latestAt: latest?.createdAt?.toISOString() ?? null,
    latestTopic: latest?.topic ?? null,
  };
}

/**
 * 新匿名留言通知信。不含留言全文；寄信失敗或超過限流時略過，不影響訪客送出。
 */
export async function notifyOwnerNewMessage(userId: string) {
  try {
    if (!isMailConfigured()) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        emailVerified: true,
        isDemo: true,
        status: true,
        locale: true,
        localeChosen: true,
      },
    });
    if (
      !user ||
      user.status !== "active" ||
      user.isDemo ||
      !user.email ||
      !user.emailVerified
    ) {
      return;
    }

    const hourlyOk = await allowRateLimit({
      key: `new-msg-mail-h:${userId}`,
      limit: 12,
      windowMs: 60 * 60 * 1000,
      windowLabel: "1 h",
      name: "new-msg-mail-hour",
    });
    if (!hourlyOk) return;

    const dailyOk = await allowRateLimit({
      key: `new-msg-mail-d:${userId}`,
      limit: 40,
      windowMs: 24 * 60 * 60 * 1000,
      windowLabel: "1 d",
      name: "new-msg-mail-day",
    });
    if (!dailyOk) return;

    const locale = await localeForMail(user.locale, {
      chosen: user.localeChosen,
      fallback: "default",
    });
    const t = (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars);
    const brand = { brand: BRAND.en, brandZh: BRAND.zh };
    const summary = await getNotificationSummary(userId);
    const inboxUrl = `${getSiteUrl()}/inbox`;
    const unreadLabel =
      summary.unreadCount > 0
        ? t("mail.newMsg.unread", { count: summary.unreadCount })
        : t("mail.newMsg.unreadFallback");

    const copy = buildTransactionalMail({
      locale,
      subject: t("mail.newMsg.subject", brand),
      preheader: t("mail.newMsg.preheader"),
      title: t("mail.newMsg.title"),
      username: user.username,
      paragraphs: [t("mail.newMsg.p1", brand), t("mail.newMsg.p2")],
      ctaLabel: t("mail.newMsg.cta"),
      ctaUrl: inboxUrl,
      specs: [
        { label: t("mail.specAccount"), value: `@${user.username}` },
        { label: t("mail.specUnread"), value: unreadLabel },
        { label: t("mail.specFrom"), value: BRAND.contactEmail },
        { label: t("mail.specSite"), value: BRAND.domain },
      ],
    });

    await sendMail({
      to: user.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });
  } catch (error) {
    console.error("[new-message-mail] 寄信失敗");
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }
}
