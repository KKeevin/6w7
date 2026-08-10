import { jsonError, jsonOk, requireUserId } from "@/lib/api";
import { getNotificationSummary } from "@/services/notification.service";

/** GET /api/v1/notifications/summary — 未讀數摘要（App 可輪詢） */
export async function GET() {
  try {
    const userId = await requireUserId();
    const summary = await getNotificationSummary(userId);
    return jsonOk({ summary });
  } catch (error) {
    return jsonError(error);
  }
}
