import { cache } from "react";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asTopicList, toTopicsJson } from "@/lib/topics";
import {
  DEMO_MESSAGES,
  DEMO_PROFILE,
  demoMessageBody,
} from "@/shared/demo-account";

const DEMO_MESSAGE_IDS = DEMO_MESSAGES.map((m) => m.id);

export function demoAccountPassword() {
  return process.env.DEMO_ACCOUNT_PASSWORD?.trim() || "lewanq-demo-6w7";
}

type SeededLink = {
  prompt: string;
  requireTopic: boolean;
  acceptingMessages: boolean;
  topics: Prisma.JsonValue;
  messages: {
    id: string;
    body: string;
    topic: string | null;
    isRead: boolean;
    isFeatured: boolean;
    isArchived: boolean;
    status: string;
  }[];
};

function seedMatches(link: SeededLink) {
  if (link.prompt !== DEMO_PROFILE.prompt) return false;
  if (link.requireTopic !== DEMO_PROFILE.requireTopic) return false;
  if (!link.acceptingMessages) return false;
  const topics = asTopicList(link.topics);
  if (topics.length !== DEMO_PROFILE.topics.length) return false;
  if (DEMO_PROFILE.topics.some((topic, i) => topics[i] !== topic)) return false;
  if (link.messages.length !== DEMO_MESSAGES.length) return false;

  const byId = new Map(link.messages.map((row) => [row.id, row]));
  for (const message of DEMO_MESSAGES) {
    const row = byId.get(message.id);
    if (!row) return false;
    if (row.body !== demoMessageBody(message)) return false;
    if (row.topic !== null) return false;
    if (row.isRead !== message.isRead) return false;
    if (row.isFeatured !== message.isFeatured) return false;
    if (row.isArchived !== message.isArchived) return false;
    if (row.status !== "visible") return false;
  }
  return true;
}

async function findSeededDemoUser() {
  return prisma.user.findUnique({
    where: { username: DEMO_PROFILE.username },
    include: {
      askLink: {
        include: {
          messages: {
            where: { id: { in: DEMO_MESSAGE_IDS } },
            select: {
              id: true,
              body: true,
              topic: true,
              isRead: true,
              isFeatured: true,
              isArchived: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

/** 公開頁用：內容與程式一致就只讀；主題／範例提問有改才重種 */
export const ensureDemoAccountIfMissing = cache(async () => {
  return ensureDemoAccount();
});

/** 確保示範帳號存在且範例內容與程式一致（內容沒變就只讀、不寫、不雜湊） */
export async function ensureDemoAccount() {
  const existing = await findSeededDemoUser();
  if (existing && !existing.isDemo) {
    throw new Error("username lewanq 已被非示範帳號占用");
  }
  if (existing?.askLink && seedMatches(existing.askLink)) {
    return existing;
  }

  const username = DEMO_PROFILE.username;
  const passwordHash = existing?.passwordHash
    ? existing.passwordHash
    : await bcrypt.hash(demoAccountPassword(), 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { username },
      create: {
        username,
        name: DEMO_PROFILE.displayName,
        passwordHash,
        isDemo: true,
        askLink: {
          create: {
            slug: username,
            title: "匿名問我",
            prompt: DEMO_PROFILE.prompt,
            acceptingMessages: true,
            requireTopic: DEMO_PROFILE.requireTopic,
            topics: toTopicsJson([...DEMO_PROFILE.topics]),
          },
        },
      },
      update: {
        name: DEMO_PROFILE.displayName,
        isDemo: true,
        status: "active",
        ...(existing?.passwordHash ? {} : { passwordHash }),
      },
      include: { askLink: true },
    });

    const linkId = user.askLink?.id;
    if (!linkId) {
      throw new Error("示範帳號缺少 AskLink");
    }

    await tx.askLink.update({
      where: { id: linkId },
      data: {
        prompt: DEMO_PROFILE.prompt,
        acceptingMessages: true,
        requireTopic: DEMO_PROFILE.requireTopic,
        topics: toTopicsJson([...DEMO_PROFILE.topics]),
      },
    });

    await Promise.all(
      DEMO_MESSAGES.map((message) =>
        tx.message.upsert({
          where: { id: message.id },
          create: {
            id: message.id,
            linkId,
            body: demoMessageBody(message),
            topic: null,
            isRead: message.isRead,
            isFeatured: message.isFeatured,
            isArchived: message.isArchived,
            status: "visible",
            createdAt: new Date(message.createdAt),
          },
          update: {
            linkId,
            body: demoMessageBody(message),
            topic: null,
            isRead: message.isRead,
            isFeatured: message.isFeatured,
            isArchived: message.isArchived,
            status: "visible",
          },
        }),
      ),
    );

    return user;
  });
}
