import { prisma } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { createRawToken, hashToken } from "@/lib/token-hash";
import { getSiteUrl } from "@/lib/utils";
import { AppError } from "@/shared/errors";
import { BRAND } from "@/shared/tools";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function verifyMailCopy(username: string, url: string) {
  const subject = `驗證你的 ${BRAND.en} 信箱`;
  const text = [
    `@${username} 你好，`,
    "",
    `請在 24 小時內開啟這個連結，完成 ${BRAND.en}（${BRAND.zh}）信箱驗證：`,
    url,
    "",
    "驗證後，忘記密碼才能寄重設信到這個信箱。",
    "若不是你本人，可以忽略這封信。",
    `這封信由 ${BRAND.contactEmail} 寄出。`,
  ].join("\n");

  const html = `
    <p>@${username} 你好，</p>
    <p>請在 24 小時內開啟這個連結，完成 ${BRAND.en}（${BRAND.zh}）信箱驗證：</p>
    <p><a href="${url}">驗證信箱</a></p>
    <p>驗證後，忘記密碼才能寄重設信到這個信箱。若不是你本人，可以忽略這封信。</p>
    <p>這封信由 ${BRAND.contactEmail} 寄出。</p>
  `.trim();

  return { subject, text, html };
}

async function deliverVerifyLink(user: {
  id: string;
  username: string;
  email: string;
}) {
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  const url = `${getSiteUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.info("[email-verify] 本機驗證連結已產生");
  }

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email-verify] SMTP 未設定，本機連結：${url}`);
    }
    return { sent: false as const };
  }

  try {
    const copy = verifyMailCopy(user.username, url);
    await sendMail({
      to: user.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("[email-verify] 寄信失敗");
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    return { sent: false as const };
  }
}

export async function updateAccountEmail(userId: string, email: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isDemo: true,
      email: true,
      emailVerified: true,
      username: true,
    },
  });
  if (!user) {
    throw new AppError("NOT_FOUND", "找不到使用者。", 404);
  }
  if (user.isDemo) {
    throw new AppError("FORBIDDEN", "示範帳號不能改信箱。", 403);
  }

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      throw new AppError("CONFLICT", "這個信箱已被其他帳號使用。", 409);
    }
  }

  const unchanged =
    Boolean(email) && user.email === email && Boolean(user.emailVerified);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      emailVerified: unchanged ? user.emailVerified : null,
    },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
    },
  });

  let mailed = false;
  if (email && !unchanged) {
    const result = await deliverVerifyLink({
      id: updated.id,
      username: updated.username,
      email,
    });
    mailed = result.sent;
  }

  return {
    user: {
      ...updated,
      emailVerified: Boolean(updated.emailVerified),
    },
    mailed,
  };
}

export async function requestEmailVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      isDemo: true,
      status: true,
    },
  });
  if (!user || user.status !== "active") {
    throw new AppError("NOT_FOUND", "找不到使用者。", 404);
  }
  if (user.isDemo) {
    throw new AppError("FORBIDDEN", "示範帳號不需驗證信箱。", 403);
  }
  if (!user.email) {
    throw new AppError("BAD_REQUEST", "請先填寫信箱再驗證。", 400);
  }
  if (user.emailVerified) {
    return { ok: true as const, alreadyVerified: true as const, mailed: false };
  }

  const result = await deliverVerifyLink({
    id: user.id,
    username: user.username,
    email: user.email,
  });
  return {
    ok: true as const,
    alreadyVerified: false as const,
    mailed: result.sent,
  };
}

export async function verifyEmailWithToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true, email: true, status: true, isDemo: true },
      },
    },
  });

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      "BAD_REQUEST",
      "驗證連結無效或已過期，請到設定頁重寄。",
      400,
    );
  }
  if (
    row.user.status !== "active" ||
    row.user.isDemo ||
    row.user.email !== row.email
  ) {
    throw new AppError("BAD_REQUEST", "這個驗證連結已失效，請重新寄一次。", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return { ok: true as const };
}
