# 6w7（樂玩ㄑ）— AI 代寫準則與產品規格

> **給之後所有 AI／開發者：** 開專案、寫功能、重構、加工具前，**必須先讀完本檔並遵守**。  
> 本檔是單一真相來源（source of truth）。若實作與本檔衝突，以本檔為準；若要改規格，先更新本檔再改程式。

**最後更新：** 2026-08-24（註冊先帳密進站；信箱在設定頁綁定並驗證）  
**網域：** https://6w7.link  
**品牌英文：** 6w7  
**品牌中文：** 樂玩ㄑ  
**產品定位：** 多工具平台（長期）；**第一版對外只做匿名問答連結**，未上線工具不對使用者展示。

---

## 1. 產品願景

### 1.1 一句話

**6w7（樂玩ㄑ）** 想把好玩的小工具收成一個連結入口，調性走輕鬆幽默、派對玩樂。第一版先專注「產生專屬短連結 → 社群分享 → 收匿名提問」；其他工具等真正上線再對外露出。

### 1.2 品牌語氣

- 年輕、有梗、好記；中文名「樂玩ㄑ」可與正式名「6w7」並用。
- 對外寫法建議：`6w7（樂玩ㄑ）`。
- 「樂玩ㄑ」：6＝樂、w＝玩、ㄑ為注音（形近 7，也作「去」），合起來是「開心玩樂去」。念法接近「樂玩七」或「樂玩去」。
- 英文 6w7 呼應 six seven 迷因：像一個人左手一個 6、右手一個 7。
- 品牌路線是輕鬆幽默、派對玩樂；不要做成陰暗、獵奇、鼓吹傷害他人的調性。
- 私密／匿名相關文案強調「自願、可封鎖、可檢舉、主人可控」。
- 舊名 6yx／六歪叉／6yx.link **已停用**，文案與連結一律改用新品牌。

### 1.3 與 NGL 的關係（重要：必須差異化）

第一版功能概念接近「產生連結 → 社群分享 → 收匿名留言」，**可以參考體驗流程，但禁止複製 NGL 的品牌、文案、視覺、互動細節或獨特文案句式**。

**必須做出差異（至少落實下列多數項）：**

| 面向 | 6w7 做法（差異化） |
|------|-------------------|
| 品牌 | 僅使用 6w7／樂玩ㄑ；禁止 NGL 字樣、相似 logo、仿冒配色與版面 |
| 平台定位 | 長期為多工具；**MVP 對外只呈現匿名問答**，不曝光「即將推出」占位工具 |
| 連結體驗 | 自有短網域 `6w7.link`；首頁引導快速註冊 → 立刻建立項目 → 取得專屬連結 |
| 收件體驗 | 強調「主題／問題提示」「分類或標籤」「主人可設定收件規則」等，勿 1:1 抄 NGL UI |
| 回覆方式 | 可設計「精選公開牆」「一鍵複製回覆圖卡」「限動模板」等自有玩法（實作可分期） |
| 安全 | 預設更強的限流、敏感詞、檢舉、封鎖、未成年保護（見 §7） |
| 後續 | 同一帳號可通往 AI 產圖、換臉等；NGL 式純匿名產品沒有這層平台感 |

**禁止：**

- 複製 NGL 的註冊／引導文案、按鈕用詞、顏色體系、插畫風格。
- 對外宣傳自稱「NGL 替代品／NGL 山寨／NGL 繁中版」等（可用「匿名留言連結」描述功能）。
- 使用易混淆的產品名（如 NGLink、Similar to NGL 當正式名）。

---

## 2. 技術棧（必須遵守）

### 2.1 現行鎖定（第一版 Web）

