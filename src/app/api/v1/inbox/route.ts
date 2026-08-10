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
    const messages = await listInbox(userId, {
      filter: filter || "all",
      linkId,
    });
    return jsonOk({ messages });
  } catch (error) {
    return jsonError(error);
  }
}
