"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function VerifyEmailClient({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || "驗證失敗");
        }
        if (!cancelled) {
          setDone(true);
          router.refresh();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "驗證失敗");
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          信箱已驗證。之後忘記密碼，重設信會寄到這個信箱。
        </p>
        <Link
          href="/settings?verified=1#email"
          className="inline-flex h-10 items-center rounded-xl bg-[var(--ink)] px-4 text-sm font-semibold text-white"
        >
          回到設定
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--danger)]">{error}</p>
        <Link
          href="/settings#email"
          className="inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
        >
          去設定頁重寄驗證信
        </Link>
      </div>
    );
  }

  return <p className="text-sm text-[var(--muted)]">正在驗證信箱…</p>;
}