| 層 | 技術 | 備註 |
|----|------|------|
| 執行環境 | Node.js（LTS） | 專案需標明引擎版本 |
| 語言 | **TypeScript**（strict） | 禁止新增值的無類型 JS（設定檔除外） |
| 框架 | **Next.js（App Router）** | 全端；前後端同 repo |
| UI | **Tailwind CSS + shadcn/ui** | 組件優先復用；避免亂加 UI 套件 |
| 資料庫 | **PostgreSQL** | 本機／正式皆 Postgres（Neon 開發分支或 Docker）；勿再用 SQLite |
| ORM | **Prisma**（或經核准改 Drizzle） | schema 變更必須 migration；正式 `prisma migrate deploy` |
| 認證 | **Auth.js（NextAuth）** 優先；亦可 **Clerk** | 必須可擴充到 App（見 §2.3） |
| 限流／快取 | **Upstash Redis**（或同等 Redis） | 匿名留言、登入、API 皆需限流；正式必設 |
| 物件儲存 | **Cloudflare R2**（S3 相容） | 頭貼；本機可 `STORAGE_DRIVER=local` |
| 託管（建議） | **Vercel** + **Neon** + **Upstash** + **R2** | 可改，但需同等能力；步驟見 README |
| 套件管理 | **npm**（鎖定 `package-lock.json`） | 勿混用 pnpm／yarn |
| 測試（應逐步補） | Vitest + Playwright（建議） | 核心 API／檢舉／限流要有測試 |

### 2.2 明確不採用（第一版）

- 不要一開始就拆成獨立 Nest／Django／多 repo（除非本檔更新允許）。
- 不要用 Mongo 當主 DB。
- 不要用 PHP／WordPress 做主站。
- 不要為了「以後 App」改用 Flutter 重寫 Web。
- 第一版 **不要實作** AI 產圖、換臉等（只留入口／Coming soon）。

### 2.3 為未來 iOS／Android 預留（現在就要遵守）

之後預計用 **Expo（React Native）** 接同一後端，**現在不必做 App**，但架構必須：

1. **核心業務必須有 HTTP API**（`app/api/**` 或之後獨立 service），可供 Web 與未來 App 共用。
2. **不要把唯一業務邏輯只寫在 React 元件或僅能 Web 用的 Server Action 裡**；Server Action 可包一層呼叫 shared service／API。
3. **認證設計預留 Token**：Cookie session 可用於 Web，但 API 應能驗證 Bearer／可攜帶的 session strategy，方便之後 App。
4. **共享型別**可放 `packages/shared` 或 `src/shared`（路徑、DTO、錯誤碼）；第一版可同 repo 資料夾，不必急著 monorepo。
5. **本機與正式皆用 Postgres**（同一 Prisma schema／migration）。App 不另起資料源。頭貼本機可寫 local disk，正式用 R2。

```
本機：  Web（Next.js） ──API──► Postgres（Neon dev／Docker）＋ local uploads
正式：  Web／Expo App ──API──► Neon Postgres ＋ Upstash ＋ R2
```

### 2.4 未來可擴充技術（到該階段再引入，勿提前大煉鋼）

| 階段 | 可引入 |
|------|--------|
| AI 產圖／換臉 | 外部 API（Replicate／自架 GPU）、佇列（Inngest／BullMQ）、物件儲存（S3／R2） |
| 即時通知 | Web Push、Expo Push、可選 SSE／WebSocket |
| 分析 | **Vercel Analytics**（`@vercel/analytics`，根 layout；隱私友善、勿再亂塞追蹤） |
| 廣告收益 | 僅有原創說明的頁可放 AdSense：`/about`、`/contact`、`/legal/privacy`、`/legal/terms`、帶說明的 `/{slug}`、示範帳號與正式登入後的 dashboard／inbox。**禁止**登入／註冊／忘記密碼／重設密碼／驗證信箱／settings／404。見 `NEXT_PUBLIC_ADS_*`；AdSense 後台須關閉自動廣告 |
| 郵件／通知 | 忘記密碼已接 SMTP（Gmail 代發）。對外 From 固定 `service@6w7.link`，**禁止**把代發 Gmail 寫進前端。環境變數：`SMTP_HOST`／`SMTP_USER`／`SMTP_PASS`／`MAIL_FROM` |
| 監控 | **Vercel Speed Insights**（`@vercel/speed-insights`，根 layout）；Sentry 可之後再加 |
| Monorepo | pnpm workspace：`apps/web`、`apps/mobile`、`packages/*` |
| 獨立 API | 當流量或 AI worker 變重時，再拆 Node／Python worker |

