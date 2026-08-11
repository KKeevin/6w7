"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ShareStoryDialog } from "@/components/share-story-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ASK_LIMITS, BRAND } from "@/shared/tools";

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
  };
};

export function SharePageClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const previewSectionRef = useRef<HTMLElement>(null);
  const previewEndRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prompt, setPrompt] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  /** 手機：尚未捲到「調整公開頁」時顯示引導 */
  const [showPreviewHint, setShowPreviewHint] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "載入失敗");
      setProfile(data);
      setPrompt(data.link.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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

  function scrollToPreview() {
    previewSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function savePrompt(next: string) {
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
      if (!res.ok) throw new Error(data?.error?.message || "儲存失敗");
      setProfile((p) => (p ? { ...p, link: data.link } : p));
      setPrompt(data.link.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
      setPrompt(profile.link.prompt);
    } finally {
      setSaving(false);
      setEditingPrompt(false);
    }
  }

  async function toggleAccepting() {
    if (!profile) return;
    const res = await fetch("/api/v1/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acceptingMessages: !profile.link.acceptingMessages,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error?.message || "更新失敗");
      return;
    }
    setProfile((p) => (p ? { ...p, link: data.link } : p));
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "上傳失敗");
      setProfile((p) =>
        p ? { ...p, user: { ...p.user, image: data.user.image } } : p,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function copyLink() {
    if (!profile) return;
    await navigator.clipboard.writeText(profile.link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openGuide() {
    setGuideStep(0);
    setGuideOpen(true);
  }

  const steps = [
    {
      title: "產生限動分享圖",
      body: "回到本頁按「分享到 IG 限動」。手機會跳出系統分享選單；電腦則會下載 PNG。",
    },
    {
      title: "選 Instagram → 限動",
      body: "在系統分享選單裡選 Instagram，再選「限動／Story」，圖會直接進限動編輯畫面。若沒出現選項，可先「儲存圖像」再到 IG 開限動上傳。",
    },
    {
      title: "加上「連結」貼紙",
      body: profile
        ? `編輯畫面點貼紙 →「連結」，貼上 ${profile.link.url.replace(/^https?:\/\//, "")}（可用下方按鈕先複製）。`
        : "編輯畫面點貼紙 →「連結」，貼上你的 6w7 短網址。",
    },
    {
      title: "發佈，開始收訊息",
      body: "把連結貼紙放到好點的位置後發佈；訪客點連結就能匿名留言到你的收件匣。",
    },
  ];

  if (loading) {
    return (
      <div className="flex w-full flex-1 py-16">
        <p className="text-sm text-[var(--muted)]">載入中…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex w-full flex-1 py-16">
        <p className="text-sm text-[var(--danger)]">{error || "無法載入"}</p>
      </div>
    );
  }

  const imageSrc = profile.user.image
    ? `${profile.user.image}${profile.user.image.includes("?") ? "" : `?v=${profile.user.id}`}`
    : null;
  const shortUrl = profile.link.url.replace(/^https?:\/\//, "");
  const accepting = profile.link.acceptingMessages;

  /** compact：桌機側欄預覽（自然高度，矮螢幕可整頁捲動） */
  const previewPanel = (compact: boolean) => (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white shadow-[0_20px_50px_rgba(20,33,43,0.08)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)]/70 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="text-xs font-semibold tracking-wide text-[var(--muted)]">
          訪客會看到的樣子
        </span>
        <Link
          href={`/${profile.user.username}`}
          target="_blank"
          className="text-xs font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
        >
          開公開頁 ↗
        </Link>
      </div>

      {/* 與公開頁 /[slug] 相同配置；桌機側欄放大頭貼與文字 */}
      <div
        className={`bg-atmosphere mx-auto flex w-full max-w-lg flex-col px-4 sm:px-6 ${
          compact ? "px-5 py-7 sm:px-6" : "py-10"
        }`}
      >
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
            compact ? "mt-7" : "mt-10"
          }`}
        >
          <button
            type="button"
            className="group relative"
            onClick={() => fileRef.current?.click()}
            aria-label="上傳大頭貼"
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
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 font-semibold text-white opacity-0 transition group-hover:opacity-100 ${
                compact ? "text-sm" : "text-xs"
              }`}
            >
              {uploading ? "上傳中…" : "更換頭貼"}
            </span>
          </button>

          <p
            className={`mt-4 text-[var(--muted)] ${
              compact ? "text-base" : "text-sm"
            }`}
          >
            @{profile.user.username}
          </p>

          {editingPrompt ? (
            <div className="mt-4 w-full">
              <textarea
                ref={promptRef}
                value={prompt}
                maxLength={ASK_LIMITS.promptMax}
                rows={compact ? 3 : 3}
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
                className={`w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-center font-[family-name:var(--font-display)] font-bold leading-tight text-[var(--ink)] outline-none ring-[var(--ring)] focus:ring-2 ${
                  compact ? "text-2xl" : "text-2xl"
                }`}
                aria-label="編輯提示文案"
              />
              <span className="mt-1.5 block text-center text-[11px] text-[var(--muted)]">
                Enter 儲存 · Esc 取消
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="group mt-4 w-full rounded-lg px-1 transition hover:bg-black/[0.03]"
              onClick={() => setEditingPrompt(true)}
            >
              <h1
                className={`font-[family-name:var(--font-display)] font-bold leading-tight ${
                  compact ? "text-2xl" : "text-2xl"
                }`}
              >
                {saving ? "儲存中…" : prompt}
              </h1>
              <span
                className={`mt-1.5 inline-flex items-center gap-1 font-medium text-[var(--mint)] opacity-80 group-hover:opacity-100 ${
                  compact ? "text-xs" : "text-[11px]"
                }`}
              >
                <span aria-hidden>✎</span>
                點擊修改提示
              </span>
            </button>
          )}
        </div>

        <p
          className={`mt-4 text-center text-[var(--muted)] ${
            compact ? "text-sm" : "text-xs"
          }`}
        >
          匿名留言，對方只會在收件匣看到內容。
        </p>

        {!accepting ? (
          <p
            className={`rounded-xl border border-[var(--line)] bg-[var(--surface)]/60 px-4 text-sm text-[var(--muted)] ${
              compact ? "mt-5 py-5" : "mt-8 py-6"
            }`}
          >
            此連結目前不接受留言。主人可能暫時關閉了收件。
          </p>
        ) : (
          <div
            className={`space-y-3 ${compact ? "mt-5 space-y-3.5" : "mt-8 space-y-4"}`}
            aria-hidden
          >
            <div>
              <Label className={compact ? "text-sm" : undefined}>匿名留言</Label>
              <Textarea
                disabled
                tabIndex={-1}
                placeholder="說吧，對方只會在收件匣看到內容。"
                className={`pointer-events-none ${
                  compact ? "mt-1.5 min-h-[100px] text-base" : ""
                }`}
              />
              <p className="mt-1 text-right text-xs text-[var(--muted)]">
                0/{ASK_LIMITS.bodyMax}
              </p>
            </div>
            <Button
              type="button"
              className={`w-full ${compact ? "h-12 text-base" : ""}`}
              disabled
            >
              匿名送出
            </Button>
            {!compact && (
              <p className="text-xs text-[var(--muted)]">
                匿名對主人顯示；系統為防濫用可能保留必要技術資料。請勿發送違法或傷害他人的內容。
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full py-6 lg:origin-top lg:py-7 lg:[zoom:1.03]">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onAvatarChange(e.target.files?.[0] || null)}
      />

      {error && (
        <p className="mb-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}

      {/* ── 手機：連結優先 → 操作 → 預覽 ── */}
      <div className="space-y-5 lg:hidden">
        <header className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mint)]">
            {BRAND.en} · 匿名問答
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            你的專屬連結
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            複製短網址，或用分享圖一鍵丟到 IG 限動。
          </p>
        </header>

        <section className="animate-rise-delay overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
          <div className="border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-white">
            <p className="text-[11px] font-medium text-white/60">短網址</p>
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
              {copied ? "已複製到剪貼簿" : "複製連結"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setStoryOpen(true)}
            >
              分享到 IG 限動
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={openGuide}
            >
              怎麼發到 IG 限動？
            </Button>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">收件狀態</p>
            <p className="text-xs text-[var(--muted)]">
              {accepting ? "目前開放匿名留言" : "已暫停收件"}
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
            調整公開頁樣貌
          </h2>
          {previewPanel(false)}
          <div ref={previewEndRef} className="h-px w-full" aria-hidden />
        </section>

        {showPreviewHint && (
          <div className="pointer-events-none fixed inset-x-0 bottom-[4.25rem] z-30 flex justify-center px-4 lg:hidden">
            <button
              type="button"
              onClick={scrollToPreview}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition active:scale-[0.98]"
            >
              往下調整公開頁內容
              <span className="animate-scroll-cue" aria-hidden>
                ↓
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── 桌機：左控制台／右即時預覽（自然高度，矮螢幕可整頁捲動） ── */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-start lg:gap-10 xl:gap-12">
        <div className="animate-rise space-y-7 xl:space-y-8">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--mint)]">
              匿名問答
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight xl:text-[2.75rem] xl:leading-tight">
              把連結丟出去，
              <br />
              訊息會進收件匣。
            </h1>
            <p className="mt-3 max-w-lg text-lg text-[var(--muted)]">
              這頁管的是「別人怎麼找到你」——複製網址、用分享圖丟到 IG
              限動，或先微調公開頁文案。
            </p>
          </header>

          <section className="rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[0_16px_40px_rgba(20,33,43,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">專屬短網址</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  對應你的 IG 帳號，註冊後固定不變
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Button
                  type="button"
                  role="switch"
                  aria-checked={accepting}
                  aria-label={
                    accepting
                      ? "收件中，點一下可關閉收件"
                      : "已關閉，點一下可重新開放收件"
                  }
                  title="點一下可切換收件"
                  size="sm"
                  variant={accepting ? "default" : "outline"}
                  onClick={() => void toggleAccepting()}
                  className={
                    accepting
                      ? "animate-accepting-hint bg-[var(--mint)] text-white hover:brightness-95"
                      : "animate-closed-hint text-[var(--muted)]"
                  }
                >
                  {accepting ? "收件中" : "已關閉"}
                </Button>
                <span className="text-[10px] font-medium text-[var(--muted)]">
                  點一下可切換
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
                {copied ? "已複製" : "複製"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-base"
                onClick={() => setStoryOpen(true)}
              >
                分享到 IG 限動
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-base"
                onClick={openGuide}
              >
                限動教學
              </Button>
            </div>
            <Link
              href={`/${profile.user.username}`}
              target="_blank"
              className="mt-2.5 inline-flex h-12 w-full items-center justify-center rounded-xl border border-[var(--line)] bg-transparent text-base font-semibold text-[var(--ink)] transition-all hover:bg-[var(--surface)] active:scale-[0.98]"
            >
              預覽公開頁
            </Link>
          </section>

          <section className="rounded-3xl border border-dashed border-[var(--line)] bg-white/60 px-7 py-6">
            <h2 className="text-base font-semibold">建議分享方式</h2>
            <ol className="mt-3 space-y-2.5 text-base text-[var(--muted)]">
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">01</span>
                按「分享到 IG 限動」→ 系統分享選 Instagram → 限動
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">02</span>
                在限動加上「連結」貼紙，貼上上方短網址
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-[var(--accent)]">03</span>
                發佈後到「收件匣」看匿名訊息
              </li>
            </ol>
          </section>
        </div>

        <aside className="animate-rise-delay lg:sticky lg:top-4">
          {previewPanel(true)}
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            點頭貼換圖，點提示文字就能編輯
          </p>
        </aside>
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
      />

      {guideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false);
          }}
        >
          <div className="animate-rise w-full max-w-[22rem] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(20,33,43,0.22)]">
            <div className="h-1.5 bg-gradient-to-r from-[var(--mint)] via-[#3197e5] to-[var(--accent)]" />

            <div className="px-5 pb-5 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--mint)]">
                    {BRAND.en.toUpperCase()} GUIDE
                  </p>
                  <h3
                    id="guide-title"
                    className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
                  >
                    怎麼發到 IG 限動
                  </h3>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                  onClick={() => setGuideOpen(false)}
                  aria-label="關閉"
                >
                  ✕
                </button>
              </div>

              <p className="mt-4 text-[11px] text-[var(--muted)]">
                點任一步驟可切換說明
              </p>
              <ol className="mt-2 space-y-2">
                {steps.map((step, i) => {
                  const active = i === guideStep;
                  return (
                    <li key={step.title}>
                      <button
                        type="button"
                        onClick={() => setGuideStep(i)}
                        aria-current={active ? "step" : undefined}
                        className={`flex w-full gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-[var(--mint)]/40 bg-[var(--mint)]/12 shadow-sm"
                            : "border-transparent bg-[var(--surface)]/70 opacity-70 hover:border-[var(--line)] hover:opacity-100"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            active
                              ? "bg-[var(--mint)] text-white"
                              : "bg-white text-[var(--muted)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-semibold leading-snug ${
                              active
                                ? "text-[var(--ink)]"
                                : "text-[var(--muted)]"
                            }`}
                          >
                            {step.title}
                          </span>
                          {active && (
                            <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                              {step.body}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--line)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void copyLink();
                  }}
                >
                  {copied ? "已複製網址" : "複製短網址"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setGuideOpen(false);
                    setStoryOpen(true);
                  }}
                >
                  分享到 IG 限動
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
