import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { listInbox } from "@/services/message.service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") as
      | "unread"
      | "featured"
      | "archived"
      | "all"
      | null;
    const linkId = searchParams.get("linkId") || undefined;
    const pageRaw = Number(searchParams.get("page"));
    const page = Number.isFinite(pageRaw) ? pageRaw : 1;
    const result = await listInbox(userId, {
      filter: filter || "all",
      linkId,
      page,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
