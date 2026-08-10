# 6w7（樂玩ㄑ）

多工具平台（長期）；第一版對外專注匿名留言連結。  
**規格真相來源：** [`AGENTS.md`](./AGENTS.md)（改功能前請先讀）。

**網域：** https://6w7.link  
**資料庫：** PostgreSQL（本機可用 Neon 開發分支或 Docker）  
**正式環境：** Vercel + Neon + Upstash Redis + Cloudflare R2

---

## 給新加入的開發者（clone 後可編譯）

### 需求

| 項目 | 版本 |
|------|------|
| Node.js | **20 LTS 以上**（見 `.nvmrc`） |
| 套件管理 | **npm**（請用 repo 內 `package-lock.json`，勿改用 pnpm／yarn 混裝） |
| OS | Windows／macOS／Linux 皆可 |
| 資料庫 | **PostgreSQL**（Neon 免費專案或本機 Docker） |

Windows 若 `npm install` 編譯 `sharp` 失敗，請先安裝 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（勾選「使用 C++ 的桌面開發」）後重試。

### 一次上手

```bash
git clone <這個 repo 的 URL>
cd 6w7          # 或你的資料夾名
npm ci          # 依 lockfile 安裝（比 npm install 更一致）
cp .env.example .env
# 編輯 .env：填入 DATABASE_URL（Postgres）
npm run db:deploy   # 套用 prisma/migrations
npm run dev
```

開啟 http://localhost:3000  
首頁註冊 → 短網址頁 → 公開留言頁 `/{你的username}`。

> **Windows PowerShell** 若沒有 `cp`：`Copy-Item .env.example .env`

### 環境變數

- **必填：** `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`、`NEXT_PUBLIC_SITE_URL`、`FINGERPRINT_SALT`
- **正式另需：** Upstash（`UPSTASH_REDIS_*`）、R2／S3（`STORAGE_DRIVER=s3` 與 `S3_*`）
- **不要提交** `.env`（已在 `.gitignore`）。
- Google OAuth／AdSense 選用；未設 Redis 時本機用記憶體限流（勿用於正式多實例）。

完整範例見 [`.env.example`](./.env.example)。

### 會進 Git／不進 Git

| 進 Git（請保留） | 不進 Git |
|------------------|----------|
| 原始碼、`package-lock.json`、`prisma/` | `node_modules/`、`.next/` |
| `.env.example`、`AGENTS.md`、`README.md` | `.env`、密鑰 |
| `public/brand/` 等靜態資源 | `public/uploads/*` 本機頭貼 |
| `.cursor/rules/`（AI 專案規則） | |

頭貼上傳目錄以 `public/uploads/.gitkeep` 保留結構；**每位開發者本機各自產生 uploads，勿互相覆蓋進版控。**

### 常用指令

```bash
npm run dev          # 開發
npm run build        # migrate deploy + next build（PR／正式用）
npm run start        # 用 build 結果本機預覽
npm run lint
npm run db:deploy    # 套用已有 migrations（CI／正式／本機對齊）
npm run db:migrate   # 開發時產新 migration
npm run db:push      # 快速同步 schema（僅開發權宜）
npm run db:generate  # 重產 Prisma Client（postinstall 通常已跑）
```

### 開發規範（簡）

1. 先讀 `AGENTS.md`；規格變更先改該檔再改程式。  
2. 業務邏輯放 `src/services/` + `/api/v1`，方便之後 App。  
3. 對使用者 UI 用繁體中文；品牌為 **6w7／樂玩ㄑ**，勿抄 NGL。  
4. 未明確要求勿做 AI 換臉／產圖真功能。

---

## 主要路徑

| 路徑 | 說明 |
|------|------|
| `/` | 首頁（快速註冊） |
| `/[username]` | 訪客匿名留言（例：`/bin_biang.kuma`） |
| `/dashboard` | 短網址／分享頁 |
| `/inbox` | 收件匣 |
| `/settings` | 帳號設定 |
| `/login` | 登入／註冊 |
| `/legal/privacy` `/legal/terms` | 隱私與條款 |

## API（v1）摘要

業務在 `src/services/`。

