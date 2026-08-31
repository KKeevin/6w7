<div align="center">
<img src="public/brand/logo.png" alt="6w7" width="180">

# 6w7（樂玩ㄑ）- 匿名問答
[![Site](https://img.shields.io/badge/site-6w7.link-1aa68a?style=flat-square)](https://6w7.link)
[![zh-TW](https://img.shields.io/badge/lang-zh--TW-red?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-Non--Commercial%20Educational-yellow?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/kkkeevin/6w7?style=flat-square&label=stars)](https://github.com/kkkeevin/6w7/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/kkkeevin/6w7?style=flat-square&label=forks)](https://github.com/kkkeevin/6w7/forks)

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn-ui-000000?style=flat-square)](https://ui.shadcn.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square)](https://www.prisma.io)
[![Auth.js](https://img.shields.io/badge/Auth.js-login-black?style=flat-square)](https://authjs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square)](https://nodejs.org)

[![Vercel](https://img.shields.io/badge/Vercel-Hosting-black?style=flat-square)](https://vercel.com)
[![Neon](https://img.shields.io/badge/Neon-DB-00E599?style=flat-square)](https://neon.tech)
[![Upstash](https://img.shields.io/badge/Upstash-Redis-00C7B7?style=flat-square)](https://upstash.com)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square)](https://www.cloudflare.com/developer-platform/r2/)

Next.js 專案，由 Vercel 託管並綁定付費網域；資料庫用 Neon，物件存在 Cloudflare R2。

產生專屬短連結，產生圖卡於限動分享後收匿名提問。(以及更多功能，[詳閱文件](AGENTS.md))
</div>

## 本機啟動

```bash
npm ci
copy .env.example .env
npm run db:deploy
npm run dev
```

先在 `.env` 填 `DATABASE_URL`（PostgreSQL／Neon 或 Docker），再開 http://localhost:3000。其餘必填變數見 `.env.example`；非 Windows 把 `copy` 改成 `cp`。

## 文件

- [產品規格](AGENTS.md)
- [本機與部署概要](docs/INFRA-SETUP.md)
- [密鑰備忘範本](docs/SECRETS.local.example.md)

## 常用指令

```bash
npm run dev          # 開發
npm run build        # prisma generate + next build
npm run lint
npm run db:deploy    # 套用已有 migrations
npm run db:migrate   # 開發時產新 migration
```

## License

[非商業學術教材授權](LICENSE)（**不是** MIT／OSI 開源）。Copyright (c) 2026 KKeevin。

允許下載、學習、改作業與課堂使用；**禁止商用、禁止當成正式對外網站／服務上線**。官方站 [6w7.link](https://6w7.link) 由著作權人自行營運。第三方套件仍依其原授權。
