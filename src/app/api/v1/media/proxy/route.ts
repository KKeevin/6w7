import { NextResponse } from "next/server";
import { AppError, errorBody } from "@/shared/errors";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function allowedBases(): string[] {
  const bases = [
    process.env.S3_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .map((b) => {
      try {
        let v = b!.trim().replace(/\/$/, "");
        if (!/^https?:\/\//i.test(v)) {
          if (/^https[^:/]/i.test(v)) v = `https://${v.slice(5)}`;
          else if (/^http[^:/]/i.test(v)) v = `http://${v.slice(4)}`;
          else v = `https://${v}`;
        }
        return new URL(v).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as string[];

  // 常見 R2 公開網域後綴
  return [...new Set(bases)];
}

function isAllowed(url: URL) {
  const bases = allowedBases();
  if (bases.some((b) => url.origin === b)) return true;
  // 允許 *.r2.dev 公開開發網域
  if (url.hostname.endsWith(".r2.dev")) return true;
  return false;
}

async function readImageBody(response: Response): Promise<ArrayBuffer> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new AppError("BAD_REQUEST", "圖片檔案過大", 400);
  }

  if (!response.body) return new ArrayBuffer(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new AppError("BAD_REQUEST", "圖片檔案過大", 400);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

/**
 * GET /api/v1/media/proxy?url=
 * 同源轉送允許的公開圖（供限動圖卡 html-to-image，避開 R2 CORS）
 */
export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("url");
    if (!raw) {
      throw new AppError("BAD_REQUEST", "缺少 url", 400);
    }

    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      throw new AppError("BAD_REQUEST", "url 無效", 400);
    }

    if (!["http:", "https:"].includes(target.protocol) || !isAllowed(target)) {
      throw new AppError("FORBIDDEN", "不允許的圖片來源", 403);
    }

    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*" },
      cache: "force-cache",
    });
    if (!upstream.ok) {
      throw new AppError("NOT_FOUND", "找不到圖片", 404);
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      throw new AppError("BAD_REQUEST", "不是圖片", 400);
    }

    const buffer = await readImageBody(upstream);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(errorBody(error), { status: error.status });
    }
    return NextResponse.json(
      errorBody(new AppError("INTERNAL", "代理失敗", 500)),
      { status: 500 },
    );
  }
}