---

## 3. 專案結構（建議）

AI 搭骨架時請朝此結構靠攏（可微調，但意圖不變）：

```
6w7/
├── AGENTS.md                 ← 本準則（必讀）
├── README.md                 ← 人類向：如何安裝／啟動
├── package.json
├── prisma/
│   └── schema.prisma
├── public/
├── src/ 或 app/              ← 依 Next 慣例
│   ├── app/
│   │   ├── (marketing)/      ← 首頁、條款
│   │   ├── [slug]/           ← 訪客匿名留言頁（https://6w7.link/{slug}）
│   │   ├── inbox/            ← 主人收件匣（需登入）
│   │   ├── dashboard/        ← 連結與設定
│   │   ├── tools/            ← 工具目錄（含 coming soon）
│   │   └── api/              ← 對外 HTTP API
│   ├── components/
│   ├── lib/                  ← auth、db、rate-limit、moderation
│   ├── services/             ← 業務邏輯（給 API / Server Action 共用）
│   └── shared/               ← 型別、常數、錯誤碼
└── .env.example
```

**路由與產品對應（第一版要有／預留）：**

| 路徑 | 用途 | 第一版 |
|------|------|--------|
| `/` | 首頁：品牌 + **快速註冊／登入**，引導立刻建立連結 | 必做 |
| `/tools` | 工具列表 | **MVP 不對外露出**（未上線工具勿掛導覽）；路由可留作內部 |
| `/tools/ask` 或行銷說明頁 | 匿名問答介紹／建立 | 可導向註冊或 dashboard |
| `/[slug]` | 訪客留言（6 碼英數／可含 `-`） | 必做（路徑選定後勿亂改） |
| `/inbox` | 收件匣 | 必做 |
| `/dashboard` | 建立／管理連結、取得專屬 URL | 必做 |
| `/settings` | 帳號與安全（可綁定信箱） | 建議 |
| `/forgot-password` `/reset-password` `/verify-email` | 忘記密碼／重設／驗證信箱（寄信；禁止廣告） | 必做 |
| `/tools/face` 等 | AI 換臉等 | **未上線前不出現在 UI**；僅程式內占位可保留 |
| `/legal/privacy` `/legal/terms` | 隱私權／條款 | 必做（可先簡版） |
| `/about` `/contact` | 關於我們／聯絡我們（AdSense 透明度） | 必做 |
| `/demo` | 舊路徑導向登入頁。未登入造訪 `/dashboard` `/inbox` `/settings` 一律進登入；登入畫面可「用示範帳號登入」成真實 User `@lewanq`（`isDemo`），再走正式頁，可登出 | 示範帳號 |

短連結對外以 **`https://6w7.link/...`** 為準。

---

## 4. 資料模型（第一版最小集）

AI 實作時可細化欄位，但概念實體不可缺：

### 4.1 User（帳號）

- id、**username**（Instagram ID 風格，唯一；對外連結即此）、email（可選；註冊不強制，設定頁綁定）、emailVerified、passwordHash、name、image（頭貼 URL／路徑）、createdAt、status（active／suspended）
- PasswordResetToken／EmailVerificationToken：只存 token 雜湊與到期時間；用過即刪
- 角色預設 `user`；預留 `admin`
- 註冊 UI 帳號欄位前綴顯示 `@`，引導使用者填 IG ID

### 4.2 AskLink（每人一條人設／收件設定）

- 與 User **一對一**（不可一直新建多條主題連結）
- `slug` **等於 username**（例：`https://6w7.link/bin_biang.kuma`）
- `prompt` 如同 bio：使用者改新的就覆蓋舊的
- isActive、acceptingMessages；可選 topics／dailyLimit 等
- createdAt、updatedAt

### 4.2.1 頭貼儲存（Avatar）

