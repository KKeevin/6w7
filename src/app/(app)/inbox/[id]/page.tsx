import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { loginPath } from "@/shared/paths";

type Props = { params: Promise<{ id: string }> };

/** 示範／正式都走收件匣列表＋圖卡，不再開獨立文章頁 */
export default async function InboxMessagePage({ params }: Props) {
  await params;
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/inbox"));
  }
  redirect("/inbox");
}
