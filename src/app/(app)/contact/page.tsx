import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { BRAND } from "@/shared/tools";
import { getT } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("contact.title"),
    description: t("contact.metaDesc", { brand: BRAND.en, zh: BRAND.zh }),
    alternates: { canonical: "/about" },
    robots: { index: false, follow: true },
  };
}

export default function ContactRedirect() {
  permanentRedirect("/about#contact");
}