- 上傳後**一律轉成** `profile.png`；新上傳覆蓋舊檔，不留舊檔。
- **本機：** `{UPLOAD_ROOT}/{userId}/profile.png`（預設 `public/uploads/`，gitignore）；`STORAGE_DRIVER=local`
- **正式：** Cloudflare R2（S3 相容），key = `avatars/{userId}/profile.png`；`STORAGE_DRIVER=s3` + `S3_*`／`S3_PUBLIC_BASE_URL`；`User.image` 存公開 URL。禁止所有使用者檔案堆在同一個扁平目錄。
- 對外以公開 URL／CDN 提供，勿把密鑰暴露前端。

### 4.3 Message（匿名留言）

- id、linkId
- body（文字內容；長度上限）
- 可選：topic／tag（主人預設的主題選項）
- status：`visible`｜`hidden`｜`flagged`｜`deleted`
- 訪客指紋／hash（**不可存明文 IP 當展示用**；可存 hash 供濫用偵測）
- createdAt
- **禁止**要求訪客註冊才能留言（這是匿名產品核心）

### 4.4 Moderation / Block / Report

- Report：messageId、reason、createdAt
- BlockRule：linkId、fingerprintHash 或關鍵字規則
- 預留 AuditLog（管理操作）

### 4.5 之後擴充（現在只預留命名空間，不建複雜表也可）

- `AiJob`、`MediaAsset`、`ToolUsage` 等 —— **等做到該工具再加**，避免空表一堆。

---

## 5. 匿名問答功能規格（NGL 概念、6w7 實作）

### 5.1 使用者旅程

1. **主人**以 Instagram ID（`@username`）註冊／登入（先帳號＋密碼即可進站），可上傳大頭貼；信箱之後到設定頁綁定並驗證。
2. 專屬連結固定為 `https://6w7.link/{username}`（不用隨機 slug）；人設提示（prompt）像 bio，修改即覆蓋。
3. **分享頁**（簡單）：預覽圖卡 → 第一步複製連結 → 第二步分享到 IG 限動（含簡短教學，文案／視覺須 6w7 原創，禁止抄 NGL）。
4. **訪客**打開連結 → 看到頭貼與提示 → 送出匿名留言（無需登入）。
5. **主人**在 Inbox 閱讀、封存、刪除、檢舉；可關閉收件。
6. （差異化，可分期）回覆圖卡、精選牆等。

### 5.2 必須有的能力（MVP）

- [ ] 以 IG ID（username）註冊／登入／登出（UI 顯示 `@` 前綴）
- [ ] 忘記密碼：設定頁綁定並驗證信箱後寄重設連結（From：`service@6w7.link`）
- [ ] 每人一條連結：`/{username}`；prompt 可更新覆蓋
- [ ] 大頭貼上傳（轉 profile.png、刪舊檔）
- [ ] 簡單分享頁：複製連結 + 限動分享引導
- [ ] 公開留言頁（行動裝置優先）
- [ ] 送出留言 + 成功回饋
- [ ] Inbox 列表、已讀／封存／刪除
- [ ] 關閉「接受留言」
- [ ] 基本檢舉
- [ ] API 與頁面限流
- [ ] 新留言近即時通知（角標／toast／summary API；Web SSE，App 可輪詢）
- [ ] 隱私權／服務條款入口
- [ ] 首頁：快速註冊 → 分享頁（**不展示**未上線工具）

### 5.3 差異化功能（排程，盡量做、可分 P1／P2）

**P1（盡早）：**

- 主人可設 3～5 個「主題標籤」，訪客必選或可選其一再留言。
- 每日收件上限、字數上限、冷卻時間（同一指紋）。
- Inbox 篩選：未讀／精選／已封存。
- 一鍵複製「限動分享文案」（6w7 原創語氣）。

**P2：**

- 回覆圖卡（產圖下載，非抄 NGL 版型）—— Inbox「限動圖卡」：1080×1920 PNG，6w7 原創版型（側欄色條＋墨色底＋6w7 品牌腳）
- 公開精選牆（主人選擇性公開，非預設全公開）。
- 多連結（同一帳號多個主題連結，例如「問學業」「問感情」）。
- 到期自動關閉連結。

