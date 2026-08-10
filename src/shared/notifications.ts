/** 通知摘要 DTO（Web toast／角標／未來 App 共用；不含留言全文） */
export type NotificationSummary = {
  unreadCount: number;
  latestId: string | null;
  latestAt: string | null;
  latestTopic: string | null;
};
