import { prisma } from "@/lib/db";
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
