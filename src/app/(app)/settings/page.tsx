import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { getViewer } from "@/lib/viewer";
import { getT } from "@/lib/locale";
import { loginPath } from "@/shared/paths";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { SettingsEmailForm } from "@/components/settings-email-form";
import { getProfileForOwner } from "@/services/ask-link.service";
import { SHELL_CONTENT } from "@/shared/shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("settings.title") };
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.6-3.2 4.2-4.8 6.5-4.8s4.9 1.6 6.5 4.8" />
    </svg>
  );
}

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (viewer.kind === "guest") {
    redirect(loginPath("/settings"));
  }

  const profile = await getProfileForOwner(viewer.user.id);
  const username = profile.user.username;
  const shortUrl = profile.link.url.replace(/^https?:\/\//, "");
  const fullUrl = profile.link.url.startsWith("http")
    ? profile.link.url
    : `https://${shortUrl}`;
  const imageSrc = profile.user.image || null;
  const accepting = profile.link.acceptingMessages;
  const demo = viewer.kind === "demo";
  const t = await getT();

  return (
    <main className="bg-atmosphere flex flex-1 flex-col py-8 sm:py-10 lg:py-12">
      <div className={`${SHELL_CONTENT} w-full`}>
        <header className="mb-6 sm:mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight lg:text-4xl">
            {t("settings.heading")}
          </h1>
        </header>

        <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(20,33,43,0.06)]">
          <div className="bg-atmosphere px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-5 lg:gap-6">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-[var(--surface)] shadow-md sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
                    <UserIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="mt-4 min-w-0 sm:mt-0">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight lg:text-3xl">
                  @{username}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)] lg:text-base">
                  {accepting ? t("settings.acceptingOn") : t("settings.acceptingOff")}
                  {demo ? ` · ${t("demo.account")}` : ""}
                </p>
                <Link
                  href="/dashboard"
                  className="mt-3 inline-flex text-sm font-semibold text-[var(--mint)] underline-offset-2 hover:underline lg:text-base"
                >
                  {t("settings.goShare")}
                </Link>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--line)]">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                  {t("share.cardTitle")}
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-[var(--ink)]">
                  {shortUrl}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <CopyLinkButton url={fullUrl} />
                <Link
                  href={`/${username}`}
                  target="_blank"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--ink)] px-3 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90 active:scale-[0.98]"
                >
                  {t("common.openPublic")}
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
                  {t("share.acceptingTitle")}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                  {accepting ? t("settings.openOn") : t("settings.openOff")}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  accepting
                    ? "bg-[var(--mint)]/15 text-[var(--mint)]"
                    : "bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {accepting ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </section>

        <section
          id="email"
          className="mt-6 scroll-mt-24 overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(20,33,43,0.06)]"
        >
          <div className="border-b border-[var(--line)] px-5 py-4 sm:px-8">
            <p className="text-sm font-semibold text-[var(--ink)]">{t("settings.emailRescue")}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {demo ? t("settings.emailDemo") : t("settings.emailHint")}
            </p>
          </div>
          <div className="px-5 py-5 sm:px-8">
            <Suspense
              fallback={
                <p className="text-sm text-[var(--muted)]">{t("settings.emailLoading")}</p>
              }
            >
              <SettingsEmailForm
                initialEmail={profile.user.email}
                initialVerified={Boolean(profile.user.emailVerified)}
                disabled={demo}
              />
            </Suspense>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white px-5 py-5 sm:px-8">
          <p className="text-sm font-semibold text-[var(--ink)]">
            {demo ? t("settings.logoutDemoTitle") : t("settings.logoutTitle")}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {demo ? t("settings.logoutDemoHint") : t("settings.logoutHint")}
          </p>
          <form
            className="mt-4"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              {t("settings.logout")}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
