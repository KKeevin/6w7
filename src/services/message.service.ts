import { prisma } from "@/lib/db";
import { asTopicList } from "@/lib/topics";
import { AppError } from "@/shared/errors";
import { ASK_LIMITS } from "@/shared/tools";
import { containsBlockedContent, sanitizePlainText } from "@/lib/moderation";
import { notifyOwnerNewMessage } from "@/services/notification.service";
import type { z } from "zod";
import type { createMessageSchema, updateMessageSchema } from "@/shared/schemas";

export async function createPublicMessage(
  slug: string,
  input: z.infer<typeof createMessageSchema>,
  fingerprintHash: string,
) {
  const link = await prisma.askLink.findUnique({ where: { slug } });
  if (!link || !link.isActive) {
    throw new AppError("NOT_FOUND", "找不到此匿名問答連結。", 404);
  }
  if (!link.acceptingMessages) {
    throw new AppError("LINK_CLOSED", "此連結目前不接受留言。", 403);
  }

  const body = sanitizePlainText(input.body);
  if (!body) {
    throw new AppError("VALIDATION_ERROR", "請輸入留言內容。", 400);
  }
  if (containsBlockedContent(body)) {
    throw new AppError("VALIDATION_ERROR", "留言內容無法送出。", 400);
  }

  const topics = asTopicList(link.topics);
  let topic = input.topic ? sanitizePlainText(input.topic) : undefined;
  if (link.requireTopic) {
    if (!topic || !topics.includes(topic)) {
      throw new AppError("VALIDATION_ERROR", "請選擇一個主題標籤。", 400);
    }
  } else if (topic && topics.length > 0 && !topics.includes(topic)) {
    throw new AppError("VALIDATION_ERROR", "主題標籤無效。", 400);
  }

  if (link.dailyLimit && link.dailyLimit > 0) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await prisma.message.count({
      where: { linkId: link.id, createdAt: { gte: start } },
    });
    if (count >= link.dailyLimit) {
      throw new AppError("LINK_CLOSED", "今日收件已達上限，請明天再試。", 403);
    }
  }

  const blocked = await prisma.blockRule.findFirst({
    where: {
      linkId: link.id,
      OR: [
        { fingerprintHash },
        ...(topic ? [{ keyword: topic }] : []),
      ],
    },
  });
  if (blocked?.fingerprintHash === fingerprintHash) {
    throw new AppError("FORBIDDEN", "無法送出留言。", 403);
  }

  const message = await prisma.message.create({
    data: {
      linkId: link.id,
      body,
      topic: topic || null,
      fingerprintHash,
    },
    select: { id: true, createdAt: true },
  });

  await notifyOwnerNewMessage(link.userId);
  return message;
}

export async function listInbox(
  userId: string,
  options?: {
    filter?: "unread" | "featured" | "archived" | "all";
    linkId?: string;
    page?: number;
  },
) {
  const pageSize = ASK_LIMITS.inboxPageSize;
  const requestedPage = Math.max(1, Math.floor(options?.page ?? 1));
  const links = await prisma.askLink.findMany({
    where: { userId },
    select: { id: true },
  });
  const linkIds = links.map((l) => l.id);
  if (linkIds.length === 0) {
    return { messages: [], page: 1, pageSize, total: 0, totalPages: 1 };
  }

  const filter = options?.filter ?? "all";
  const where = {
    linkId: options?.linkId ? options.linkId : { in: linkIds },
    ...(options?.linkId ? { link: { userId } } : {}),
    status: { not: "deleted" as const },
    ...(filter === "unread" ? { isRead: false, isArchived: false } : {}),
    ...(filter === "featured" ? { isFeatured: true } : {}),
    ...(filter === "archived" ? { isArchived: true } : {}),
    ...(filter === "all" ? { isArchived: false } : {}),
  };

  const total = await prisma.message.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      link: {
        select: { id: true, slug: true, title: true },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { messages, page, pageSize, total, totalPages };
}

async function getOwnedMessage(userId: string, messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { link: true },
  });
  if (!message || message.link.userId !== userId) {
    throw new AppError("NOT_FOUND", "找不到此留言。", 404);
  }
  return message;
}

export async function updateMessage(
  userId: string,
  messageId: string,
  input: z.infer<typeof updateMessageSchema>,
) {
  await getOwnedMessage(userId, messageId);
  return prisma.message.update({
    where: { id: messageId },
    data: {
      ...(input.isRead !== undefined ? { isRead: input.isRead } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      link: { select: { id: true, slug: true, title: true } },
    },
  });
}

export async function deleteMessage(userId: string, messageId: string) {
  await getOwnedMessage(userId, messageId);
  await prisma.message.update({
    where: { id: messageId },
    data: { status: "deleted", isArchived: true },
  });
}

export async function reportMessage(
  userId: string,
  messageId: string,
  reason: string,
) {
  await getOwnedMessage(userId, messageId);
  const report = await prisma.report.create({
    data: { messageId, reason },
  });
  await prisma.message.update({
    where: { id: messageId },
    data: { status: "flagged" },
  });
  return report;
}
