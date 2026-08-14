import { BrandLogo } from "@/components/brand-logo";
import { BRAND } from "@/shared/tools";

/** 公開留言頁：原創說明文字，讓頁面不只是表單（AdSense 內容標準） */
export function PublicAskExplainer() {
  return (
    <section className="space-y-4 border-t border-[var(--line)] pt-8 text-left text-sm leading-relaxed text-[var(--muted)]">
      <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
        這是什麼？
      </h2>
      <p>
        {BRAND.en}（{BRAND.zh}）是一個匿名留言連結。你打開的這頁屬於某個已註冊使用者：上方是對方的頭貼與提示，下方可以寫一句話送出。畫面上不會出現你的名字、帳號或聯絡方式；對方只會在自己的收件匣看到內容。適合想問、想說、又不想在公開留言區被大家圍觀的時候用。
      </p>
      <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
        送出之後會怎樣？
      </h2>
      <p>
        留言會進到這個連結主人的 6w7 收件匣。主人可以閱讀、標已讀、封存、刪除或檢舉，也可以暫時關閉收件。若對方已關閉收件，送出時會看到無法留言的提示。系統為了限流與處理濫用，可能保留經過雜湊的技術資料，但不會把訪客身分顯示給主人看。
      </p>
      <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--ink)]">
        使用時請注意
      </h2>
      <p>
        請不要傳送違法、威脅、仇恨、涉及未成年人的不當內容，或惡意騷擾。若內容不當，主人與平台都可能處理或檢舉。匿名對主人顯示，不代表可以無視法律或他人界線。想了解我們蒐集哪些資料、廣告出現在哪些頁面，請看{" "}
        <a href="/legal/privacy" className="underline hover:text-[var(--ink)]">
          隱私權政策
        </a>
        與{" "}
        <a href="/about" className="underline hover:text-[var(--ink)]">
          關於 {BRAND.en}
        </a>
        。
      </p>
      <div className="flex items-center gap-2 pt-1">
        <BrandLogo height={22} />
        <span className="text-xs font-medium">
          {BRAND.en}（{BRAND.zh}）
        </span>
      </div>
    </section>
  );
}
