import { requireUserId } from "@/lib/api";
import { getNotificationSummary } from "@/services/notification.service";
import { errorBody, AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Vercel serverless 上限；斷線後客戶端改輪詢 summary */
export const maxDuration = 60;

/**
 * GET /api/v1/notifications/stream
 * SSE：近即時推送未讀摘要；App 可改輪詢 summary。
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const encoder = new TextEncoder();
    let lastCount = -1;
    let lastId: string | null = null;
    let closed = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      closed = true;
      if (interval) clearInterval(interval);
      if (ping) clearInterval(ping);
    };

    const stream = new ReadableStream({
      start(controller) {
        const send = (payload: unknown) => {
          if (closed) return;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        const tick = async () => {
          if (closed) return;
          const summary = await getNotificationSummary(userId);
          const changed =
            summary.unreadCount !== lastCount || summary.latestId !== lastId;
          if (!changed) return;

          const isNewArrival =
            lastCount >= 0 &&
            (summary.unreadCount > lastCount ||
              (Boolean(summary.latestId) &&
                summary.latestId !== lastId &&
                summary.unreadCount > 0));

          send({
            type: "summary",
            isNewArrival,
            summary,
          });
          lastCount = summary.unreadCount;
          lastId = summary.latestId;
        };

        void tick().catch(() => {
          /* ignore first tick errors mid-stream */
        });

        interval = setInterval(() => {
          void tick().catch(() => {
            /* keep stream alive */
          });
        }, 2500);

        ping = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            cleanup();
          }
        }, 15000);

        const onAbort = () => {
          cleanup();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };

        request.signal.addEventListener("abort", onAbort);
      },
      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(errorBody(error), { status: error.status });
    }
    return Response.json(
      errorBody(new AppError("INTERNAL", "串流失敗", 500)),
      { status: 500 },
    );
  }
}
