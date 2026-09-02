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

function maxScrollTop() {
  const el = document.scrollingElement ?? document.documentElement;
  const view = window.visualViewport?.height ?? window.innerHeight;
  return Math.max(0, el.scrollHeight - view);
}

function pinToPageEnd() {
  window.scrollTo({ top: maxScrollTop(), behavior: "auto" });
}

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
