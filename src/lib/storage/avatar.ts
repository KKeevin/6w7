import fs from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

export type StorageDriver = "local" | "s3";

function getDriver(): StorageDriver {
  const d = process.env.STORAGE_DRIVER || "local";
  return d === "s3" ? "s3" : "local";
}

function localRoot() {
  // 本機預設寫入 public/uploads，可被靜態提供；正式環境改 S3/R2
  return (
    process.env.UPLOAD_ROOT ||
    path.join(process.cwd(), "public", "uploads")
  );
}

/** 正式環境 S3/R2 key：avatars/{userId}/profile.png */
export function avatarObjectKey(userId: string) {
  return `avatars/${userId}/profile.png`;
}

export function avatarPublicPath(userId: string) {
  return `/uploads/${userId}/profile.png`;
}

function s3PublicBaseUrl() {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error("S3_PUBLIC_BASE_URL 未設定（R2／S3 公開讀取網址）");
  }
  return base;
}

export function avatarPublicUrl(userId: string) {
  return `${s3PublicBaseUrl()}/${avatarObjectKey(userId)}`;
}

function requireS3Env() {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3／R2 環境變數不完整（需 S3_BUCKET、S3_ENDPOINT、S3_ACCESS_KEY_ID、S3_SECRET_ACCESS_KEY）",
    );
  }
  return { bucket, endpoint, accessKeyId, secretAccessKey };
}

let s3Client: S3Client | undefined;

function getS3Client() {
  if (s3Client) return s3Client;
  const { endpoint, accessKeyId, secretAccessKey } = requireS3Env();
  s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return s3Client;
}

async function ensureUserDir(userId: string) {
  const dir = path.join(localRoot(), userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** 刪除該會員目錄下所有舊頭貼檔（profile.*） */
async function clearOldAvatarsLocal(userId: string) {
  const dir = path.join(localRoot(), userId);
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((f) => /^profile\./i.test(f))
        .map((f) => fs.unlink(path.join(dir, f)).catch(() => undefined)),
    );
  } catch {
    // 目錄尚不存在
  }
}

async function saveAvatarS3(userId: string, png: Buffer) {
  const { bucket } = requireS3Env();
  const client = getS3Client();
  const key = avatarObjectKey(userId);

  // 覆蓋同 key；先刪再寫，避免留下舊 content-type／殘檔
  await client
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch(() => undefined);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: png,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { publicPath: `${avatarPublicUrl(userId)}?v=${Date.now()}` };
}

async function saveAvatarLocal(userId: string, png: Buffer) {
  await ensureUserDir(userId);
  await clearOldAvatarsLocal(userId);
  const filePath = path.join(localRoot(), userId, "profile.png");
  await fs.writeFile(filePath, png);
  return { publicPath: `${avatarPublicPath(userId)}?v=${Date.now()}` };
}

/**
 * 上傳頭貼：轉成 profile.png，刪除舊檔，回傳公開路徑／URL。
 * 本機：uploads/{userId}/profile.png；正式：R2/S3 avatars/{userId}/profile.png
 */
export async function saveProfileAvatar(
  userId: string,
  input: Buffer,
): Promise<{ publicPath: string }> {
  const png = await sharp(input)
    .rotate()
    .resize(512, 512, { fit: "cover", position: "center" })
    .png({ quality: 90 })
    .toBuffer();

  if (getDriver() === "s3") {
    return saveAvatarS3(userId, png);
  }

  return saveAvatarLocal(userId, png);
}

export async function readLocalAvatar(
  userId: string,
): Promise<Buffer | null> {
  const filePath = path.join(localRoot(), userId, "profile.png");
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
