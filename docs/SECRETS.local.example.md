# 6w7 密鑰備忘（本機專用範本）

> 用法：複製本檔為 **`SECRETS.local.md`**，填入真實值。  
> `SECRETS.local.md` 已列入 `.gitignore`，**不要**把填好的檔 commit／推上 GitHub。  
> 公開步驟說明見 [`INFRA-SETUP.md`](./INFRA-SETUP.md)。

複製指令（PowerShell）：

```powershell
Copy-Item docs/SECRETS.local.example.md docs/SECRETS.local.md
```

---

## 帳號與控制台

| 服務 | 登入網址 | 專案／資源名 | 備註 |
|------|----------|--------------|------|
| GitHub | https://github.com | `KKeevin/6w7` | |
| Vercel | https://vercel.com | Project `6w7` | |
| Neon | https://console.neon.tech | Project `6w7` | Singapore |
| Upstash | https://console.upstash.com | Redis `6w7` | Singapore |
| Cloudflare | https://dash.cloudflare.com | R2 `6w7-avatars` | |

---

## 填寫區（只放本機）

### Neon

```
DATABASE_URL=
# 可選 DIRECT_URL=（非 pooler，給 migrate）
```

### Upstash

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Auth／站台

```
AUTH_SECRET=
FINGERPRINT_SALT=
AUTH_URL=https://6w7.link
NEXT_PUBLIC_SITE_URL=https://6w7.link
# 本機開發改用 http://localhost:3000
```

### Cloudflare R2

```
STORAGE_DRIVER=s3
S3_BUCKET=6w7-avatars
S3_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=auto
S3_PUBLIC_BASE_URL=https://cdn.6w7.link
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

### 網域備註

```
# 站台：6w7.link（Production）；www → 308 → 6w7.link
# 頭貼 CDN：cdn.6w7.link（R2 Custom Domain）
# 聯絡／寄信顯示：service@6w7.link
# 忘記密碼 SMTP（Gmail 代發；應用程式密碼勿 commit）
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# MAIL_FROM=6w7 <service@6w7.link>
# DNS 細節見 docs/INFRA-SETUP.md §7.1～7.2
```

---

## 輪替紀錄

| 日期 | 項目 | 原因 |
|------|------|------|
| （例）2026-08-11 | Neon 密碼 | 曾貼在聊天 |
|  |  |  |
