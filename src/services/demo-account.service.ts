import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { toTopicsJson } from "@/lib/topics";
import { DEMO_MESSAGES, DEMO_PROFILE } from "@/shared/demo-account";

export function demoAccountPassword() {
  return process.env.DEMO_ACCOUNT_PASSWORD?.trim() || "lewanq-demo-6w7";
}

/** 確保示範帳號存在於資料庫（真實 User，可登入／登出） */
export async function ensureDemoAccount() {
  const passwordHash = await bcrypt.hash(demoAccountPassword(), 12);
  const username = DEMO_PROFILE.username;

  const user = await prisma.user.upsert({
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
      passwordHash,
      isDemo: true,
      status: "active",
    },
    include: { askLink: true },
  });

  const linkId = user.askLink?.id;
  if (!linkId) {
    throw new Error("示範帳號缺少 AskLink");
  }

  await prisma.askLink.update({
    where: { id: linkId },
    data: {
      prompt: DEMO_PROFILE.prompt,
      acceptingMessages: true,
      requireTopic: DEMO_PROFILE.requireTopic,
      topics: toTopicsJson([...DEMO_PROFILE.topics]),
    },
  });

  for (const message of DEMO_MESSAGES) {
    await prisma.message.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
        linkId,
        body: `${message.title}\n\n${message.body}`,
        topic: message.topic,
        isRead: message.isRead,
        isFeatured: message.isFeatured,
        isArchived: message.isArchived,
        status: "visible",
        createdAt: new Date(message.createdAt),
      },
      update: {
        linkId,
        body: `${message.title}\n\n${message.body}`,
        topic: message.topic,
        isRead: message.isRead,
        isFeatured: message.isFeatured,
        isArchived: message.isArchived,
        status: "visible",
      },
    });
  }

  return user;
}
