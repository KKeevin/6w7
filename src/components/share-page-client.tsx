"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ASK_LIMITS, BRAND } from "@/shared/tools";
import { getDemoShareProfile } from "@/shared/demo-account";
import { StickerLayer } from "@/components/sticker-layer";
import type { PublicSticker } from "@/shared/page-stickers";
import type { ShareStoryDialogProps } from "@/components/share-story-dialog";
import { IgShareGuideHint } from "@/components/ig-share-guide-hint";
import {
  hideIgShareGuideHint,
  isIgShareGuideHintHidden,
  resetDemoIgShareGuideHint,
} from "@/lib/ig-share-guide-hint";
import { imageSelectionError, uploadErrorMessage } from "@/lib/image-upload";
import { AlertToast } from "@/components/alert-toast";
import { AvatarCropDialog } from "@/components/avatar-crop-dialog";
import { useUniformFitScale } from "@/lib/uniform-fit-scale";
import { useI18n } from "@/components/i18n-provider";

const ShareStoryDialog = dynamic(
  () =>
    import("@/components/share-story-dialog").then((m) => m.ShareStoryDialog),
  { ssr: false },
) as ComponentType<ShareStoryDialogProps>;

const IgShareGuideDialog = dynamic(
  () =>
    import("@/components/ig-share-guide-dialog").then(
      (m) => m.IgShareGuideDialog,
    ),
  { ssr: false },
);

type Profile = {
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  link: {
    id: string;
    slug: string;
    title: string;
    prompt: string;
    acceptingMessages: boolean;
    url: string;
    topics?: string[];
    requireTopic?: boolean;
  };
  stickers?: PublicSticker[];
};

