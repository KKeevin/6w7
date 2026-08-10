import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "服務條款",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        服務條款
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">最後更新：2026-08-06 · 簡版</p>
      <div className="mt-8 space-y-6 text-[var(--muted)] leading-relaxed">
        <p>
          使用 6w7（樂玩ㄑ）即表示你同意以合法、尊重他人的方式使用本服務。匿名問答連結的主人可關閉收件、刪除留言並檢舉不當內容。
        </p>
        <p>
          禁止發布涉及未成年人色情、仇恨、威脅、騷擾、詐騙或其他違法內容。我們可能限流、隱藏、刪除內容或停權帳號。
        </p>
        <p>
          匿名並不代表可以傷害他人。系統為防濫用可能保留必要技術資料；請勿誤導他人「完全無法被追蹤任何濫用資訊」。
        </p>
        <p>條款將隨產品更新調整；重大變更會再於本頁標註。</p>
      </div>
    </main>
  );
}