### 5.4 UX／內容約束

- 行動裝置優先（IG 流量為主）。
- 首屏清楚：這是 **6w7**、這是匿名留言、留言後主人會在收件匣看到。
- 禁止誤導「對方完全無法追蹤到任何濫用資訊」——可說明「匿名對主人顯示，但系統為防濫用可能保留必要技術資料」。
- 繁體中文為預設 UI 語言；關鍵字串可 i18n 預留。

---

## 6. 多工具平台擴充準則

### 6.1 工具註冊概念

每個工具應有穩定 `toolId`，例如：

| toolId | 名稱 | 狀態 |
|--------|------|------|
| `ask` | 匿名問答 | **active（第一版）** |
| `face` | AI 換臉 | `coming_soon` |
| `imagegen` | AI 產圖 | `coming_soon` |

- 首頁／導覽**只渲染 `status === "active"` 且已決定對外露出的工具**；`coming_soon` **禁止**出現在使用者可見 UI（含首頁、導覽、頁尾、文案）。
- 對外顯示名稱為「匿名問答」；**全站品牌仍是 6w7／樂玩ㄑ**。
- MVP 可先不設公開「工具目錄」；等第二個工具真正上線再打開目錄。

### 6.2 新工具實作順序（AI 必須遵守）

1. 更新本 `AGENTS.md` 對應小節（若有新規則）。
2. 在工具目錄加 `coming_soon` 或 `active`。
3. 實作 `services/` + `api/`。
4. 再做 UI。
5. 補限流、費用／配額、審核與隱私說明。

**未經使用者明確要求，禁止實作 AI 換臉／產圖的真實呼叫與模型串接。**

---

## 7. 帳戶安全、隱私與信任安全

### 7.1 認證與帳號

- 密碼（若使用）必須強雜湊（Argon2／bcrypt）；優先 OAuth（Google）或 Magic Link，減少密碼風險。
- Session 安全：HTTP Only、Secure、SameSite；生產環境強制 HTTPS。
- 支援登出、（建議）撤銷所有 session。
- 帳號可停權（admin／濫用）。
- `.env` 密鑰禁止提交 git；提供 `.env.example`。

### 7.2 授權

- 所有 Inbox／Dashboard／設定 API：**必須驗證本人擁有該資源**（防 IDOR）。
- 公開留言 API：只允許寫入指定 `slug` 且 `acceptingMessages=true` 的連結。
- Admin API 與一般 API 隔離。

### 7.3 匿名與防濫用

- 訪客留言頁：**不顯示**留言者個資給主人。
- 伺服器可保存 **雜湊後** 的 IP／UA 指紋供限流與檢舉，**保留期限需可設定**，並在隱私權政策說明。
- 限流（最低要求）：
  - 依 IP／指紋：每分鐘、每小時、每日上限。
  - 依 link：全站與單連結維度。
  - 登入／註冊同樣限流。
- 內容：字數上限、禁止空白、基本敏感詞／違規類別過濾（可迭代）。
- 主人可刪除、隱藏、檢舉；檢舉後進入 flagged。
- 禁止的內容類型需在條款寫清（色情涉及未成年人、仇恨、威脅、違法等）——產品必須有處理路徑。

### 7.4 資料保護

- 最小蒐集原則：不蒐集與功能無關的個資。
- 備份與刪除：使用者要求刪帳號時，應能刪除或匿名化其連結與留言（實作刪除流程）。
- 檔案上傳（未來 AI）：病毒／類型檢查、容量限制、私人 bucket 權限。
- 安全標頭：適當 CSP、XSS 防護；所有使用者內容輸出跳脫。
- CSRF：對 cookie session 的變更類請求需有防護策略。

### 7.5 機密與合規習慣

