export const START_RITES = ["handoff"] as const;
export type StartRite = (typeof START_RITES)[number];

/** 從底下抬上來：先停用，之後要加回就放進 START_RITES */
export const PARKED_START_RITES = ["lift"] as const;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function leftoverViewportPx() {
  const view = window.visualViewport?.height ?? window.innerHeight;
  const header =
    document.querySelector<HTMLElement>("header")?.offsetHeight ?? 56;
  const footer =
    document.querySelector<HTMLElement>("footer")?.offsetHeight ?? 48;
  return {
    view,
    header,
    footer,
    leftover: Math.max(0, view - header - footer),
  };
}

function visualHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function maxScrollTop() {
  const el = document.scrollingElement ?? document.documentElement;
  return Math.max(0, el.scrollHeight - visualHeight());
}

export function distanceToPageEnd() {
  return maxScrollTop() - window.scrollY;
}

function pinTo(y: number) {
  window.scrollTo({ top: y, behavior: "auto" });
}

let jumpLockAt = 0;

/** 往下滑到下一個磁吸點（略過只在往上才吸的點） */
export function nextHomeMagnetY(fromY = window.scrollY) {
  const stops: number[] = [];
  for (const snap of collectSnaps()) {
    if (snap.dir === -1) continue;
    const last = stops[stops.length - 1];
    if (last == null || snap.y - last > 24) stops.push(snap.y);
  }
  return stops.find((stop) => stop > fromY + 28) ?? null;
}

export function goToHomeMagnet(y: number) {
  jumpLockAt = Date.now();
  pinTo(y);
}

function pinToPageEnd() {
  pinTo(maxScrollTop());
}

const MAGNET_IDLE_MS = 90;
const MAGNET_DESKTOP = "(min-width: 1024px)";
const MAGNET_SETTLED = 14;

type MagnetDir = 1 | -1 | 0;

type MagnetSnap = {
  y: number;
  range: number;
  dir: MagnetDir;
};

function magnetSnapPx() {
  return Math.min(180, Math.max(96, visualHeight() * 0.2));
}

function magnetBlocked() {
  return (
    window.matchMedia(MAGNET_DESKTOP).matches ||
    document.documentElement.dataset.scrollLocked === "1"
  );
}

function clampScroll(y: number) {
  return Math.max(0, Math.min(maxScrollTop(), y));
}

function yAlignTop(el: Element) {
  return clampScroll(
    el.getBoundingClientRect().top + window.scrollY - leftoverViewportPx().header,
  );
}

function yAlignBottom(el: Element) {
  return clampScroll(
    el.getBoundingClientRect().bottom +
      window.scrollY -
      visualHeight() +
      leftoverViewportPx().footer,
  );
}

function mergeSnaps(snaps: MagnetSnap[]) {
  const sorted = [...snaps].sort((a, b) => a.y - b.y);
  const out: MagnetSnap[] = [];
  for (const snap of sorted) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.y - snap.y) < 24) {
      prev.range = Math.max(prev.range, snap.range);
      prev.dir = prev.dir === snap.dir ? prev.dir : 0;
      continue;
    }
    out.push({ ...snap });
  }
  return out;
}

function collectSnaps() {
  const near = magnetSnapPx();
  const leftover = leftoverViewportPx().leftover;
  const wide = Math.min(leftover * 0.5, Math.max(near * 2, leftover * 0.38));
  const snaps: MagnetSnap[] = [];
  const hero = document.getElementById("home-hero");
  const how = document.getElementById("how");
  const sections = ["home-hero", "how", "feat", "start"]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  snaps.push({
    y: 0,
    range: hero ? Math.max(near, hero.offsetHeight * 0.5) : near,
    dir: -1,
  });

  if (how) {
    snaps.push({ y: yAlignTop(how), range: near, dir: 0 });
    how.querySelectorAll<HTMLElement>("[data-home-step]").forEach((step) => {
      if (step.dataset.homeStep === "01") return;
      snaps.push({ y: yAlignTop(step), range: near, dir: 0 });
    });
  }

  const secondLast = sections[sections.length - 2];
  const thirdLast = sections[sections.length - 3];
  if (secondLast) {
    snaps.push({ y: yAlignTop(secondLast), range: near, dir: 0 });
  }
  if (thirdLast) {
    snaps.push({ y: yAlignBottom(thirdLast), range: wide, dir: -1 });
  }

  snaps.push({ y: maxScrollTop(), range: near, dir: 1 });
  return mergeSnaps(snaps);
}

