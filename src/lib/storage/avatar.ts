import { AwsClient } from "aws4fetch";

export type StorageDriver = "local" | "s3";

function env(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function getDriver(): StorageDriver {
  const d = env("STORAGE_DRIVER") || "local";
  return d === "s3" ? "s3" : "local";
}

/** 正式環境 S3/R2 key：avatars/{userId}/profile.png */
export function avatarObjectKey(userId: string) {
  return `avatars/${userId}/profile.png`;
}

export function avatarPublicPath(userId: string) {
  return `/uploads/${userId}/profile.png`;
}

function parseHttpOrigin(raw: string, label: string) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    throw new Error(`${label} 不是合法網址：${raw}`);
  }
}

function s3PublicBaseUrl() {
  const raw = env("S3_PUBLIC_BASE_URL");
  if (!raw) {
    throw new Error("S3_PUBLIC_BASE_URL 未設定（R2／S3 公開讀取網址）");
  }
  return parseHttpOrigin(raw, "S3_PUBLIC_BASE_URL");
}

export function avatarPublicUrl(userId: string) {
  return `${s3PublicBaseUrl()}/${avatarObjectKey(userId)}`;
}

function requireS3Env() {
  const bucket = env("S3_BUCKET");
  const rawEndpoint = env("S3_ENDPOINT");
  const accessKeyId = env("S3_ACCESS_KEY_ID");
  const secretAccessKey = env("S3_SECRET_ACCESS_KEY");
  if (!bucket || !rawEndpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3／R2 環境變數不完整（需 S3_BUCKET、S3_ENDPOINT、S3_ACCESS_KEY_ID、S3_SECRET_ACCESS_KEY）",
    );
  }

  return {
    bucket,
    endpoint: parseHttpOrigin(rawEndpoint, "S3_ENDPOINT"),
    accessKeyId,
    secretAccessKey,
  };
}

function accountIdFromEndpoint(endpoint: string) {
  // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  const host = new URL(endpoint).hostname;
  const id = host.split(".")[0];
  if (!id) throw new Error("無法從 S3_ENDPOINT 解析 Cloudflare Account ID");
  return id;
}

/** Cloudflare REST API（api.cloudflare.com）— 避開 Vercel→R2 S3 端點 SSL 問題 */
async function saveAvatarViaCloudflareApi(userId: string, png: Buffer) {
  const token = env("CLOUDFLARE_API_TOKEN");
  if (!token) {
    throw new Error("缺少 CLOUDFLARE_API_TOKEN（R2 建立權杖時的 cfat_ 值）");
  }

  const { bucket, endpoint } = requireS3Env();
  const accountId = env("CLOUDFLARE_ACCOUNT_ID") || accountIdFromEndpoint(endpoint);
  const key = avatarObjectKey(userId);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/png",
    },
    body: new Uint8Array(png),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 API 上傳失敗：HTTP ${res.status} ${body.slice(0, 300)}`);
  }

  return { publicPath: `${avatarPublicUrl(userId)}?v=${Date.now()}` };
}

/** S3 相容（本機可用；部分 Vercel 區對 *.r2.cloudflarestorage.com 會 SSL 失敗） */
async function saveAvatarViaS3Fetch(userId: string, png: Buffer) {
  const { bucket, endpoint, accessKeyId, secretAccessKey } = requireS3Env();
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: env("S3_REGION") || "auto",
  });
  const key = avatarObjectKey(userId);
  const url = `${endpoint}/${bucket}/${key}`;

  const put = await client.fetch(url, {
    method: "PUT",
    body: new Uint8Array(png),
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(`R2 S3 上傳失敗：HTTP ${put.status} ${body.slice(0, 200)}`);
  }

  return { publicPath: `${avatarPublicUrl(userId)}?v=${Date.now()}` };
}

async function saveAvatarS3(userId: string, png: Buffer) {
  // 正式環境優先走 Cloudflare API，避免 Vercel→R2 S3 TLS 握手失敗
  if (env("CLOUDFLARE_API_TOKEN")) {
    return saveAvatarViaCloudflareApi(userId, png);
  }
  return saveAvatarViaS3Fetch(userId, png);
}

/**
 * 上傳頭貼：轉成 profile.png，刪除舊檔，回傳公開路徑／URL。
 * 本機：uploads/{userId}/profile.png；正式：R2/S3 avatars/{userId}/profile.png
 */
export async function saveProfileAvatar(
  userId: string,
  input: Buffer,
): Promise<{ publicPath: string }> {
  const sharp = (await import("sharp")).default;
  const png = await sharp(input)
    .rotate()
    .resize(512, 512, { fit: "cover", position: "center" })
    .png({ compressionLevel: 8 })
    .toBuffer();

  if (getDriver() === "s3") {
    return saveAvatarS3(userId, png);
  }

  const { saveAvatarLocal } = await import("./avatar-local");
  return saveAvatarLocal(userId, png);
}

export async function readLocalAvatar(
  userId: string,
): Promise<Buffer | null> {
  const { readLocalAvatarFile } = await import("./avatar-local");
  return readLocalAvatarFile(userId);
}