- 永遠不把金鑰、token、連線字串寫進前端 bundle。
- 日誌避免打印留言全文與 token。
- 生產／開發環境設定分離。
- 對外聯絡信箱只顯示 **service@6w7.link**。忘記密碼信以 Gmail SMTP「代發／Send mail as」寄出；代發用的 Gmail 與應用程式密碼只寫環境變數／本機密鑰備忘，禁止上網站、前端或公開 Git。
- 忘記密碼 API 不可透露帳號是否存在；只寄給**已驗證**信箱。token 只存雜湊，重設連結 1 小時失效，驗證連結 24 小時失效。

---

## 8. API 設計準則

- 風格：REST JSON（第一版）；路徑前綴 `/api/v1/...`（建議版本化）。
- 統一錯誤格式，例如：`{ "error": { "code": "RATE_LIMITED", "message": "..." } }`。
- 成功／失敗 HTTP 狀態碼語意正確（401／403／404／429／400）。
- 寫入類 API 必有限流與輸入驗證（Zod 等）。
- **OpenAPI／型別**可選，但 `shared` 型別要與前端一致。
- 未來 App 只依賴這些 API，不依賴 HTML 爬頁。

### 8.1 建議端點（MVP）

```
POST   /api/v1/auth/register
POST   /api/v1/auth/forgot-password   # 公開＋限流；無論是否存在帳號皆回成功
POST   /api/v1/auth/reset-password
GET    /api/v1/me
PATCH  /api/v1/me                     # 綁定／更新登入信箱（會寄驗證信）
POST   /api/v1/me/email/verify        # 重寄驗證信（需登入）
POST   /api/v1/auth/verify-email      # 點信件連結完成驗證

POST   /api/v1/ask-links         # 建立連結
GET    /api/v1/ask-links
PATCH  /api/v1/ask-links/:id
POST   /api/v1/ask-links/:id/rotate-slug   # 可選

GET    /api/v1/inbox             # 主人留言列表
PATCH  /api/v1/messages/:id      # 已讀／隱藏／精選
DELETE /api/v1/messages/:id
POST   /api/v1/messages/:id/report

GET    /api/v1/notifications/summary   # 未讀數摘要（App 可輪詢；不含留言全文）
GET    /api/v1/notifications/stream    # SSE 近即時推送（Web）；payload 同 summary

POST   /api/v1/public/ask/:slug/messages   # 訪客送留言（公開＋限流）
GET    /api/v1/public/ask/:slug            # 公開連結資訊（不暴露敏感欄位）
```

### 8.2 通知（近即時）

- **目標：** 主人收到新匿名留言時，登入中的 Web（之後 App）能近即時更新角標／提示；體驗要即時，**樣式與互動勿仿冒 Facebook**。
- **資料：** `NotificationSummary`（`unreadCount`、`latestId`、`latestAt`、`latestTopic`）；**禁止**在通知通道帶留言全文。
- **Web：** SSE（`/notifications/stream`）為主；斷線改輪詢 `summary`；頁面可見時補拉一次。
- **未來 App：** 同一 `summary` API 輪詢或之後加 Expo Push（見 §2.4）；業務邏輯僅在 `notification.service`。
- **UI：** Header「收件匣」未讀角標、文件標題 `(n)`、品牌風格 toast（可進收件匣）；在收件匣頁時可觸發列表安靜刷新。

---

## 9. 前端／設計準則

- 預設繁體中文。
- 行動優先；留言頁在 IG in-app browser 可正常用。
- 品牌名在首屏可見：`6w7`／`樂玩ㄑ`。
- MVP 首屏目標：讓訪客**立刻註冊並建立專屬連結**；勿用「即將推出」佔版面。
- 未上線工具不對外暗示開發中（避免降低信任與焦點）。
- 使用 Tailwind + shadcn；保持一套 CSS 變數色票，避免每次 AI 亂換主題。
- **避免**通用 AI 網頁套路：紫漸層、過度 glassmorphism、無意義統計卡牆。
- 動畫克制（2～3 處有意義即可）。
- 無障礙：按鈕可聚焦、表單有 label、對比足夠。

---

## 10. Git、環境與品質

