import { redirect } from "next/navigation";

/** MVP 不對外露出工具目錄 */
export default function ToolsPage() {
  redirect("/");
}
