import nodemailer from "nodemailer";
import { BRAND } from "@/shared/tools";

export function isMailConfigured() {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

export function mailFromAddress() {
  const from = process.env.MAIL_FROM?.trim();
  if (from) return from;
  return `${BRAND.en} <${BRAND.contactEmail}>`;
}

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/** 以 SMTP 寄信（Gmail 代發 service@6w7.link）。密鑰只讀環境變數。 */
export async function sendMail(input: SendMailInput) {
  if (!isMailConfigured()) {
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  });

  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    replyTo: BRAND.contactEmail,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
