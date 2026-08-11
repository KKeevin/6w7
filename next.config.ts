import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允許區網 IP 開開發站（手機／其他裝置連 192.168.x.x）
  allowedDevOrigins: ["192.168.1.108", "localhost"],
  // Vercel 上避免 sharp 被錯誤打包
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