export function SharePageClient({
  demo = false,
  isDemoAccount = false,
  forceGuideHint = false,
  initialProfile,
}: {
  demo?: boolean;
  /** 已登入的示範帳號（真實 session）；與僅供預覽的 demo 不同 */
  isDemoAccount?: boolean;
  /** 剛用示範帳號登入，這次要再跳出限動教學提示 */
  forceGuideHint?: boolean;
  initialProfile?: Profile;
}) {
  const { t, locale } = useI18n();
  const demoProfile = demo ? getDemoShareProfile(locale) : null;
  const seeded = demoProfile ?? initialProfile ?? null;
  const fileRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const previewSectionRef = useRef<HTMLElement>(null);
  const previewEndRef = useRef<HTMLDivElement>(null);
  const mobileGuideRef = useRef<HTMLButtonElement>(null);
  const desktopGuideRef = useRef<HTMLButtonElement>(null);
  const desktopSlotRef = useRef<HTMLDivElement>(null);
  const desktopBoardRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile | null>(seeded);
  const [prompt, setPrompt] = useState(seeded?.link.prompt ?? "");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [loading, setLoading] = useState(!seeded);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [guideHintOpen, setGuideHintOpen] = useState(false);
  /** 手機：尚未捲到「調整公開頁」時顯示引導 */
  const [showPreviewHint, setShowPreviewHint] = useState(true);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const desktopFit = useUniformFitScale(
    desktopSlotRef,
    desktopBoardRef,
    !loading && Boolean(profile),
  );
  const dismissError = useCallback(() => setError(null), []);
  const cancelCrop = useCallback(() => setCropFile(null), []);

  async function load() {
    if (demo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || t("common.loadFailed"));
      setProfile(data);
      setPrompt(data.link.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoOverlay() {
    try {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      if (!res.ok) return;
      setProfile(data);
      setPrompt(data.link.prompt);
    } catch {
      /* 沙盒 overlay 載入失敗時維持官方示範 */
    }
  }

  useEffect(() => {
    if (demo || seeded) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  useEffect(() => {
    if (demo || !isDemoAccount) return;
    void loadDemoOverlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, isDemoAccount, locale]);

  useEffect(() => {
    if (isDemoAccount) return;
    if (!seeded) return;
    setProfile(seeded);
    setPrompt(seeded.link.prompt);
  }, [isDemoAccount, locale, seeded?.link.prompt]);

  useEffect(() => {
    if (editingPrompt && promptRef.current) {
      promptRef.current.focus();
      promptRef.current.select();
    }
  }, [editingPrompt]);

  useEffect(() => {
    const section = previewSectionRef.current;
    const end = previewEndRef.current;
    if (!section || !end || loading || !profile) return;

    const hide = () => setShowPreviewHint(false);
    // 扣除懸浮 footer，避免誤判／永遠看不到最底
    const rootMargin = "0px 0px -72px 0px";

    // 整塊都進「可視區」才消失
    const fullObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.intersectionRatio >= 1) hide();
      },
      { threshold: 1, rootMargin },
    );
    fullObserver.observe(section);

    // 區塊比螢幕高時：捲到區塊最底部也算看完完整內容
    const endObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) hide();
      },
      { threshold: 0, rootMargin },
    );
    endObserver.observe(end);

    return () => {
      fullObserver.disconnect();
      endObserver.disconnect();
    };
  }, [loading, profile]);

  const hintUserId = profile?.user.id ?? seeded?.user.id;

  useEffect(() => {
    if (!hintUserId) return;
    if (isDemoAccount) {
      if (forceGuideHint) resetDemoIgShareGuideHint();
      if (isIgShareGuideHintHidden(hintUserId, { demo: true })) return;
    } else if (isIgShareGuideHintHidden(hintUserId)) {
      return;
    }
    const t = window.setTimeout(() => setGuideHintOpen(true), 400);
    return () => window.clearTimeout(t);
  }, [hintUserId, isDemoAccount, forceGuideHint]);

  useEffect(() => {
    if (!forceGuideHint || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("guideHint")) return;
    url.searchParams.delete("guideHint");
    const qs = url.searchParams.toString();
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`,
    );
  }, [forceGuideHint]);

  function scrollToPreview() {
    previewSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function savePrompt(next: string) {
    if (demo) {
      setEditingPrompt(false);
      return;
    }
    const trimmed = next.trim();
    if (!trimmed || !profile || trimmed === profile.link.prompt) {
      setPrompt(profile?.link.prompt || "");
      setEditingPrompt(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || t("common.saveFailed"));
      setProfile((p) => (p ? { ...p, link: data.link } : p));
      setPrompt(data.link.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.saveFailed"));
      setPrompt(profile.link.prompt);
    } finally {
      setSaving(false);
      setEditingPrompt(false);
    }
  }

  async function toggleAccepting() {
    if (demo || !profile) return;
    const res = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acceptingMessages: !profile.link.acceptingMessages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || t("common.updateFailed"));
      return;
    }
    setProfile((p) => (p ? { ...p, link: data.link } : p));
  }

  /** 選好檔先進裁切視窗，確定後才上傳 */
  function onAvatarPick(file: File | null) {
    if (fileRef.current) fileRef.current.value = "";
    if (demo || !file) return;
    const problem = imageSelectionError(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setCropFile(file);
  }

  async function uploadAvatar(cropped: File) {
    setCropFile(null);
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", cropped);
      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await uploadErrorMessage(res, t("common.uploadFailed")));
      const data = await res.json();
      setProfile((p) =>
        p ? { ...p, user: { ...p.user, image: data.user.image } } : p,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function copyLink() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openGuide() {
    setGuideOpen(true);
    dismissGuideHint();
  }

  function dismissGuideHint() {
    const id = profile?.user.id ?? seeded?.user.id;
    if (id) hideIgShareGuideHint(id, { demo: isDemoAccount });
    setGuideHintOpen(false);
  }

  if (loading) {
    return (
      <div className="flex w-full flex-1 py-16">
        <p className="text-sm text-[var(--muted)]">{t("common.loading")}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex w-full flex-1 py-16">
        <p className="text-sm text-[var(--danger)]">{error || t("common.cannotLoad")}</p>
      </div>
    );
  }

  const imageSrc = profile.user.image || null;
  const shortUrl = profile.link.url.replace(/^https?:\/\//, "");
  const accepting = profile.link.acceptingMessages;
  const publicHref = `/${profile.user.username}`;
  const dressHref = `${publicHref}?edit=1`;

  /** compact：桌機側欄預覽（自然高度，矮螢幕可整頁捲動） */
  const previewPanel = (compact: boolean) => (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(20,33,43,0.07)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 sm:px-4">
        <span className="text-xs font-semibold tracking-wide text-[var(--muted)]">
          {t("share.visitorSee")}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {!demo ? (
            <Link
              href={dressHref}
              className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-white"
            >
              {t("share.goDecorate")}
            </Link>
          ) : null}
          <Link
            href={publicHref}
            target="_blank"
            className="inline-flex h-8 items-center rounded-lg px-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-white"
          >
            {t("common.openPublic")}
            <span className="ml-0.5" aria-hidden>
              ↗
            </span>
          </Link>
        </span>
      </div>

      {/* 與公開頁 /[slug] 相同配置；桌機側欄放大頭貼與文字 */}
      <div
        className={`bg-atmosphere relative mx-auto flex w-full max-w-lg flex-col overflow-hidden px-4 sm:px-6 ${
          compact ? "px-5 py-7 sm:px-6" : "py-8 sm:py-10"
        }`}
      >
        <StickerLayer stickers={profile.stickers ?? []} />
        <div className="inline-flex items-center gap-2">
          <BrandLogo height={compact ? 28 : 26} />
          <span
            className={`font-medium text-[var(--muted)] ${
              compact ? "text-base" : "text-sm"
            }`}
          >
            {BRAND.zh}
          </span>
        </div>

        <div
          className={`flex flex-col items-center text-center ${
            compact ? "mt-7" : "mt-8"
          }`}
        >
          <button
            type="button"
            className="group relative"
            onClick={() => {
              if (!demo) fileRef.current?.click();
            }}
            aria-label={demo ? t("demo.avatar") : t("share.uploadAvatar")}
          >
            <div
              className={`overflow-hidden rounded-full border-2 border-[var(--line)] bg-[var(--surface)] transition group-hover:border-[var(--mint)] ${
                compact ? "h-32 w-32 border-[3px]" : "h-24 w-24"
              }`}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt=""
                  width={compact ? 128 : 96}
                  height={compact ? 128 : 96}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center font-bold text-[var(--muted)] ${
                    compact ? "text-4xl" : "text-2xl"
                  }`}
                >
                  {uploading
                    ? "…"
                    : (profile.user.name || profile.user.username)
                        .slice(0, 1)
                        .toUpperCase()}
                </div>
              )}
            </div>
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-[var(--ink)]/45 font-semibold text-white opacity-0 transition group-hover:opacity-100 ${
                compact ? "text-sm" : "text-xs"
              }`}
            >
              {demo ? t("demo.account") : uploading ? t("share.uploading") : t("share.changeAvatar")}
            </span>
          </button>

          <p
            className={`mt-3 text-[var(--muted)] ${
              compact ? "text-base" : "text-sm"
            }`}
          >
            @{profile.user.username}
          </p>

          {editingPrompt && !demo ? (
            <div className="mt-4 w-full">
              <textarea
                ref={promptRef}
                value={prompt}
                maxLength={ASK_LIMITS.promptMax}
                rows={3}
                disabled={saving}
                onChange={(e) => setPrompt(e.target.value)}
                onBlur={() => void savePrompt(prompt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void savePrompt(prompt);
                  }
                  if (e.key === "Escape") {
                    setPrompt(profile.link.prompt);
                    setEditingPrompt(false);
                  }
                }}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-center font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--ink)] outline-none ring-[var(--ring)] focus:ring-2"
                aria-label={t("share.editPrompt")}
              />
              <span className="mt-1.5 block text-center text-[11px] text-[var(--muted)]">
                {t("share.promptKeys")}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="group mt-4 w-full rounded-xl px-2 py-1 transition hover:bg-[var(--ink)]/[0.03]"
              onClick={() => {
                if (!demo) setEditingPrompt(true);
              }}
            >
              <h2 className="text-balance font-[family-name:var(--font-display)] text-2xl font-bold leading-tight">
                {saving ? t("common.saving") : prompt}
              </h2>
              <span className="mt-2 inline-flex items-center rounded-full border border-[var(--line)] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)] group-hover:border-[var(--mint)] group-hover:text-[var(--mint)]">
                {demo ? t("demo.prompt") : t("share.clickPrompt")}
              </span>
            </button>
          )}
        </div>

        <p
          className={`mt-4 text-center text-[var(--muted)] ${
            compact ? "text-sm" : "text-xs"
          }`}
        >
          {t("share.anonReassure")}
        </p>

        {!accepting ? (
          <p
            className={`rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 px-4 text-sm text-[var(--muted)] ${
              compact ? "mt-5 py-5" : "mt-8 py-6"
            }`}
          >
            {t("share.closed")}
          </p>
        ) : (
          <div
            className={`space-y-4 ${compact ? "mt-5" : "mt-8"}`}
            aria-hidden
          >
            {(profile.link.topics?.length ?? 0) > 0 ? (
              <div>
                <Label className={compact ? "text-sm" : undefined}>
                  {t("share.topic")}
                  {profile.link.requireTopic
                    ? t("common.required")
                    : t("common.optional")}
                </Label>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {profile.link.topics?.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <Label className={compact ? "text-sm" : undefined}>{t("share.anonMessage")}</Label>
              <Textarea
                disabled
                tabIndex={-1}
                placeholder={t("share.placeholder")}
                className={`pointer-events-none ${
                  compact ? "mt-1.5 min-h-[100px] text-base" : ""
                }`}
              />
              <p className="mt-1 text-right text-xs tabular-nums text-[var(--muted)]">
                0/{ASK_LIMITS.bodyMax}
              </p>
            </div>
            <Button
              type="button"
              className={`w-full ${compact ? "h-12 text-base" : ""}`}
              disabled
            >
              {t("share.sendAnon")}
            </Button>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              {t("share.anonNote")}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-1 flex-col py-6 lg:py-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onAvatarPick(e.target.files?.[0] || null)}
      />

      <AlertToast message={error} onClose={dismissError} />

      {cropFile ? (
        <AvatarCropDialog
          key={`${cropFile.name}-${cropFile.size}-${cropFile.lastModified}`}
          file={cropFile}
          onCancel={cancelCrop}
          onConfirm={(cropped) => void uploadAvatar(cropped)}
        />
      ) : null}

      {/* ── 手機：連結優先 → 操作 → 預覽 ── */}
      <div className="space-y-5 lg:hidden">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mint)]">
            {t("share.brandAsk", { brand: BRAND.en })}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            {t("share.yourLink")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("share.mobileHint")}
          </p>
        </header>

        <section className="animate-rise-delay overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
          <div className="border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-white">
            <p className="text-[11px] font-medium text-white/60">{t("share.shortUrlLabel")}</p>
            <p className="mt-0.5 break-all font-mono text-sm font-semibold tracking-wide">
              {shortUrl}
            </p>
          </div>
          <div className="space-y-2 p-3">
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={() => void copyLink()}
            >
              {copied ? t("common.copiedClipboard") : t("share.copyLink")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setStoryOpen(true)}
            >
              {t("share.shareIg")}
            </Button>
            <Button
              ref={mobileGuideRef}
              type="button"
              variant="outline"
              className="w-full"
              onClick={openGuide}
            >
              {t("share.howIg")}
            </Button>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t("share.acceptingTitle")}</p>
            <p className="text-xs text-[var(--muted)]">
              {accepting ? t("share.acceptingOn") : t("share.acceptingOff")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={accepting}
            onClick={() => void toggleAccepting()}
            className={`relative h-8 w-14 rounded-full transition-colors ${
              accepting ? "bg-[var(--mint)]" : "bg-[var(--line)]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                accepting ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <section
          ref={previewSectionRef}
          id="public-preview"
          className="scroll-mt-20"
        >
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">
            {t("share.adjustLook")}
          </h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            {t("share.adjustHint")}
          </p>
          {previewPanel(false)}
          <div ref={previewEndRef} className="h-px w-full" aria-hidden />
        </section>

        {showPreviewHint && !guideHintOpen && (
          <div className="pointer-events-none fixed inset-x-0 bottom-[4.25rem] z-30 flex justify-center px-4 lg:hidden">
            <button
              type="button"
              onClick={scrollToPreview}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition active:scale-[0.98]"
            >
              {t("share.scrollCue")}
              <span className="animate-scroll-cue" aria-hidden>
                ↓
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── 桌機：左控制台／右即時預覽（自然高度，矮螢幕可整頁捲動） ── */}
      <div
        ref={desktopSlotRef}
        className="hidden lg:flex lg:min-h-[calc(100dvh-var(--header-h)-var(--footer-h)-1rem)] lg:flex-1 lg:items-center lg:justify-center"
      >
        <div
          style={
            desktopFit.width
              ? {
                  width: desktopFit.width * desktopFit.scale,
                  height: desktopFit.height * desktopFit.scale,
                  flexShrink: 0,
                }
              : { width: "100%" }
          }
        >
          <div
            ref={desktopBoardRef}
            className="grid w-full grid-cols-[minmax(0,1fr)_minmax(360px,440px)] items-start gap-10 xl:gap-12"
            style={
              desktopFit.width
                ? {
                    width: desktopFit.width,
                    transform: `scale(${desktopFit.scale})`,
                    transformOrigin: "top left",
                  }
                : undefined
            }
          >
        <div className="animate-rise space-y-7 xl:space-y-8">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--mint)]">
              {t("share.kicker")}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight xl:text-[2.75rem] xl:leading-tight">
              {t("share.title1")}
              <br />
              {t("share.title2")}
            </h1>
            <p className="mt-3 max-w-lg text-lg text-[var(--muted)]">
              {t("share.lead")}
            </p>
          </header>

          <section className="rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_16px_40px_rgba(20,33,43,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">{t("share.cardTitle")}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {t("share.cardHint")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Button
                  type="button"
                  role="switch"
                  aria-checked={accepting}
                  aria-label={
                    accepting ? t("share.toggleOn") : t("share.toggleOff")
                  }
                  title={t("share.toggleTitle")}
                  size="sm"
                  variant={accepting ? "default" : "outline"}
                  onClick={() => void toggleAccepting()}
                  className={
                    accepting
                      ? "animate-accepting-hint bg-[var(--mint)] text-white hover:brightness-95"
                      : "animate-closed-hint text-[var(--muted)]"
                  }
                >
                  {accepting
                    ? t("share.acceptingShortOn")
                    : t("share.acceptingShortOff")}
                </Button>
                <span className="text-[10px] font-medium text-[var(--muted)]">
                  {t("share.toggleHint")}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 font-mono text-base font-semibold tracking-wide text-[var(--ink)]">
                <span className="truncate">{shortUrl}</span>
              </div>
              <Button
                type="button"
                size="lg"
                className="h-12 shrink-0 px-7 text-base"
                onClick={() => void copyLink()}
              >
                {copied ? t("common.copied") : t("common.copy")}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-base"
                onClick={() => setStoryOpen(true)}
              >
                {t("share.shareIg")}
              </Button>
              <Button
                ref={desktopGuideRef}
                type="button"
                variant="outline"
                className="h-12 text-base"
                onClick={openGuide}
              >
                {t("share.igGuide")}
              </Button>
            </div>
            <Link
              href={`/${profile.user.username}`}
              target="_blank"
              className="mt-2.5 inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--line)] bg-transparent text-base font-semibold text-[var(--ink)] transition-all hover:bg-[var(--surface)] active:scale-[0.98]"
            >
              {t("share.previewPublic")}
            </Link>
          </section>

          <section className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 px-7 py-6">
            <h2 className="text-base font-semibold">{t("share.howToTitle")}</h2>
            <ol className="mt-3 space-y-2.5 text-base text-[var(--muted)]">
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">01</span>
                {t("share.step1")}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">02</span>
                {t("share.step2")}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">03</span>
                {t("share.step3")}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">04</span>
                {t("share.step4")}
              </li>
            </ol>
          </section>
        </div>

        <aside className="animate-rise-delay">
          {previewPanel(true)}
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            {t("share.previewFoot")}
          </p>
        </aside>
          </div>
        </div>
      </div>

      <ShareStoryDialog
        open={storyOpen}
        onClose={() => setStoryOpen(false)}
        username={profile.user.username}
        prompt={prompt || profile.link.prompt}
        imageUrl={imageSrc}
        displayName={profile.user.name}
        shortUrl={shortUrl}
        onCopiedLink={() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        onOpenGuide={openGuide}
      />

      <IgShareGuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        copied={copied}
        onCopyLink={() => {
          void copyLink();
        }}
        onShareStory={() => setStoryOpen(true)}
      />

      <IgShareGuideHint
        open={guideHintOpen && !guideOpen && !storyOpen}
        mobileRef={mobileGuideRef}
        desktopRef={desktopGuideRef}
        onDismiss={dismissGuideHint}
      />
    </div>
  );
}