- 有意義的 commit；不提交 secrets、`.env`、大型模型檔。
- `README.md` 必須能讓人 `install → env → migrate → dev`（見「給新加入的開發者」）。
- 鎖定 **npm** + `package-lock.json`；本機 uploads／`.env` **不進 Git**。
- PR／變更應說明：行為、風險、是否影響 API 相容。
- 破壞性 API／slug 路徑變更需更新本檔與 changelog（若有）。
- 優先修正安全與資料遺失類問題。

---

## 11. AI 代寫工作流程（強制）

之後每次用 AI「繼續做 6w7」時，Agent 應：

1. **讀本檔** `AGENTS.md`。
2. 確認當前任務屬於哪一階段（MVP 匿密／占位工具／安全／之後 AI 工具）。
3. **只做被要求的範圍**；不擅自實作換臉／產圖真功能。
4. 改動 API、資料模型、路由前，檢查是否違反 §2、§4、§5、§7、§8。
5. 新增使用者可見文案時，確保 **非 NGL 複製**，且帶 6w7 品牌。
6. 實作後更新 `README.md`（若啟動方式變更）；重大規格變更同步更新本檔。
7. 保持 TypeScript strict、驗證輸入、檢查授權與限流。

### 11.1 任務優先級（預設）

1. 安全與授權正確性  
2. MVP 匿名問答可跑通  
3. 限流／檢舉／條款  
4. UX 與差異化 P1  
5. 工具占位與資訊架構  
6. 測試與觀測  
7. 未來 AI 工具（需明確指令）

### 11.2 回覆使用者時

- 使用**繁體中文**（使用者偏好）。
- 不要建議走回「抄 NGL」的捷徑。
- 若使用者要求與本檔衝突的技術，先指出衝突，經確認後才改本檔與實作。

---

## 12. 分期路線圖（給 AI 排程用）

### Phase 0 — 骨架

- Next.js + TS + Tailwind + Prisma + Auth 骨架
- 環境變數範例、基本版面、工具列表占位

### Phase 1 — 匿名問答 MVP

- 連結建立、公開留言、Inbox、限流、檢舉、條款

### Phase 2 — 差異化與信任

- 主題標籤、分享文案、多連結、刪帳號、加強審核

### Phase 3 — 產品化

- 分析、監控、測試、效能、SEO、自訂主題

### Phase 4 — 行動 App

- 抽出／穩定 `api/v1`
- Expo App：登入、Inbox、管理連結（訪客留言可仍用 Web）

### Phase 5 — AI 工具

- 配額、儲存、審核、非同步任務
- 換臉／產圖等（獨立 toolId）

---

## 13. 決策紀錄（ADR 摘要）

| 決策 | 選擇 | 原因 |
|------|------|------|
| 品牌 | 6w7／樂玩ㄑ | 6＝樂、w＝玩、ㄑ＝7／去；呼應 six seven 與網域 6w7.link |
| 第一功能 | 匿名問答（可稱匿密） | 驗證連結型增長 |
| 框架 | Next.js 全端 | 單人／小團隊最快；業界常見 |
| 未來 App | 同 API + Expo | 不必現在換技術 |
| UI | Tailwind + shadcn | 迭代快、常見 |
| DB | Postgres + Prisma | 可靠、結構化 |
| 差異化 | 平台化＋主題／規則＋自有文案視覺 | 避免成為 NGL 克隆 |

---

## 14. 快速檢查清單（每次功能完成前）

- [ ] 有通過認證／授權檢查（若非公開端點）
- [ ] 公開寫入有限流與輸入驗證
- [ ] 沒有把秘密漏到 client
- [ ] 沒有複製 NGL 文案／視覺
- [ ] 品牌顯示為 6w7／樂玩ㄑ
- [ ] API 可被非 Web 客戶端重用（邏輯在 service 層）
- [ ] 未擅自做 AI 換臉／產圖
- [ ] 繁中 UI 字串無簡體混用（除非刻意 i18n）
- [ ] 需要時已更新本檔或 README

---

**結束。** 之後所有代寫以本檔為準則持續迭代。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
