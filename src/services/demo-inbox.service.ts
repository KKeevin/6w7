import { getRequestLocale } from "@/lib/locale";
import {
  getOrCreateDemoSandboxId,
  readDemoSandboxId,
} from "@/lib/demo-sandbox";
import {
  getDemoSandboxOverlay,
  patchDemoSandboxOverlay,
  type DemoInboxFlags,
} from "@/services/demo-sandbox.service";
import { AppError } from "@/shared/errors";
import {
  isDemoMessageId,
  toInboxDemoMessages,
} from "@/shared/demo-account";
import type { NotificationSummary } from "@/shared/notifications";
import { ASK_LIMITS } from "@/shared/tools";
import type { updateMessageSchema } from "@/shared/schemas";
import type { z } from "zod";

export type DemoInboxMessage = {
  id: string;
  body: string;
  topic: string | null;
  isRead: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  status: string;
  createdAt: Date;
  link: { id: string; slug: string; title: string };
};

function applyFlags(
  message: ReturnType<typeof toInboxDemoMessages>[number],
  flags: DemoInboxFlags | undefined,
): DemoInboxMessage | null {
  const deleted = flags?.deleted === true || flags?.status === "deleted";
  if (deleted) return null;
  return {
    id: message.id,
    body: message.body,
    topic: message.topic,
    isRead: flags?.isRead ?? message.isRead,
    isFeatured: flags?.isFeatured ?? message.isFeatured,
    isArchived: flags?.isArchived ?? message.isArchived,
    status: flags?.status ?? message.status,
    createdAt: new Date(message.createdAt),
    link: message.link,
  };
}

async function overlayFor(
  sandboxId: string | null,
): Promise<Record<string, DemoInboxFlags>> {
  if (!sandboxId) return {};
  const overlay = await getDemoSandboxOverlay(sandboxId);
  return overlay.inbox ?? {};
}

export async function listDemoInbox(options?: {
  filter?: "unread" | "featured" | "archived" | "all";
  page?: number;
}) {
  const locale = await getRequestLocale();
  const sandboxId = await readDemoSandboxId();
  const inbox = await overlayFor(sandboxId);
  const merged = toInboxDemoMessages(locale)
    .map((message) => applyFlags(message, inbox[message.id]))
    .filter((message): message is DemoInboxMessage => message != null);

  const filter = options?.filter ?? "all";
  const filtered =
    filter === "unread"
      ? merged.filter((m) => !m.isRead && !m.isArchived)
      : filter === "featured"
        ? merged.filter((m) => m.isFeatured)
        : filter === "archived"
          ? merged.filter((m) => m.isArchived)
          : merged.filter((m) => !m.isArchived);

  const pageSize = ASK_LIMITS.inboxPageSize;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Math.max(1, Math.floor(options?.page ?? 1));
  const page = Math.min(requestedPage, totalPages);
  const messages = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { messages, page, pageSize, total, totalPages };
}

async function getLiveDemoMessage(messageId: string): Promise<DemoInboxMessage> {
  if (!isDemoMessageId(messageId)) {
    throw new AppError("NOT_FOUND", "api.messageNotFound", 404);
  }
  const locale = await getRequestLocale();
  const sandboxId = await readDemoSandboxId();
  const seed = toInboxDemoMessages(locale).find((m) => m.id === messageId);
  if (!seed) {
    throw new AppError("NOT_FOUND", "api.messageNotFound", 404);
  }
  const live = applyFlags(seed, (await overlayFor(sandboxId))[messageId]);
  if (!live) {
    throw new AppError("NOT_FOUND", "api.messageNotFound", 404);
  }
  return live;
}

export async function updateDemoInboxMessage(
  messageId: string,
  input: z.infer<typeof updateMessageSchema>,
) {
  await getLiveDemoMessage(messageId);
  const sandboxId = await getOrCreateDemoSandboxId();
  const overlay = await getDemoSandboxOverlay(sandboxId);
  const current = overlay.inbox?.[messageId] ?? {};
  const next: DemoInboxFlags = { ...current };
  if (input.isRead !== undefined) next.isRead = input.isRead;
  if (input.isFeatured !== undefined) next.isFeatured = input.isFeatured;
  if (input.isArchived !== undefined) next.isArchived = input.isArchived;
  if (input.status !== undefined) {
    next.status = input.status === "hidden" ? "visible" : input.status;
    if (input.status === "deleted") {
      next.deleted = true;
      next.isArchived = true;
    }
  }
  await patchDemoSandboxOverlay(sandboxId, {
    inbox: { ...overlay.inbox, [messageId]: next },
  });
  return getLiveDemoMessage(messageId);
}

/** 示範重新登入：未讀／精選／封存回到種子預設 */
export async function resetDemoInboxFlags() {
  const sandboxId = await getOrCreateDemoSandboxId();
  await patchDemoSandboxOverlay(sandboxId, { inbox: {} });
}

export async function deleteDemoInboxMessage(_messageId: string) {
  throw new AppError("FORBIDDEN", "api.demoSeedLocked", 403);
}

export async function reportDemoInboxMessage(
  messageId: string,
  reason: string,
) {
  await getLiveDemoMessage(messageId);
  const sandboxId = await getOrCreateDemoSandboxId();
  const overlay = await getDemoSandboxOverlay(sandboxId);
  const current = overlay.inbox?.[messageId] ?? {};
  await patchDemoSandboxOverlay(sandboxId, {
    inbox: {
      ...overlay.inbox,
      [messageId]: { ...current, status: "flagged" },
    },
  });
  return {
    id: `demo-report-${messageId}`,
    messageId,
    reason,
  };
}

export async function getDemoNotificationSummary(): Promise<NotificationSummary> {
  const locale = await getRequestLocale();
  const sandboxId = await readDemoSandboxId();
  const inbox = await overlayFor(sandboxId);
  const unread = toInboxDemoMessages(locale)
    .map((message) => applyFlags(message, inbox[message.id]))
    .filter((message): message is DemoInboxMessage => message != null)
    .filter((message) => !message.isRead && !message.isArchived);

  const latest = unread[0];
  return {
    unreadCount: unread.length,
    latestId: latest?.id ?? null,
    latestAt: latest?.createdAt.toISOString() ?? null,
    latestTopic: latest?.topic ?? null,
  };
}
