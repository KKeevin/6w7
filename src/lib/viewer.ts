import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type MemberUser = {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
  isDemo: boolean;
};

export type Viewer =
  | { kind: "user"; user: MemberUser }
  | { kind: "demo"; user: MemberUser }
  | { kind: "guest" };

export const getViewer = cache(async (): Promise<Viewer> => {
  const session = await auth();
  if (!session?.user?.id) return { kind: "guest" };

  // 與 API 的授權規則一致：已停權或已刪除帳號的舊 JWT 不可繼續進入會員頁。
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!account || account.status !== "active") return { kind: "guest" };

  const user: MemberUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    image: session.user.image,
    isDemo: Boolean(session.user.isDemo),
  };

  if (user.isDemo) return { kind: "demo", user };
  return { kind: "user", user };
});

export function isMemberViewer(viewer: Viewer) {
  return viewer.kind === "user" || viewer.kind === "demo";
}
