import type { MetadataRoute } from "next";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = `https://${BRAND.domain}`;
  return [
    { url: host, changeFrequency: "weekly", priority: 1 },
    { url: `${host}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${host}/legal/privacy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${host}/legal/terms`, changeFrequency: "yearly", priority: 0.4 },
    {
      url: `${host}${DEMO_PROFILE.publicPath}`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];
}
