import { redirect } from "next/navigation";

/** 引導到建立連結流程，不展示工具目錄 */
export default function AskToolPage() {
  redirect("/dashboard");
}
