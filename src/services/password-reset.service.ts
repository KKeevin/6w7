import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { localeForMail } from "@/lib/account-locale";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildTransactionalMail } from "@/lib/mail-template";
import { createRawToken, hashToken } from "@/lib/token-hash";
import { getSiteUrl } from "@/lib/utils";
import { AppError } from "@/shared/errors";
import { translate, type Locale, type MessageKey } from "@/shared/i18n";
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
        locale: true,
        localeChosen: true,
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
      locale: true,
      localeChosen: true,
    },
  });
}

function resetMailCopy(
  locale: Locale,
  username: string,
  email: string,
  url: string,
) {
  const t = (key: MessageKey, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
  const brand = { brand: BRAND.en, brandZh: BRAND.zh };
  return buildTransactionalMail({
    locale,
    subject: t("mail.reset.subject", brand),
    preheader: t("mail.reset.preheader"),
    title: t("mail.reset.title"),
    username,
    paragraphs: [t("mail.reset.p1", brand), t("mail.reset.p2")],
    ctaLabel: t("mail.reset.cta"),
    ctaUrl: url,
    specs: [
      { label: t("mail.specAccount"), value: `@${username}` },
      { label: t("mail.specEmail"), value: email },
      { label: t("mail.specPurpose"), value: t("mail.reset.purpose") },
      { label: t("mail.specExpiry"), value: t("mail.reset.expiry") },
      { label: t("mail.specFrom"), value: BRAND.contactEmail },
      { label: t("mail.specSite"), value: BRAND.domain },
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
    const locale = await localeForMail(user.locale, {
      chosen: user.localeChosen,
      fallback: "request",
    });
    const copy = resetMailCopy(locale, user.username, user.email, url);
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
    throw new AppError("BAD_REQUEST", "api.resetExpired", 400);
  }
  if (row.user.status !== "active" || row.user.isDemo) {
    throw new AppError("FORBIDDEN", "api.resetForbidden", 403);
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