function pickSnap(y: number, dir: MagnetDir) {
  let best: MagnetSnap | null = null;
  let bestDist = Infinity;
  for (const snap of collectSnaps()) {
    if (snap.dir !== 0 && snap.dir !== dir) continue;
    const dist = Math.abs(snap.y - y);
    if (dist <= snap.range && dist < bestDist) {
      best = snap;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * 手機首頁區塊磁吸：頂對 header、底對 footer。
 * 接近頁尾仍貼底，避免工具列進出改 visualViewport 卻捲不到底。
 */
export function attachHomeScrollMagnet() {
  let touching = false;
  let idle = 0;
  let lastY = window.scrollY;

  function snap(dir: MagnetDir) {
    if (magnetBlocked()) return;
    if (Date.now() - jumpLockAt < 450) return;
    const y = window.scrollY;
    const target = pickSnap(y, dir);
    if (!target) return;
    if (Math.abs(target.y - y) < MAGNET_SETTLED) return;
    pinTo(target.y);
  }

  function schedule(dir: MagnetDir) {
    window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      if (!touching) snap(dir);
    }, MAGNET_IDLE_MS);
  }

  function onScroll() {
    if (magnetBlocked() || touching) return;
    const y = window.scrollY;
    const goingDown = y >= lastY - 0.5;
    lastY = y;
    schedule(goingDown ? 1 : -1);
  }

  function onTouchStart() {
    touching = true;
    lastY = window.scrollY;
    window.clearTimeout(idle);
  }

  function onTouchEnd() {
    touching = false;
    const y = window.scrollY;
    const goingDown = y >= lastY - 0.5;
    lastY = y;
    schedule(goingDown ? 1 : -1);
  }

  function onViewport() {
    if (magnetBlocked() || touching) return;
    const y = window.scrollY;
    if (distanceToPageEnd() <= magnetSnapPx() * 1.7) {
      pinToPageEnd();
      return;
    }
    const hero = document.getElementById("home-hero");
    if (hero && y <= hero.offsetHeight * 0.52) pinTo(0);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("resize", onViewport);
  window.visualViewport?.addEventListener("resize", onViewport);
  window.visualViewport?.addEventListener("scroll", onViewport);

  return () => {
    window.clearTimeout(idle);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
    window.removeEventListener("resize", onViewport);
    window.visualViewport?.removeEventListener("resize", onViewport);
    window.visualViewport?.removeEventListener("scroll", onViewport);
  };
}

/** @deprecated 與 {@link attachHomeScrollMagnet} 相同 */
export const attachHomeBottomMagnet = attachHomeScrollMagnet;

/** 捲到整頁最底，不能再往下的位置 */
export function scrollStartToEnd(
  behavior: ScrollBehavior | "instant" = "smooth",
) {
  const instant = behavior === "instant";
  window.scrollTo({
    top: maxScrollTop(),
    behavior: instant ? "auto" : "smooth",
  });
  requestAnimationFrame(() => {
    pinToPageEnd();
    requestAnimationFrame(pinToPageEnd);
  });
  if (!instant) {
    window.setTimeout(pinToPageEnd, 480);
  }
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** 停用中：註冊區從畫面底抬上來 */
export async function playLiftRite() {
  const section = document.getElementById("start");
  if (!section) {
    scrollStartToEnd("instant");
    return;
  }
  const { leftover, footer } = leftoverViewportPx();
  const placeholder = document.createElement("div");
  placeholder.style.height = `${section.offsetHeight}px`;
  placeholder.setAttribute("aria-hidden", "true");
  section.parentElement?.insertBefore(placeholder, section);

  const prev = section.getAttribute("style");
  Object.assign(section.style, {
    position: "fixed",
    left: "0",
    right: "0",
    bottom: `${footer}px`,
    height: `${leftover}px`,
    zIndex: "55",
    transform: "translate3d(0, 110%, 0)",
    transition: "none",
    willChange: "transform",
  } as CSSStyleDeclaration);
  void section.offsetHeight;
  section.style.transition =
    "transform 560ms cubic-bezier(0.22, 1, 0.36, 1)";
  section.style.transform = "translate3d(0, 0, 0)";
  await wait(580);
  if (prev) section.setAttribute("style", prev);
  else section.removeAttribute("style");
  placeholder.remove();
  scrollStartToEnd("instant");
}
