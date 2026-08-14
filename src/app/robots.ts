import type { MetadataRoute } from "next";
import { BRAND } from "@/shared/tools";

export default function robots(): MetadataRoute.Robots {
  const host = `https://${BRAND.domain}`;
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "Mediapartners-Google", allow: "/" },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
