import type { Metadata } from "next";
import { GameClient } from "@/components/game/game-client";

export const metadata: Metadata = {
  title: "熊熊小日子・遊戲封測",
  description: "6w7 的角色小屋與多人冒險試玩。捏一隻喜歡的角色，邀朋友來散步。",
  robots: { index: false, follow: false },
};
export default async function PlayPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  return <GameClient invitation={room ?? null}
    onlineEnabled={process.env.GAME_ENABLED === "true"}
    endpoint={process.env.GAME_PUBLIC_SERVER_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:2567" : "")}
    needsCode={Boolean(process.env.GAME_PILOT_CODE) || process.env.NODE_ENV === "production"} />;
}
