import fs from "fs/promises";
import path from "path";

/** stickers/{userId}/{file} → public/uploads/{userId}/stickers/{file} */
function localPathFromKey(key: string) {
  const parts = key.split("/");
  if (parts[0] === "stickers" && parts.length >= 3) {
    const userId = parts[1];
    const file = parts.slice(2).join("/");
    return path.join(
      process.cwd(),
      "public",
      "uploads",
      userId,
      "stickers",
      file,
    );
  }
  return path.join(process.cwd(), "public", "uploads", key);
}

function publicPathFromKey(key: string) {
  const parts = key.split("/");
  if (parts[0] === "stickers" && parts.length >= 3) {
    const userId = parts[1];
    const file = parts.slice(2).join("/");
    return `/uploads/${userId}/stickers/${file}`;
  }
  return `/uploads/${key}`;
}

export async function saveObjectLocal(key: string, data: Buffer) {
  const filePath = localPathFromKey(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
  return { publicUrl: `${publicPathFromKey(key)}?v=${Date.now()}` };
}

export async function deleteObjectLocal(key: string) {
  const filePath = localPathFromKey(key);
  await fs.unlink(filePath).catch(() => undefined);
}
