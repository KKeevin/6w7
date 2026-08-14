import { auth } from "@/lib/auth";

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

export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "guest" };

  const user: MemberUser = {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    image: session.user.image,
    isDemo: Boolean(session.user.isDemo),
  };

  if (user.isDemo) return { kind: "demo", user };
  return { kind: "user", user };
}

export function isMemberViewer(viewer: Viewer) {
  return viewer.kind === "user" || viewer.kind === "demo";
}