- `POST /api/v1/auth/register`
- `GET /api/v1/me`
- `GET\|POST /api/v1/ask-links` · `PATCH /api/v1/ask-links/:id`
- `GET /api/v1/inbox`
- `PATCH\|DELETE /api/v1/messages/:id`
- `POST /api/v1/messages/:id/report`
- `GET /api/v1/notifications/summary` · `GET /api/v1/notifications/stream`
- `GET /api/v1/public/ask/:slug`
- `POST /api/v1/public/ask/:slug/messages`

完整約定見 `AGENTS.md` §8。

---

## 正式部署（Vercel 棧）

目標架構：

```
Browser／IG → Vercel（Next.js）→ Neon Postgres
                              → Upstash Redis（限流）
                              → Cloudflare R2（頭貼）
DNS：6w7.link → Vercel
```

### 1. Neon（PostgreSQL）

1. 至 [neon.tech](https://neon.tech) 建立專案（可另開 `dev` branch 給本機）。
2. 複製 **pooled** connection string（含 `sslmode=require`）。
3. 本機 `.env` 與 Vercel Production 皆設 `DATABASE_URL`。

### 2. Upstash Redis

1. 至 [upstash.com](https://upstash.com) 建立 Redis（REST）。
2. 設定：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 3. Cloudflare R2（頭貼）

1. Cloudflare → R2 → 建立 bucket（例：`6w7-avatars`）。
2. 建立 API Token（Object Read & Write）。
3. 開啟公開讀取：自訂網域（建議 `cdn.6w7.link`）或 r2.dev 公開網址。
4. Vercel／正式 env：

```env
STORAGE_DRIVER=s3
S3_BUCKET=6w7-avatars
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
S3_PUBLIC_BASE_URL=https://cdn.6w7.link
```

物件 key：`avatars/{userId}/profile.png`。本機可維持 `STORAGE_DRIVER=local`。

### 4. 密鑰與站台 URL

於本機產生後只貼到 Vercel（勿提交 Git）：

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # FINGERPRINT_SALT
```

```env
AUTH_URL=https://6w7.link
NEXT_PUBLIC_SITE_URL=https://6w7.link
```

### 5. Vercel 專案

1. 推送 repo 至 GitHub → [vercel.com](https://vercel.com) Import。
2. Framework：Next.js；Node **≥ 20**。
3. Build Command 預設會跑 `npm run build`（內含 `prisma migrate deploy && next build`）。
4. 於 Project → Settings → Environment Variables 填入正式變數（Production）。
5. Deploy；確認 build log 中 migrate 成功。

### 6. 網域 `6w7.link`

1. Vercel Project → Domains → 新增 `6w7.link`（與可選 `www`）。
2. 於網域註冊商依 Vercel 指示設定 A／CNAME。
3. 等待 SSL 簽發完成後再對外分享連結。

### 7. 上線煙測清單

- [ ] 首頁開啟、品牌顯示 6w7／樂玩ㄑ
- [ ] 註冊／登入／登出
- [ ] Dashboard 顯示 `https://6w7.link/{username}` 並可複製
- [ ] 上傳頭貼後公開頁與設定頁可見（R2 URL）
- [ ] 訪客於 `/{username}` 送出匿名留言（無需登入）
- [ ] Inbox 可見新留言；角標／通知（SSE 斷線時應回退 summary 輪詢）
- [ ] 關閉「接受留言」後訪客無法再送
- [ ] 檢舉留言
- [ ] （可選）快速連打留言 API 出現 429

### 正式環境變數速查

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Neon Postgres |
| `AUTH_SECRET` | Auth.js 密鑰 |
| `AUTH_URL` | `https://6w7.link` |
| `NEXT_PUBLIC_SITE_URL` | `https://6w7.link` |
| `FINGERPRINT_SALT` | 指紋雜湊鹽 |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | 限流 |
| `STORAGE_DRIVER` | 正式=`s3` |
| `S3_BUCKET` / `ENDPOINT` / keys / `S3_PUBLIC_BASE_URL` | R2 |

---

## 注意

- 第一版**不實作** AI 換臉／產圖真實功能；未上線工具不對外顯示。  
- 禁止複製 NGL 品牌、文案與視覺。  
- 勿提交 `.env`、上傳圖、密鑰。  
- SSE 在 Vercel serverless 可能被逾時截斷；客戶端應以 `summary` 輪詢為後備。
