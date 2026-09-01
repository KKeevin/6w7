import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import {
  deletePublicObject,
  putPublicObject,
  stickerObjectKey,
} from "@/lib/storage/object-store";
import { AppError } from "@/shared/errors";
import { DEMO_MEDIA_TTL_MS } from "@/shared/demo-account";
import { getOrCreateDemoSandboxId } from "@/lib/demo-sandbox";
import {
  clampDemoStickerCount,
  demoAssetWhere,
  demoLibraryWhere,
  hydrateDemoSandboxOverlay,
  patchDemoSandboxOverlay,
} from "@/services/demo-sandbox.service";
import { ASK_LIMITS } from "@/shared/tools";
import type { PublicSticker } from "@/shared/page-stickers";
import type { z } from "zod";
import type { saveStickersSchema } from "@/shared/page-stickers";

const MAX_INPUT_PIXELS = 40_000_000;
const PURGE_THROTTLE_MS = 15_000;
const PURGE_BATCH = 50;

let lastPurgeAt = 0;

function liveMediaWhere() {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

function serializeSticker(row: {
  id: string;
  assetId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  asset: { url: string };
}): PublicSticker {
  return {
    id: row.id,
    assetId: row.assetId,
    url: row.asset.url,
    x: row.x,
    y: row.y,
    scale: row.scale,
    rotation: row.rotation,
    zIndex: row.zIndex,
  };
}

async function requireOwnerLink(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isDemo: true,
      status: true,
      askLink: { select: { id: true } },
    },
  });
  if (!user || user.status !== "active" || !user.askLink) {
    throw new AppError("NOT_FOUND", "找不到個人連結。", 404);
  }
  const sandboxId = user.isDemo ? await getOrCreateDemoSandboxId() : null;
  return { id: user.askLink.id, isDemo: user.isDemo, sandboxId };
}

function ownerAssetWhere(
  userId: string,
  sandboxId: string | null,
) {
  return sandboxId
    ? demoAssetWhere(userId, sandboxId)
    : { userId, sandboxId: null, ...liveMediaWhere() };
}

function ownerLibraryWhere(userId: string, sandboxId: string | null) {
  return sandboxId
    ? demoLibraryWhere(userId, sandboxId)
    : { userId, sandboxId: null, ...liveMediaWhere() };
}

/** 刪過期示範裝扮圖（儲存檔＋資料列；貼紙 CASCADE） */
export async function purgeExpiredDemoMedia(opts?: { force?: boolean }) {
  const now = Date.now();
  if (!opts?.force && now - lastPurgeAt < PURGE_THROTTLE_MS) {
    return { deleted: 0 };
  }
  lastPurgeAt = now;

  let deleted = 0;
  for (;;) {
    const expired = await prisma.mediaAsset.findMany({
      where: { expiresAt: { lte: new Date() } },
      select: { id: true, objectKey: true },
      take: PURGE_BATCH,
    });
    if (expired.length === 0) break;

    await prisma.mediaAsset.deleteMany({
      where: { id: { in: expired.map((asset) => asset.id) } },
    });

    await Promise.all(
      expired.map(async (asset) => {
        try {
          await deletePublicObject(asset.objectKey);
        } catch (error) {
          console.error("purge demo media object failed", asset.objectKey, error);
        }
      }),
    );

    deleted += expired.length;
    if (!opts?.force) break;
  }

  return { deleted };
}

