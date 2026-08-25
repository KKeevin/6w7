import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildTransactionalMail } from "@/lib/mail-template";
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

function resetMailCopy(username: string, email: string, url: string) {
  return buildTransactionalMail({
    subject: `重設你的 ${BRAND.en} 密碼`,
    preheader: "連結 1 小時內有效。不是你本人請直接忽略，密碼不會變。",
    title: "重設密碼",
    username,
    paragraphs: [
      `有人申請重設你在 ${BRAND.en}（${BRAND.zh}）的密碼。若是你本人，請在 1 小時內按下面的按鈕。`,
      "我們不會在信裡要你回覆密碼，也不會要你下載檔案。若有人這樣跟你要，請當成詐騙。",
    ],
    ctaLabel: "重設密碼",
    ctaUrl: url,
    specs: [
      { label: "帳號", value: `@${username}` },
      { label: "信箱", value: email },
      { label: "用途", value: "重設密碼" },
      { label: "有效期限", value: "1 小時（用過即失效）" },
      { label: "寄件者", value: BRAND.contactEmail },
      { label: "網站", value: BRAND.domain },
    ],
  });
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
    const copy = resetMailCopy(user.username, user.email, url);
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
