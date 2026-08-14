import Link from "next/link";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";

/** 登入後功能頁旁的固定說明，避免廣告只出現在空白工具殼 */
export function LoggedInPublisherNote({
  page,
}: {
  page: "dashboard" | "inbox";
}) {
  return (
    <section className="mt-10 max-w-2xl space-y-3 border-t border-[var(--line)] pt-8 text-sm leading-relaxed text-[var(--muted)]">
      <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
        {page === "dashboard" ? "短網址頁在做什麼" : "收件匣在做什麼"}
      </h2>
      {page === "dashboard" ? (
        <>
          <p>
            這頁讓你管理 {BRAND.en}{" "}
            專屬連結：複製網址、調整提示與頭貼、開關收件。訪客打開連結後寫下的話，只會出現在你的收件匣。主題標籤（若有設定）會跟留言一起進來，方便之後篩選。
          </p>
          <p>
            還沒註冊、想先看完整問答長什麼樣，可逛{" "}
            <Link
              href={DEMO_PROFILE.inboxPath}
              className="font-semibold text-[var(--ink)] underline"
            >
              公開示範收件匣
            </Link>
            ，那裡的範例全文不用登入。
          </p>
        </>
      ) : (
        <>
          <p>
            收件匣是給連結主人讀匿名留言的地方。你可以標已讀、精選、封存、刪除或檢舉，也可以產限動圖卡。未讀預設先不展開內文，是為了保護你在公共場合打開時的隱私；示範帳號則把範例全文直接寫在網頁上，方便了解產品。
          </p>
          <p>
            想先瀏覽不必登入的問答，請到{" "}
            <Link
              href={DEMO_PROFILE.inboxPath}
              className="font-semibold text-[var(--ink)] underline"
            >
              {BRAND.en} 示範收件匣
            </Link>
            。
          </p>
        </>
      )}
    </section>
  );
}
