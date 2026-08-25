import { prisma } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildTransactionalMail } from "@/lib/mail-template";
import { allowRateLimit } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/utils";
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

    const summary = await getNotificationSummary(userId);
    const inboxUrl = `${getSiteUrl()}/inbox`;
    const unreadLabel =
      summary.unreadCount > 0 ? `${summary.unreadCount} 則` : "有新留言";

    const copy = buildTransactionalMail({
      subject: `你的 ${BRAND.en} 收到新的匿名留言`,
      preheader: "內容只在收件匣。請到網站查看。",
      title: "有新的匿名留言",
      username: user.username,
      paragraphs: [
        `有人透過你的專屬連結，在 ${BRAND.en}（${BRAND.zh}）傳了一則匿名留言。`,
        "這封信故意不放內容，避免在信箱被別人看到。請登入後到收件匣查看。",
      ],
      ctaLabel: "開啟收件匣",
      ctaUrl: inboxUrl,
      specs: [
        { label: "帳號", value: `@${user.username}` },
        { label: "用途", value: "新留言通知" },
        { label: "查看位置", value: "網站收件匣" },
        { label: "目前未讀", value: unreadLabel },
        { label: "寄件者", value: BRAND.contactEmail },
        { label: "網站", value: BRAND.domain },
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
