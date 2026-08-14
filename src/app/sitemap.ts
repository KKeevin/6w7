import type { MetadataRoute } from "next";
import { DEMO_MESSAGES, DEMO_PROFILE } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = `https://${BRAND.domain}`;
  return [
    { url: host, changeFrequency: "weekly", priority: 1 },
    { url: `${host}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${host}/legal/privacy`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${host}/legal/terms`, changeFrequency: "yearly", priority: 0.4 },
    {
      url: `${host}${DEMO_PROFILE.dashboardPath}`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${host}${DEMO_PROFILE.inboxPath}`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${host}${DEMO_PROFILE.settingsPath}`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${host}${DEMO_PROFILE.publicPath}`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...DEMO_MESSAGES.map((m) => ({
      url: `${host}${DEMO_PROFILE.inboxPath}/${m.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
