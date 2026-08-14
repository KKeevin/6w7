import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { asTopicList } from "@/lib/topics";
import { AppError } from "@/shared/errors";
import { avatarDisplayUrl } from "@/shared/avatar-url";
import { askLinkUrl } from "@/lib/utils";
import type { z } from "zod";
import type {
  registerSchema,
  updateProfileSchema,
} from "@/shared/schemas";

const DEFAULT_PROMPT = "匿名傳訊息給我！";
const DEFAULT_TITLE = "匿名問我";

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

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      name: input.name || username,
      passwordHash,
      askLink: {
        create: {
          slug: username,
          title: DEFAULT_TITLE,
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

export async function getProfileForOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { askLink: true },
  });
  if (!user?.askLink) {
    throw new AppError("NOT_FOUND", "找不到個人連結。", 404);
  }
  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: avatarDisplayUrl(user.image, user.updatedAt),
    },
    link: serializeLink(user.askLink),
  };
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  const existing = await prisma.askLink.findUnique({ where: { userId } });
  if (!existing) {
    throw new AppError("NOT_FOUND", "找不到個人連結。", 404);
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

export async function getPublicAskLink(slug: string) {
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
  return {
    slug: link.slug,
    title: link.title,
    prompt: link.prompt,
    acceptingMessages: link.acceptingMessages,
    requireTopic: link.requireTopic,
    topics: asTopicList(link.topics),
    image: avatarDisplayUrl(link.user.image, link.user.updatedAt),
    displayName: link.user.name || link.user.username,
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
