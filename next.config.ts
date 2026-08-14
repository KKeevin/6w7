import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允許區網 IP 開開發站（手機／其他裝置連 192.168.x.x）
  allowedDevOrigins: ["192.168.1.108", "localhost"],
  // Vercel 上避免 sharp 被錯誤打包
  serverExternalPackages: ["sharp"],
  async redirects() {
    return [
      { source: "/demo", destination: "/api/v1/auth/demo", permanent: false },
      {
        source: "/demo/dashboard",
        destination: "/dashboard",
        permanent: false,
      },
      { source: "/demo/inbox", destination: "/inbox", permanent: false },
      {
        source: "/demo/inbox/:id",
        destination: "/inbox/:id",
        permanent: false,
      },
      {
        source: "/demo/settings",
        destination: "/settings",
        permanent: false,
      },
      { source: "/demo/ask", destination: "/lewanq", permanent: false },
    ];
  },
};

export default nextConfig;
