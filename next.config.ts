import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允許區網 IP 開開發站（手機／其他裝置連 192.168.x.x）
  allowedDevOrigins: ["192.168.1.108", "localhost"],
  // Vercel 上避免 sharp 被錯誤打包
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/demo", destination: "/login", permanent: false },
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
