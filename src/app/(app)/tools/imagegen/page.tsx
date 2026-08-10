import { redirect } from "next/navigation";

/** 未上線工具不對外露出 */
export default function ImageGenToolPage() {
  redirect("/");
}
