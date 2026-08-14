import type { Metadata } from "next";
import Link from "next/link";
import { AdRailLayout } from "@/components/ads/ad-rail-layout";
import { BrandLogo } from "@/components/brand-logo";
import { SHELL_CONTENT } from "@/shared/shell";
import { BRAND } from "@/shared/tools";

export const metadata: Metadata = {
  title: `關於 ${BRAND.en}`,
  description: `${BRAND.en}（${BRAND.zh}）用專屬短連結收下匿名留言；主人可封鎖、檢舉與關閉收件。`,
};

export default function AboutPage() {
  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <AdRailLayout width="narrow">
        <article
          className={`${SHELL_CONTENT} w-full space-y-5 text-[var(--muted)] leading-relaxed`}
        >
          <BrandLogo height={36} />
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
            關於 {BRAND.en}（{BRAND.zh}）
          </h1>
          <p>
            {BRAND.en} 是把好玩、好用的小工具收成一個連結入口的平台。第一版專注一件事：讓你用 Instagram
            風格的帳號註冊後，立刻得到固定短網址{" "}
            <span className="font-mono text-[var(--ink)]">
              {BRAND.domain}/你的帳號
            </span>
            。把連結分享到限動或聊天室，朋友不必註冊就能留下一句話；內容只會出現在你的收件匣，不會在公開牆上預設全開。
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            怎麼開始
          </h2>
          <p>
            到首頁用帳號註冊或登入，可上傳大頭貼，並寫一句提示（像 bio，之後改新的就會覆蓋舊的）。專屬連結固定是你的使用者名稱，不必再記一組隨機代碼。複製短網址，或用分享頁把限動圖卡傳到 Instagram。訪客打開連結後看到你的頭貼與提示，選主題（若你有設定）再送出留言。
          </p>
          <p>
            你在收件匣閱讀、標已讀、封存、刪除或檢舉。暫時不想收件時，可以關閉接受留言。這些控制權都在帳號本人手上，訪客無法替你開關。
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            匿名是什麼意思
          </h2>
          <p>
            「匿名」是指主人畫面上看不到訪客是誰。這不表示系統完全沒有防濫用手段。為了限流、偵測惡意灌水和處理檢舉，伺服器可能保存雜湊後的技術資料（例如與 IP、裝置相關的雜湊），不會把明文 IP 拿來展示，也不會把訪客身分公開給連結主人。
          </p>
          <p>
            請勿傳送違法、仇恨、威脅，或涉及未成年人的不當內容。主人可以刪除與檢舉；平台也可以依條款處理帳號或留言。自願、可封鎖、可檢舉、主人可控，是我們對私密功能的基本態度。
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            公開示範帳號
          </h2>
          <p>
            真實收件匣、短網址與帳號設定只有登入後看得到。想先逛逛，請到{" "}
            <Link href="/login" className="underline hover:text-[var(--ink)]">
              登入頁
            </Link>
            按「用示範帳號登入」（@lewanq）。示範帳號可隨時登出，再註冊屬於你的帳號。公開留言頁{" "}
            <Link href="/lewanq" className="underline hover:text-[var(--ink)]">
              6w7.link/lewanq
            </Link>{" "}
            不必登入，任何人都能留下一句話。
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            資料與廣告
          </h2>
          <p>
            我們採最小蒐集：帳號、連結設定與留言是服務所需。刪帳號時會依流程刪除或匿名化相關資料。細節見{" "}
            <Link href="/legal/privacy" className="underline hover:text-[var(--ink)]">
              隱私權政策
            </Link>
            與{" "}
            <Link href="/legal/terms" className="underline hover:text-[var(--ink)]">
              服務條款
            </Link>
            。
          </p>
          <p>
            部分有說明文字的頁面可能顯示由 Google AdSense 提供的廣告，例如本頁、隱私權政策、服務條款、帶使用說明的留言頁、公開示範帳號，以及登入後附說明的短網址與收件匣。登入、註冊、帳號設定與錯誤頁不會放送廣告。廣告夥伴可能使用
            Cookie；你可透過瀏覽器或廣告網路提供的退出方式管理偏好。
          </p>
          <h2 className="font-[family-name:var(--font-display)] pt-2 text-xl font-bold text-[var(--ink)]">
            品牌
          </h2>
          <p>
            中文名「樂玩ㄑ」：樂是開心、玩是好玩；ㄑ是注音符號，呼應英文裡 w／七（q）的俏皮寫法，念法接近「樂玩七」。我們不做陰暗、獵奇或鼓吹傷害他人的調性。長期會做成多工具入口；目前對外只提供匿名問答，未上線的功能不會拿來佔版面。
          </p>
          <p>
            對外網域是{" "}
            <a
              href={`https://${BRAND.domain}`}
              className="underline hover:text-[var(--ink)]"
            >
              {BRAND.domain}
            </a>
            。想開始用，從{" "}
            <Link href="/" className="underline hover:text-[var(--ink)]">
              首頁
            </Link>
            註冊即可立刻拿到自己的連結。
          </p>
        </article>
      </AdRailLayout>
    </main>
  );
}
