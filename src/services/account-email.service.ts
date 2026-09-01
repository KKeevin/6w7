import { prisma } from "@/lib/db";
import { localeForMail } from "@/lib/account-locale";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { buildTransactionalMail } from "@/lib/mail-template";
import { createRawToken, hashToken } from "@/lib/token-hash";
import { getSiteUrl } from "@/lib/utils";
import { AppError } from "@/shared/errors";
import { translate, type Locale, type MessageKey } from "@/shared/i18n";
import { BRAND } from "@/shared/tools";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

function verifyMailCopy(
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
    subject: t("mail.verify.subject", brand),
    preheader: t("mail.verify.preheader"),
    title: t("mail.verify.title"),
    username,
    paragraphs: [t("mail.verify.p1", brand), t("mail.verify.p2")],
    ctaLabel: t("mail.verify.cta"),
    ctaUrl: url,
    specs: [
      { label: t("mail.specAccount"), value: `@${username}` },
      { label: t("mail.specEmail"), value: email },
      { label: t("mail.specPurpose"), value: t("mail.verify.purpose") },
      { label: t("mail.specExpiry"), value: t("mail.verify.expiry") },
      { label: t("mail.specFrom"), value: BRAND.contactEmail },
      { label: t("mail.specSite"), value: BRAND.domain },
    ],
  });
}

async function deliverVerifyLink(user: {
  id: string;
  username: string;
  email: string;
  locale: string | null;
  localeChosen: boolean;
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
    const locale = await localeForMail(user.locale, {
      chosen: user.localeChosen,
      fallback: "request",
    });
    const copy = verifyMailCopy(locale, user.username, user.email, url);
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
      locale: true,
      localeChosen: true,
    },
  });
  if (!user) {
    throw new AppError("NOT_FOUND", "api.userNotFound", 404);
  }
  if (user.isDemo) {
    throw new AppError("FORBIDDEN", "api.demoNoEmail", 403);
  }

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      throw new AppError("CONFLICT", "api.emailTaken", 409);
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
      locale: true,
      localeChosen: true,
    },
  });

    const { locale, localeChosen, ...publicUser } = updated;

    let mailed = false;
    if (email && !unchanged) {
      const result = await deliverVerifyLink({
        id: updated.id,
        username: updated.username,
        email,
        locale,
        localeChosen,
      });
      mailed = result.sent;
    }

    return {
      user: {
        ...publicUser,
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
      locale: true,
      localeChosen: true,
    },
  });
  if (!user || user.status !== "active") {
    throw new AppError("NOT_FOUND", "api.userNotFound", 404);
  }
  if (user.isDemo) {
    throw new AppError("FORBIDDEN", "api.demoNoVerify", 403);
  }
  if (!user.email) {
    throw new AppError("BAD_REQUEST", "api.emailRequired", 400);
  }
  if (user.emailVerified) {
    return { ok: true as const, alreadyVerified: true as const, mailed: false };
  }

  const result = await deliverVerifyLink({
    id: user.id,
    username: user.username,
    email: user.email,
    locale: user.locale,
    localeChosen: user.localeChosen,
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
    throw new AppError("BAD_REQUEST", "api.verifyExpired", 400);
  }
  if (
    row.user.status !== "active" ||
    row.user.isDemo ||
    row.user.email !== row.email
  ) {
    throw new AppError("BAD_REQUEST", "api.verifyInvalid", 400);
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
