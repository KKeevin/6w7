# 6w7 基礎設施設定紀錄（Neon／Upstash／R2／Vercel／GitHub）

> **這份文件是「我們實際做過什麼」的操作手冊與資源清單。**  
> 規格產品面請看 [`AGENTS.md`](../AGENTS.md)；日常開發請看 [`README.md`](../README.md)。  
> **最後整理：** 2026-08-12

---

## 0. 安全規則（必讀）

| 可以寫進 Git | 絕對不要寫進 Git |
|--------------|------------------|
| 步驟、專案名稱、區域、公開網址 | 密碼、Token、Secret、Connection string 整串 |
| 環境變數**名稱** | `.env`、`Neon.txt`、`docs/SECRETS.local.md` |
| 踩過的坑與解法 | 聊天紀錄裡貼過的真實密鑰 |

**真實金鑰請只放：**

1. 本機根目錄 `.env`（已 gitignore）  
2. Vercel → Project → Settings → Environment Variables  
3. 可選：複製 [`SECRETS.local.example.md`](./SECRETS.local.example.md) 成 `docs/SECRETS.local.md` 自己填（已 gitignore）

若密鑰曾貼在聊天／截圖／`Neon.txt`，請到各服務後台**重設／輪替**。

---

## 1. 整體架構（我們選的棧）

```
使用者（瀏覽器／IG）
        │
        ▼
  Vercel（Next.js App）─────► Neon PostgreSQL（帳號／留言）
        │
        ├──────────────────► Upstash Redis（限流）
        │
        └──────────────────► Cloudflare R2（頭貼檔）
              公開讀取：r2.dev（或之後 cdn.6w7.link）
```

| 服務 | 用途 | 正式現況（摘要） |
|------|------|------------------|
| **GitHub** | 原始碼版控；Vercel 自動部署來源 | `https://github.com/KKeevin/6w7`，分支 `main` |
| **Vercel** | 跑 Next.js、HTTPS、自動 Deploy | 專案名 `6w7`；目前站：`https://6w7.vercel.app` |
| **Neon** | PostgreSQL | 專案名 `6w7`；區域 **Singapore (ap-southeast-1)** |
| **Upstash** | Redis REST 限流 | DB 名 `6w7`；區域 **Singapore** |
| **Cloudflare R2** | 頭貼物件儲存 | Bucket：`6w7-avatars`；公開：`*.r2.dev` |
| **網域 6w7.link** | 品牌短網域 | 規劃綁 Vercel（若尚未綁完，對外可能仍用 vercel.app） |

---

## 2. 建議操作順序（當初實際順序）

1. 程式改成 Postgres + R2 抽象（已在 repo）  
2. **GitHub** 建 repo、push `main`  
3. **Neon** → 拿 `DATABASE_URL` → 本機 `npm run db:deploy`  
4. **Upstash** → 兩組 Redis REST 變數  
5. **Vercel** Import GitHub → 填 env → Deploy  
6. **Cloudflare R2** → bucket／公開網域／金鑰 → Vercel 改 `STORAGE_DRIVER=s3` 等  
7. （可選）綁 `6w7.link`、R2 自訂 CDN 網域  

---

## 3. GitHub

### 做了什麼

- 強化 `.gitignore`（`.env`、`node_modules`、`.next`、uploads、`Neon.txt` 等）  
- 建立遠端：`https://github.com/KKeevin/6w7`  
- 之後改碼推 `main` → Vercel 自動 Production Deploy  

### 常用指令

```powershell
git status
git add …
git commit -m "訊息"
git push origin main
```

### 相關「金鑰」

| 名稱 | 用途 | 取得方式 |
|------|------|----------|
| GitHub 登入／PAT | `gh`／push | `gh auth login` 或 GitHub → Settings → Developer settings |

---

## 4. Neon（PostgreSQL）

### 做了什麼

1. 開 https://console.neon.tech → Create project  
2. 設定（當初選擇）：  
   - **Name：** `6w7`  
   - **Region：** AWS Asia Pacific（Singapore）`ap-southeast-1`  
   - **不要**開 Neon Auth／多餘 Backend（我們用自己的 Auth.js）  
3. Connection details → 選 **Pooled connection**（主機名常有 `-pooler`）  
4. 確認字串含 `sslmode=require`  
5. 本機 `.env` 設 `DATABASE_URL=…`  
6. 執行：`npm run db:deploy`（套用 `prisma/migrations`）  

