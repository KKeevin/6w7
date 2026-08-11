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

function getR2Client() {
  const { accessKeyId, secretAccessKey } = requireS3Env();
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: env("S3_REGION") || "auto",
  });
}

/** 用 fetch + SigV4 上傳，避免 Vercel 上 AWS SDK Node HTTPS 對 R2 握手失敗 */
async function saveAvatarS3(userId: string, png: Buffer) {
  const { bucket, endpoint } = requireS3Env();
  const client = getR2Client();
  const key = avatarObjectKey(userId);
  const url = `${endpoint}/${bucket}/${key}`;

  const put = await client.fetch(url, {
    method: "PUT",
    body: png,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });

  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(`R2 上傳失敗：HTTP ${put.status} ${body.slice(0, 200)}`);
  }

  return { publicPath: `${avatarPublicUrl(userId)}?v=${Date.now()}` };
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
