import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { createRawToken, hashToken } from "@/lib/token-hash";
import { getSiteUrl } from "@/lib/utils";
import { AppError } from "@/shared/errors";
import { normalizeUsername } from "@/shared/slug";
import { BRAND } from "@/shared/tools";

const RESET_TTL_MS = 60 * 60 * 1000;

function looksLikeEmail(value: string) {
  return value.includes("@");
}

async function findUserForReset(identifier: string) {
  const trimmed = identifier.trim().toLowerCase().replace(/^@+/, "");
  if (!trimmed) return null;

  if (looksLikeEmail(trimmed)) {
    return prisma.user.findUnique({
      where: { email: trimmed },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        isDemo: true,
        emailVerified: true,
      },
    });
  }

  return prisma.user.findUnique({
    where: { username: normalizeUsername(trimmed) },
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      isDemo: true,
      emailVerified: true,
    },
  });
}

function resetMailCopy(username: string, url: string) {
  const subject = `重設你的 ${BRAND.en} 密碼`;
  const text = [
    `@${username} 你好，`,
    "",
    `有人要重設 ${BRAND.en}（${BRAND.zh}）帳號密碼。請在 1 小時內開啟這個連結：`,
    url,
    "",
    "若不是你本人，可以忽略這封信，密碼不會變。",
    `這封信由 ${BRAND.contactEmail} 寄出。`,
  ].join("\n");

  const html = `
    <p>@${username} 你好，</p>
    <p>有人要重設 ${BRAND.en}（${BRAND.zh}）帳號密碼。請在 1 小時內開啟這個連結：</p>
    <p><a href="${url}">重設密碼</a></p>
    <p>若不是你本人，可以忽略這封信，密碼不會變。</p>
    <p>這封信由 ${BRAND.contactEmail} 寄出。</p>
  `.trim();

  return { subject, text, html };
}

/**
 * 無論帳號是否存在／有無信箱，回傳相同結果，避免探測帳號。
 */
export async function requestPasswordReset(identifier: string) {
  const user = await findUserForReset(identifier);
  const canSend =
    user &&
    user.status === "active" &&
    !user.isDemo &&
    Boolean(user.email) &&
    Boolean(user.emailVerified);

  if (!canSend || !user?.email) {
    return { ok: true as const };
  }

  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  const url = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.info("[password-reset] 本機重設連結已產生（正式環境只寄信）");
  }

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[password-reset] SMTP 未設定，本機連結：${url}`);
    }
    return { ok: true as const };
  }

  try {
    const copy = resetMailCopy(user.username, url);
    await sendMail({
      to: user.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });
  } catch (error) {
    console.error("[password-reset] 寄信失敗");
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }

  return { ok: true as const };
}

export async function resetPasswordWithToken(rawToken: string, password: string) {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, status: true, isDemo: true } },
    },
  });

  if (!row || row.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      "BAD_REQUEST",
      "重設連結無效或已過期，請重新申請。",
      400,
    );
  }
  if (row.user.status !== "active" || row.user.isDemo) {
    throw new AppError("FORBIDDEN", "這個帳號無法重設密碼。", 403);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);

  return { ok: true as const };
}
