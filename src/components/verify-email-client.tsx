"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n-provider";

export function VerifyEmailClient({ token }: { token: string }) {
  const t = useT();
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
          throw new Error(data?.error?.message || t("verify.failed"));
        }
        if (!cancelled) {
          setDone(true);
          router.refresh();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("verify.failed"));
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [token, router, t]);

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-[var(--ink)]">
          {t("verify.ok")}
        </p>
        <Link
          href="/settings?verified=1#email"
          className="inline-flex h-10 items-center rounded-xl bg-[var(--ink)] px-4 text-sm font-semibold text-white"
        >
          {t("verify.backSettings")}
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
          {t("verify.resend")}
        </Link>
      </div>
    );
  }

  return <p className="text-sm text-[var(--muted)]">{t("verify.working")}</p>;
}
