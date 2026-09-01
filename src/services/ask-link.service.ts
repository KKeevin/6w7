import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { asTopicList } from "@/lib/topics";
import { isDemoUsername, getDemoPrompt } from "@/shared/demo-account";
import { getRequestLocale } from "@/lib/locale";
import {
  getOrCreateDemoSandboxId,
  readDemoSandboxId,
} from "@/lib/demo-sandbox";
import {
  hydrateDemoSandboxOverlay,
  patchDemoSandboxOverlay,
  type DemoSandboxOverlay,
} from "@/services/demo-sandbox.service";
import { AppError } from "@/shared/errors";
import { avatarDisplayUrl } from "@/shared/avatar-url";
import { askLinkUrl } from "@/lib/utils";
import type { z } from "zod";
import type {
  registerSchema,
  updateProfileSchema,
} from "@/shared/schemas";
import { listStickersForLink } from "@/services/page-media.service";
import { DEFAULT_ASK_TITLE } from "@/shared/ask-title";
import type { PublicSticker } from "@/shared/page-stickers";

const DEFAULT_PROMPT = "匿名傳訊息給我！";

function serializeLink<T extends { topics: unknown; slug: string }>(link: T) {
  return {
    ...link,
    topics: asTopicList(link.topics as never),
    url: askLinkUrl(link.slug),
  };
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const username = input.username;
  const { DEMO_PROFILE } = await import("@/shared/demo-account");
  if (username === DEMO_PROFILE.username) {
    throw new AppError("CONFLICT", "這個 IG 帳號已被註冊。", 409);
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new AppError("CONFLICT", "這個 IG 帳號已被註冊。", 409);
  }

  if (input.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (emailTaken) {
      throw new AppError("CONFLICT", "這個信箱已被其他帳號使用。", 409);
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      name: input.name || username,
      email: input.email,
      passwordHash,
      askLink: {
        create: {
          slug: username,
          title: DEFAULT_ASK_TITLE,
          prompt: DEFAULT_PROMPT,
        },
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      updatedAt: true,
      askLink: true,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: avatarDisplayUrl(user.image, user.updatedAt),
    },
    link: user.askLink ? serializeLink(user.askLink) : null,
  };
}

function applyOverlayToLink<
  T extends {
    prompt: string;
    title: string;
    acceptingMessages: boolean;
  },
>(link: T, overlay: DemoSandboxOverlay | null, demoPrompt: string): T {
  if (!overlay) {
    return { ...link, prompt: demoPrompt };
  }
  return {
    ...link,
    prompt: overlay.prompt ?? demoPrompt,
    title: overlay.title ?? link.title,
    acceptingMessages: overlay.acceptingMessages ?? link.acceptingMessages,
  };
}

export async function getProfileForOwner(
  userId: string,
  opts?: { mintSandbox?: boolean },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { askLink: true },
  });
  if (!user?.askLink) {
    throw new AppError("NOT_FOUND", "找不到個人連結。", 404);
  }
  const serialized = serializeLink(user.askLink);
  const sandboxId = user.isDemo
    ? opts?.mintSandbox
      ? await getOrCreateDemoSandboxId()
      : await readDemoSandboxId()
    : null;
  const overlay = sandboxId
    ? await hydrateDemoSandboxOverlay(user.id, sandboxId)
    : null;
  const demoPrompt = user.isDemo
    ? getDemoPrompt(await getRequestLocale())
    : serialized.prompt;
  const link = user.isDemo
    ? {
        ...applyOverlayToLink(serialized, overlay, demoPrompt),
        requireTopic: false,
        topics: [] as string[],
      }
    : serialized;

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      image: overlay?.avatarUrl ?? avatarDisplayUrl(user.image, user.updatedAt),
    },
    link,
    stickers: user.isDemo
      ? (overlay?.stickers ?? [])
      : await listStickersForLink(user.askLink.id),
  };
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  const existing = await prisma.askLink.findUnique({
    where: { userId },
    include: { user: { select: { isDemo: true } } },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "找不到個人連結。", 404);
  }

  if (existing.user.isDemo) {
    const sandboxId = await getOrCreateDemoSandboxId();
    const overlay = await patchDemoSandboxOverlay(sandboxId, {
      ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.acceptingMessages !== undefined
        ? { acceptingMessages: input.acceptingMessages }
        : {}),
    });
    const { user: _demoUser, ...askLink } = existing;
    const serialized = serializeLink(askLink);
    return applyOverlayToLink(
      {
        ...serialized,
        requireTopic: false,
        topics: [] as string[],
      },
      overlay,
      overlay.prompt ?? getDemoPrompt(await getRequestLocale()),
    );
  }

  const link = await prisma.askLink.update({
    where: { userId },
    data: {
      ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.acceptingMessages !== undefined
        ? { acceptingMessages: input.acceptingMessages }
        : {}),
    },
  });

  return serializeLink(link);
}

export async function setUserImage(userId: string, imagePath: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { image: imagePath },
    select: { id: true, username: true, image: true, updatedAt: true },
  });
  return {
    id: user.id,
    username: user.username,
    image: avatarDisplayUrl(user.image, user.updatedAt),
  };
}

export const getPublicAskLink = cache(async (slug: string) => {
  const link = await prisma.askLink.findUnique({
    where: { slug: slug.toLowerCase() },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          username: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!link || !link.isActive || link.user.status !== "active") {
    throw new AppError("NOT_FOUND", "找不到此匿名問答連結。", 404);
  }
  const demo = isDemoUsername(link.slug);
  const stickers = demo ? [] : await listStickersForLink(link.id);
  const prompt = demo ? getDemoPrompt(await getRequestLocale()) : link.prompt;
  return {
    slug: link.slug,
    title: link.title,
    prompt,
    acceptingMessages: link.acceptingMessages,
    requireTopic: demo ? false : link.requireTopic,
    topics: demo ? [] : asTopicList(link.topics),
    image: avatarDisplayUrl(link.user.image, link.user.updatedAt),
    displayName: link.user.name || link.user.username,
    stickers,
  };
});

export async function applyDemoSandboxToPublicLink<
  T extends {
    prompt: string;
    title: string;
    acceptingMessages: boolean;
    image: string | null;
    stickers: PublicSticker[];
  },
>(userId: string, link: T): Promise<T> {
  const sandboxId = await readDemoSandboxId();
  if (!sandboxId) return link;
  const overlay = await hydrateDemoSandboxOverlay(userId, sandboxId);
  return {
    ...link,
    prompt: overlay.prompt ?? link.prompt,
    title: overlay.title ?? link.title,
    acceptingMessages: overlay.acceptingMessages ?? link.acceptingMessages,
    image: overlay.avatarUrl ?? link.image,
    stickers: overlay.stickers,
  };
}

// 相容舊 API 匯出名稱
export async function createAskLink() {
  throw new AppError(
    "BAD_REQUEST",
    "每人僅一條個人連結，請直接更新人設提示。",
    400,
  );
}

export async function listAskLinks(userId: string) {
  const profile = await getProfileForOwner(userId);
  return [profile.link];
}

export async function updateAskLink(
  userId: string,
  _id: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  return updateProfile(userId, input);
}