### 環境變數

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | **Pooled** connection string，給 App／Vercel |

可選：`DIRECT_URL`（非 pooler）給本機跑 migrate 較穩；見 `prisma.config.ts`（若有）。

### 金鑰／字串從哪裡拿

- Neon Dashboard → 專案 → **Connection details**  
- 角色多半是 `neondb_owner`，資料庫名 `neondb`  
- **密碼若曾外洩：Reset password**，再更新本機 `.env` 與 Vercel  

### 重要注意

- **Vercel `npm run build` 現在是 `prisma generate && next build`**，**不會**在 build 時跑 `migrate deploy`（pooler 上跑 migrate 易卡住／失敗）。  
- Schema 變更後：本機或 CI 用 **direct／合適連線** 跑 `npm run db:deploy`，再部署。  

---

## 5. Upstash（Redis 限流）

### 做了什麼

1. 開 https://upstash.com → Create → **Redis**  
2. **Name：** `6w7`  
3. **Primary Region：** Singapore（`ap-southeast-1`）  
4. Read Regions 可不選；Eviction 可關  

### 環境變數

| 變數 | 從哪複製 |
|------|----------|
| `UPSTASH_REDIS_REST_URL` | Console → REST API → URL |
| `UPSTASH_REDIS_REST_TOKEN` | Console → REST API → Token |

未設定時本機用記憶體限流（**正式多實例不可靠，正式必設**）。

---

## 6. Cloudflare R2（頭貼）

### 做了什麼

1. Cloudflare Dashboard → **R2** → Create bucket  
   - **Bucket 名：** `6w7-avatars`  
   - 區域：APAC（依當時選項）  
2. 開啟 **公開存取**（r2.dev 公開開發網域）  
3. 建立兩類憑證（用途不同，別搞混）：  

| 憑證類型 | 用途 | 對應 env |
|----------|------|----------|
| **R2 S3 API** Access Key + Secret | S3 相容端點（本機／備援） | `S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY` |
| **Account API Token**（`cfat_…`） | 正式上傳優先走 Cloudflare REST API（避開 Vercel→R2 S3 TLS 問題） | `CLOUDFLARE_API_TOKEN` |

> **踩過的坑：** 僅「物件讀寫」的 R2 token 呼叫 `api.cloudflare.com` 會 **403**。正式上傳要用能打 Cloudflare API 的 **Admin／系統管理員讀寫** 類 `cfat_` token。

4. 記下 Account ID、S3 endpoint  

### 環境變數（正式）

```env
STORAGE_DRIVER=s3
S3_BUCKET=6w7-avatars
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=…
S3_SECRET_ACCESS_KEY=…
S3_REGION=auto
S3_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
CLOUDFLARE_API_TOKEN=cfat_…
CLOUDFLARE_ACCOUNT_ID=<ACCOUNT_ID>
```

### 公開 URL 規則（很重要）

- `S3_PUBLIC_BASE_URL` 必須是 **`https://…` 開頭、不要尾隨 `/`**  
- 物件 key：`avatars/{userId}/profile.png`  
- 顯示時會加 `?v=時間戳／updatedAt` 破快取（同一檔名覆蓋時瀏覽器才不會卡舊圖）  

### 本機開發

```env
STORAGE_DRIVER=local
# 頭貼寫入 public/uploads/{userId}/profile.png
```

### 診斷

- `GET /api/v1/profile/avatar`（登入後）可看 storage／是否有 CF token 等（不含密鑰）  

---

## 7. Vercel

### 做了什麼

1. https://vercel.com → Add New Project  
2. Import **`KKeevin/6w7`**  
3. Project Name：`6w7`；Framework：Next.js；Root：`./`  
4. **Environment Variables（Production）** 貼齊（見下一節清單）  
5. Deploy；之後每次 `git push origin main` 自動部署  

### 站台 URL

| 項目 | 值 |
|------|-----|
| 目前 Production | `https://6w7.vercel.app` |
| 規劃品牌網域 | `https://6w7.link`（DNS 綁到 Vercel 後，記得改 `AUTH_URL`／`NEXT_PUBLIC_SITE_URL`） |

### Build 注意

- Build Command：`npm run build` → `prisma generate && next build`  
- Node：**≥ 20**  
- Migrate **不要**依賴 Vercel build；改 schema 後在本機／有 direct URL 的環境跑 `npm run db:deploy`  

### 綁網域 `6w7.link`（若尚未完成）

