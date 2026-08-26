import { AwsClient } from "aws4fetch";

type StorageDriver = "local" | "s3";

function env(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "") || undefined;
}

function getDriver(): StorageDriver {
  const d = env("STORAGE_DRIVER") || "local";
  return d === "s3" ? "s3" : "local";
}

function parseHttpOrigin(raw: string, label: string) {
  let value = raw.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(value)) {
    if (/^https[^:/]/i.test(value)) {
      value = `https://${value.slice(5)}`;
    } else if (/^http[^:/]/i.test(value)) {
      value = `http://${value.slice(4)}`;
    } else {
      value = `https://${value}`;
    }
  }
  try {
    return new URL(value).origin;
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
  const host = new URL(endpoint).hostname;
  const id = host.split(".")[0];
  if (!id) throw new Error("無法從 S3_ENDPOINT 解析 Cloudflare Account ID");
  return id;
}

export function stickerObjectKey(userId: string, fileId: string) {
  return `stickers/${userId}/${fileId}.webp`;
}

export function stickerLocalPublicPath(userId: string, fileId: string) {
  return `/uploads/${userId}/stickers/${fileId}.webp`;
}

export function publicUrlForKey(key: string) {
  if (getDriver() === "s3") {
    return `${s3PublicBaseUrl()}/${key}`;
  }
  const parts = key.split("/");
  if (parts[0] === "stickers" && parts.length >= 3) {
    return `/uploads/${parts[1]}/stickers/${parts.slice(2).join("/")}`;
  }
  return `/uploads/${key}`;
}

async function putViaCloudflareApi(
  key: string,
  data: Buffer,
  contentType: string,
) {
  const token = env("CLOUDFLARE_API_TOKEN");
  if (!token) {
    throw new Error("缺少 CLOUDFLARE_API_TOKEN（R2 建立權杖時的 cfat_ 值）");
  }
  const { bucket, endpoint } = requireS3Env();
  const accountId = env("CLOUDFLARE_ACCOUNT_ID") || accountIdFromEndpoint(endpoint);
  const keyPath = key.split("/").map(encodeURIComponent).join("/");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${keyPath}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(data),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`R2 API 上傳失敗：HTTP ${res.status} ${body.slice(0, 300)}`);
  }
}

async function deleteViaCloudflareApi(key: string) {
  const token = env("CLOUDFLARE_API_TOKEN");
  if (!token) return;
  const { bucket, endpoint } = requireS3Env();
  const accountId = env("CLOUDFLARE_ACCOUNT_ID") || accountIdFromEndpoint(endpoint);
  const keyPath = key.split("/").map(encodeURIComponent).join("/");
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${keyPath}`;
  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}

async function putViaS3(key: string, data: Buffer, contentType: string) {
  const { bucket, endpoint, accessKeyId, secretAccessKey } = requireS3Env();
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: env("S3_REGION") || "auto",
  });
  const url = `${endpoint}/${bucket}/${key}`;
  const put = await client.fetch(url, {
    method: "PUT",
    body: new Uint8Array(data),
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  if (!put.ok) {
    const body = await put.text().catch(() => "");
    throw new Error(`R2 S3 上傳失敗：HTTP ${put.status} ${body.slice(0, 200)}`);
  }
}

async function deleteViaS3(key: string) {
  const { bucket, endpoint, accessKeyId, secretAccessKey } = requireS3Env();
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: env("S3_REGION") || "auto",
  });
  const url = `${endpoint}/${bucket}/${key}`;
  await client.fetch(url, { method: "DELETE" }).catch(() => undefined);
}

export async function putPublicObject(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<{ publicUrl: string }> {
  if (getDriver() === "s3") {
    if (env("CLOUDFLARE_API_TOKEN")) {
      await putViaCloudflareApi(key, data, contentType);
    } else {
      await putViaS3(key, data, contentType);
    }
    return { publicUrl: `${s3PublicBaseUrl()}/${key}?v=${Date.now()}` };
  }
  const { saveObjectLocal } = await import("./object-store-local");
  return saveObjectLocal(key, data);
}

export async function deletePublicObject(key: string) {
  if (getDriver() === "s3") {
    if (env("CLOUDFLARE_API_TOKEN")) {
      await deleteViaCloudflareApi(key);
    } else {
      await deleteViaS3(key);
    }
    return;
  }
  const { deleteObjectLocal } = await import("./object-store-local");
  await deleteObjectLocal(key);
}