export async function listMediaLibrary(userId: string) {
  const owner = await requireOwnerLink(userId);
  await purgeExpiredDemoMedia();
  const items = await prisma.mediaAsset.findMany({
    where: ownerLibraryWhere(userId, owner.sandboxId),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });
  return items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function uploadMediaAsset(userId: string, input: Buffer) {
  const owner = await requireOwnerLink(userId);
  await purgeExpiredDemoMedia();
  const count = await prisma.mediaAsset.count({
    where: ownerLibraryWhere(userId, owner.sandboxId),
  });
  if (count >= ASK_LIMITS.stickerLibraryMax) {
    throw new AppError(
      "VALIDATION_ERROR",
      `圖片庫最多 ${ASK_LIMITS.stickerLibraryMax} 張，請先刪掉不用的。`,
      400,
    );
  }

  let webp: Buffer;
  let width: number;
  let height: number;
  let outMeta: { width?: number; height?: number };
  try {
    const sharp = (await import("sharp")).default;
    const image = sharp(input, {
      failOn: "none",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).rotate();
    const meta = await image.metadata();
    width = meta.width || 1;
    height = meta.height || 1;
    const maxEdge = ASK_LIMITS.stickerMaxEdge;
    const resized =
      width > maxEdge || height > maxEdge
        ? image.resize({
            width: maxEdge,
            height: maxEdge,
            fit: "inside",
            withoutEnlargement: true,
          })
        : image;
    webp = await resized.webp({ quality: 82, effort: 4 }).toBuffer();
    outMeta = await sharp(webp).metadata();
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      "這張圖打不開，請改用 JPEG、PNG 或 WebP。",
      400,
    );
  }

  const fileId = randomUUID().replace(/-/g, "").slice(0, 16);
  const objectKey = stickerObjectKey(userId, fileId);
  const { publicUrl } = await putPublicObject(objectKey, webp, "image/webp");

  const asset = await prisma.mediaAsset.create({
    data: {
      userId,
      objectKey,
      url: publicUrl,
      width: outMeta.width || width,
      height: outMeta.height || height,
      bytes: webp.length,
      sandboxId: owner.sandboxId,
      expiresAt: owner.isDemo ? new Date(Date.now() + DEMO_MEDIA_TTL_MS) : null,
    },
    select: {
      id: true,
      url: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });

  return {
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  };
}

export async function deleteMediaAsset(userId: string, assetId: string) {
  const owner = await requireOwnerLink(userId);
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: assetId, ...ownerAssetWhere(userId, owner.sandboxId) },
  });
  if (!asset) {
    throw new AppError("NOT_FOUND", "找不到這張圖片。", 404);
  }
  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  if (owner.sandboxId) {
    const overlay = await hydrateDemoSandboxOverlay(userId, owner.sandboxId);
    await patchDemoSandboxOverlay(owner.sandboxId, {
      stickers: overlay.stickers.filter((item) => item.assetId !== asset.id),
    });
  }
  try {
    await deletePublicObject(asset.objectKey);
  } catch (error) {
    console.error("delete media object failed", asset.objectKey, error);
  }
  return { ok: true as const };
}

export async function listStickersForLink(linkId: string): Promise<PublicSticker[]> {
  await purgeExpiredDemoMedia();
  const rows = await prisma.pageSticker.findMany({
    where: { linkId, asset: liveMediaWhere() },
    orderBy: { zIndex: "asc" },
    include: { asset: { select: { url: true } } },
  });
  return rows.map(serializeSticker);
}

export async function listOwnerStickers(userId: string) {
  const owner = await requireOwnerLink(userId);
  const [library, stickers] = await Promise.all([
    listMediaLibrary(userId),
    owner.sandboxId
      ? hydrateDemoSandboxOverlay(userId, owner.sandboxId).then(
          (overlay) => overlay.stickers,
        )
      : listStickersForLink(owner.id),
  ]);
  return { library, stickers };
}