1. Vercel → Project → Domains → 加 `6w7.link`（可選 `www`）  
2. 網域商依指示設 A／CNAME  
3. SSL 好了以後更新：  
   - `AUTH_URL=https://6w7.link`  
   - `NEXT_PUBLIC_SITE_URL=https://6w7.link`  
4. Redeploy  

---

## 8. 環境變數總表（名稱 ↔ 來源）

### 本機 `.env` vs Vercel Production

| 變數 | 本機常見 | Vercel Production | 從哪來 |
|------|----------|-------------------|--------|
| `DATABASE_URL` | Neon pooled | 同左 | Neon |
| `AUTH_SECRET` | 可本機亂數 | **正式專用亂數** | 自己產 |
| `FINGERPRINT_SALT` | 可本機亂數 | **正式專用亂數** | 自己產 |
| `AUTH_URL` | `http://localhost:3000` | `https://6w7.vercel.app` 或 `https://6w7.link` | 站台網址 |
| `NEXT_PUBLIC_SITE_URL` | 同上 | 同上 | 站台網址 |
| `UPSTASH_REDIS_REST_URL` | 可填正式或空 | **必填** | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | 可填正式或空 | **必填** | Upstash |
| `STORAGE_DRIVER` | `local` | `s3` | 自己設 |
| `S3_*`／`CLOUDFLARE_*` | 可空（local） | **必填（頭貼）** | Cloudflare |
| `NEXT_PUBLIC_ADS_*` | 選用 | 選用 | AdSense |

### 自己產生亂數（PowerShell）

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

跑兩次：一次給 `AUTH_SECRET`，一次給 `FINGERPRINT_SALT`。  
（或 Git Bash：`openssl rand -base64 32`）

---

## 9. 踩過的坑（之後別再踩）

| 現象 | 原因／解法 |
|------|------------|
| Vercel build 卡住／migrate 失敗 | pooler 上跑 `migrate deploy`；改為 build 只 `generate`，migrate 本機跑 |
| 頭貼上傳 500／SSL／fetch failed | Vercel→R2 S3 端點 TLS；正式優先 `CLOUDFLARE_API_TOKEN`（`cfat_`） |
| R2 API 403 | 物件讀寫 token 不能當 CF REST Bearer → 用 Admin `cfat_` |
| 頭貼 URL 變成怪的 `http://s/...` | `S3_PUBLIC_BASE_URL` 解析 bug（已修）；務必含 `https://` |
| 限動圖卡電腦 OK、手機缺 logo／頭貼 | iOS `html-to-image` 不畫 img → 改 **Canvas** 繪製 |
| 預覽頭貼空白但網址開得出來 | `crossorigin="anonymous"` + R2 未開 CORS → 預覽拿掉 crossOrigin |
| 手機換頭貼、電腦一直舊圖 | 固定 `?v=userId` 卡快取 → 改 `updatedAt`／上傳時間戳 |
| iOS 點留言框畫面放大 | input／textarea 字級 &lt; 16px → 改 `text-base` |

---

## 10. 煙測清單（改完基礎設施後）

- [ ] `https://…` 首頁可開，品牌 6w7／樂玩ㄑ  
- [ ] 註冊／登入／登出  
- [ ] Dashboard 短網址正確、可複製  
- [ ] 上傳頭貼 → 公開頁／設定／分享預覽皆新圖  
- [ ] 訪客 `/{username}` 可匿名留言  
- [ ] Inbox 看得到；關閉收件後無法再送  
- [ ] 限動分享圖：手機系統分享有 logo＋頭貼  
- [ ] （可選）連打 API 出現 429  

---

## 11. 之後「我忘了金鑰放哪」怎麼查

| 想找的東西 | 去哪裡 |
|------------|--------|
| 本機所有值 | 專案根目錄 `.env` |
| 正式所有值 | Vercel → `6w7` → Settings → Environment Variables |
| DB 連線／重設密碼 | Neon Console → `6w7` → Connection |
| Redis URL／Token | Upstash Console → `6w7` |
| R2 金鑰／公開網域 | Cloudflare → R2 → `6w7-avatars`／Manage API Tokens |
| 程式要哪些變數名 | [`.env.example`](../.env.example) |
| 自己抄一份密鑰備忘 | `docs/SECRETS.local.md`（從 example 複製，**勿 commit**） |

---

**結束。** 換電腦時：clone repo → 複製 `.env.example` → 從 Vercel／各後台把值填回 → `npm ci` → `npm run db:deploy`（若需要）→ `npm run dev`。
