import Link from "next/link";
import { getT } from "@/lib/locale";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col items-start justify-center px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        {t("notFound.title")}
      </h1>
      <p className="mt-3 text-[var(--muted)]">{t("notFound.body")}</p>
      <Link href="/" className="mt-8 text-sm font-semibold text-[var(--mint)]">
        {t("common.home")}
      </Link>
    </main>
  );
}