export async function addStickerFromAsset(userId: string, assetId: string) {
  const link = await requireOwnerLink(userId);
  await purgeExpiredDemoMedia();
  const asset = await prisma.mediaAsset.findFirst({
    where: { id: assetId, ...ownerAssetWhere(userId, link.sandboxId) },
    select: { id: true, url: true },
  });
  if (!asset) {
    throw new AppError("NOT_FOUND", "找不到這張圖片。", 404);
  }

  if (link.sandboxId) {
    const overlay = await hydrateDemoSandboxOverlay(userId, link.sandboxId);
    if (overlay.stickers.length >= ASK_LIMITS.stickerCanvasMax) {
      throw new AppError(
        "VALIDATION_ERROR",
        `畫面上最多 ${ASK_LIMITS.stickerCanvasMax} 張，先拿掉幾張再加。`,
        400,
      );
    }
    const jitter = () => (Math.random() - 0.5) * 12;
    const topZ = overlay.stickers.reduce(
      (max, item) => Math.max(max, item.zIndex),
      0,
    );
    const sticker: PublicSticker = {
      id: randomUUID().replace(/-/g, "").slice(0, 24),
      assetId: asset.id,
      url: asset.url,
      x: Math.min(82, Math.max(18, 50 + jitter())),
      y: Math.min(70, Math.max(16, 28 + jitter())),
      scale: 1,
      rotation: Math.round((Math.random() - 0.5) * 16),
      zIndex: topZ + 1,
    };
    await patchDemoSandboxOverlay(link.sandboxId, {
      stickers: clampDemoStickerCount([...overlay.stickers, sticker]),
    });
    return sticker;
  }

  const count = await prisma.pageSticker.count({
    where: { linkId: link.id, asset: liveMediaWhere() },
  });
  if (count >= ASK_LIMITS.stickerCanvasMax) {
    throw new AppError(
      "VALIDATION_ERROR",
      `畫面上最多 ${ASK_LIMITS.stickerCanvasMax} 張，先拿掉幾張再加。`,
      400,
    );
  }
  const top = await prisma.pageSticker.aggregate({
    where: { linkId: link.id, asset: liveMediaWhere() },
    _max: { zIndex: true },
  });
  const jitter = () => (Math.random() - 0.5) * 12;
  const row = await prisma.pageSticker.create({
    data: {
      linkId: link.id,
      assetId: asset.id,
      x: Math.min(82, Math.max(18, 50 + jitter())),
      y: Math.min(70, Math.max(16, 28 + jitter())),
      scale: 1,
      rotation: Math.round((Math.random() - 0.5) * 16),
      zIndex: (top._max.zIndex ?? 0) + 1,
    },
    include: { asset: { select: { url: true } } },
  });
  return serializeSticker(row);
}

export async function saveStickerLayout(
  userId: string,
  input: z.infer<typeof saveStickersSchema>,
) {
  const link = await requireOwnerLink(userId);
  await purgeExpiredDemoMedia();
  const assetIds = [...new Set(input.items.map((item) => item.assetId))];
  if (assetIds.length > 0) {
    const owned = await prisma.mediaAsset.findMany({
      where: {
        id: { in: assetIds },
        ...ownerAssetWhere(userId, link.sandboxId),
      },
      select: { id: true, url: true },
    });
    if (owned.length !== assetIds.length) {
      throw new AppError("FORBIDDEN", "只能使用自己圖庫裡的圖片。", 403);
    }

    if (link.sandboxId) {
      const urlById = new Map(owned.map((row) => [row.id, row.url]));
      const stickers: PublicSticker[] = input.items.map((item, index) => ({
        id: item.id || randomUUID().replace(/-/g, "").slice(0, 24),
        assetId: item.assetId,
        url: urlById.get(item.assetId) as string,
        x: item.x,
        y: item.y,
        scale: item.scale,
        rotation: item.rotation,
        zIndex: item.zIndex || index + 1,
      }));
      const overlay = await patchDemoSandboxOverlay(link.sandboxId, {
        stickers: clampDemoStickerCount(stickers),
      });
      return overlay.stickers;
    }
  } else if (link.sandboxId) {
    const overlay = await patchDemoSandboxOverlay(link.sandboxId, {
      stickers: [],
    });
    return overlay.stickers;
  }

  const existing = await prisma.pageSticker.findMany({
    where: { linkId: link.id },
    select: { id: true },
  });
  const keepIds = new Set(
    input.items.map((item) => item.id).filter(Boolean) as string[],
  );
  const toDelete = existing.filter((row) => !keepIds.has(row.id)).map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.pageSticker.deleteMany({
        where: { id: { in: toDelete }, linkId: link.id },
      });
    }
    for (const [index, item] of input.items.entries()) {
      const data = {
        x: item.x,
        y: item.y,
        scale: item.scale,
        rotation: item.rotation,
        zIndex: item.zIndex || index + 1,
        assetId: item.assetId,
      };
      if (item.id && keepIds.has(item.id)) {
        const updated = await tx.pageSticker.updateMany({
          where: { id: item.id, linkId: link.id },
          data,
        });
        if (updated.count === 0) {
          await tx.pageSticker.create({
            data: { linkId: link.id, ...data },
          });
        }
      } else {
        await tx.pageSticker.create({
          data: { linkId: link.id, ...data },
        });
      }
    }
  });

  return listStickersForLink(link.id);
}
