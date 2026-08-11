import fs from "fs/promises";
import path from "path";

/** 鎖定在 public/uploads，避免 Next 建置追蹤整個專案目錄 */
function userDir(userId: string) {
  return path.join(process.cwd(), "public", "uploads", userId);
}

function publicPath(userId: string) {
  return `/uploads/${userId}/profile.png`;
}

async function ensureUserDir(userId: string) {
  const dir = userDir(userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function clearOldAvatarsLocal(userId: string) {
  const dir = userDir(userId);
  try {
    const files = await fs.readdir(dir);
    await Promise.all(
      files
        .filter((f) => /^profile\./i.test(f))
        .map((f) =>
          fs.unlink(path.join(dir, f)).catch(() => undefined),
        ),
    );
  } catch {
    // 目錄尚不存在
  }
}

export async function saveAvatarLocal(userId: string, png: Buffer) {
  await ensureUserDir(userId);
  await clearOldAvatarsLocal(userId);
  const filePath = path.join(userDir(userId), "profile.png");
  await fs.writeFile(filePath, png);
  return { publicPath: `${publicPath(userId)}?v=${Date.now()}` };
}

export async function readLocalAvatarFile(
  userId: string,
): Promise<Buffer | null> {
  const filePath = path.join(userDir(userId), "profile.png");
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}
