import { getSiteUrl } from "@/lib/utils";
import { BRAND } from "@/shared/tools";

const INK = "#14212b";
const MUTED = "#5b6b78";
const LINE = "#c9d5de";
const BG = "#f3f6f8";
const SURFACE = "#e8eef2";
const ACCENT = "#ff5a3c";
const ACCENT_FG = "#fff8f6";
const MINT = "#1aa68a";

export type MailSpecRow = {
  label: string;
  value: string;
};

export type TransactionalMailInput = {
  subject: string;
  preheader: string;
  title: string;
  username: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  specs: MailSpecRow[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 信件圖檔與頁尾連結需絕對網址；本機 SMTP 測 Gmail 時改抓正式站。 */
function mailSiteOrigin() {
  const site = getSiteUrl();
  if (site.includes("localhost") || site.includes("127.0.0.1")) {
    return `https://${BRAND.domain}`;
  }
  return site;
}

export function mailPublicUrl(path: string) {
  const origin = mailSiteOrigin();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${clean}?v=${BRAND.logoVersion}`;
}

function pageUrl(path: string) {
  const origin = mailSiteOrigin();
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function bulletproofButton(label: string, url: string) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${ACCENT}" style="border-radius:12px;">
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.2;color:${ACCENT_FG};text-decoration:none;border-radius:12px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

function specsTable(specs: MailSpecRow[]) {
  const rows = specs
    .map((row, index) => {
      const border =
        index === specs.length - 1 ? "0" : `1px solid ${LINE}`;
      return `
        <tr>
          <td valign="top" style="padding:10px 0;border-bottom:${border};width:28%;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.04em;color:${MUTED};">
            ${escapeHtml(row.label)}
          </td>
          <td valign="top" style="padding:10px 0 10px 12px;border-bottom:${border};font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${INK};">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      ${rows}
    </table>
  `.trim();
}

export function buildTransactionalMail(input: TransactionalMailInput) {
  const site = mailSiteOrigin();
  const logoUrl = mailPublicUrl(BRAND.logoSrc);
  const privacyUrl = pageUrl("/legal/privacy");
  const termsUrl = pageUrl("/legal/terms");
  const contactUrl = pageUrl("/contact");
  const handle = `@${input.username}`;
  const year = new Date().getFullYear();

  const text = [
    `${BRAND.en}（${BRAND.zh}）`,
    site,
    "",
    `${handle} 你好，`,
    "",
    ...input.paragraphs,
    "",
    `${input.ctaLabel}：`,
    input.ctaUrl,
    "",
    "—— 信件規格 ——",
    ...input.specs.map((row) => `${row.label}：${row.value}`),
    "",
    "這是系統自動寄出的帳號信件，不是廣告。請勿把連結轉傳給別人。",
    `若按鈕沒反應，請把上面的網址複製到瀏覽器。`,
    `聯絡：${BRAND.contactEmail}`,
    `隱私權政策：${privacyUrl}`,
    `服務條款：${termsUrl}`,
    `聯絡我們：${contactUrl}`,
  ].join("\n");

  const paragraphsHtml = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${INK};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(input.preheader)}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${BG};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="background:${INK};border-radius:20px 20px 0 0;padding:28px 24px 22px;text-align:center;">
              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(BRAND.en)}" width="120" height="40" style="display:block;margin:0 auto 10px;height:40px;width:auto;max-width:160px;border:0;outline:none;text-decoration:none;" />
              <p style="margin:0;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;color:#d7e0e7;">
                ${escapeHtml(BRAND.en)}（${escapeHtml(BRAND.zh)}）
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:28px 28px 8px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
              <p style="margin:0 0 6px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:13px;color:${MUTED};">
                ${escapeHtml(handle)} 你好
              </p>
              <h1 style="margin:0 0 16px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:22px;line-height:1.35;color:${INK};">
                ${escapeHtml(input.title)}
              </h1>
              ${paragraphsHtml}
              <div style="padding:8px 0 22px;">
                ${bulletproofButton(input.ctaLabel, input.ctaUrl)}
              </div>
              <p style="margin:0 0 8px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                按鈕沒反應的話，把這個連結複製到瀏覽器：
              </p>
              <p style="margin:0 0 8px;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.5;">
                <a href="${escapeHtml(input.ctaUrl)}" style="color:${MINT};text-decoration:underline;">${escapeHtml(input.ctaUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:8px 28px 28px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${SURFACE};border-radius:14px;">
                <tr>
                  <td style="padding:16px 18px 6px;">
                    <p style="margin:0;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;color:${INK};">
                      信件規格
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 8px;">
                    ${specsTable(input.specs)}
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${MUTED};">
                這是系統自動寄出的帳號信件，不是廣告，也不會要你回覆密碼或下載檔案。請勿把連結轉傳給別人。若不是你本人操作，忽略即可。
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid ${LINE};border-top:0;border-radius:0 0 20px 20px;padding:8px 28px 24px;text-align:center;">
              <p style="margin:0 0 8px;border-top:1px solid ${LINE};padding-top:18px;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                <a href="${escapeHtml(privacyUrl)}" style="color:${MUTED};text-decoration:underline;">隱私權政策</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(termsUrl)}" style="color:${MUTED};text-decoration:underline;">服務條款</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(contactUrl)}" style="color:${MUTED};text-decoration:underline;">聯絡我們</a>
              </p>
              <p style="margin:0;font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
                © ${year} ${escapeHtml(BRAND.en)}（${escapeHtml(BRAND.zh)}）·
                <a href="${escapeHtml(site)}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(BRAND.domain)}</a>
                <br />
                有問題請來信
                <a href="mailto:${escapeHtml(BRAND.contactEmail)}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(BRAND.contactEmail)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: input.subject,
    text,
    html,
  };
}
