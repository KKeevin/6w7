import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col items-start justify-center px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        這頁不見了
      </h1>
      <p className="mt-3 text-[var(--muted)]">
        連結可能被關掉了，或者本來就不存在。
      </p>
      <Link href="/" className="mt-8 text-sm font-semibold text-[var(--mint)]">
        回首頁
      </Link>
    </main>
  );
}
