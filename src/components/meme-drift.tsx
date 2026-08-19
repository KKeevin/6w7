"use client";

import { useEffect, useState, type CSSProperties } from "react";

const SHRUGS = ["🤷🏻‍♀️", "🤷‍♂️"] as const;
const SOLOS = ["𝟔", "𝟕"] as const;
const FIREWORKS_EVENT = "6w7:meme-fireworks";

type DriftKind = "solo" | "combo";
type DriftToken = (typeof SHRUGS)[number] | (typeof SOLOS)[number];

type DriftSprite = {
  id: number;
  kind: DriftKind;
  token: DriftToken;
  left: number;
  top: number;
  dx: number;
  dy: number;
  duration: number;
  size: number;
  rotate: number;
  delay: number;
};

type FireworkSprite = {
  id: number;
  kind: DriftKind;
  token: DriftToken;
  x: number;
  y: number;
  dx: number;
  dy: number;
  duration: number;
  size: number;
  rotate: number;
  delay: number;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function burstMemeFireworks(
  origin?: { x: number; y: number } | DOMRect | EventTarget | null,
) {
  if (typeof window === "undefined") return;
  let x = window.innerWidth / 2;
  let y = window.innerHeight * 0.62;
  if (origin instanceof HTMLElement) {
    const rect = origin.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  } else if (origin instanceof DOMRect) {
    x = origin.left + origin.width / 2;
    y = origin.top + origin.height / 2;
  } else if (origin && typeof origin === "object" && "x" in origin && "y" in origin) {
    x = origin.x;
    y = origin.y;
  }
  window.dispatchEvent(
    new CustomEvent(FIREWORKS_EVENT, { detail: { x, y } }),
  );
}

function glyphClass(kind: DriftKind, token: DriftToken) {
  if (kind === "combo") return "meme-drift-combo";
  return token === "𝟔" ? "meme-drift-mint" : "meme-drift-accent";
}

function MemeGlyph({
  kind,
  token,
}: {
  kind: DriftKind;
  token: DriftToken;
}) {
  if (kind === "combo") {
    return (
      <>
        <span className="meme-bob meme-bob-six">⁶</span>
        <span className="meme-shrug">{token}</span>
        <span className="meme-bob meme-bob-seven">⁷</span>
      </>
    );
  }
  return token;
}

export function MemeDrift() {
  const [sprites, setSprites] = useState<DriftSprite[]>([]);
  const [fireworks, setFireworks] = useState<FireworkSprite[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(!motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSprites([]);
      return;
    }

    let nextId = 0;
    let timer = 0;
    let cancelled = false;

    const makeSprite = (
      kind: DriftSprite["kind"],
      token: DriftSprite["token"],
      near?: { left: number; top: number },
      delay = 0,
    ): DriftSprite => {
      const compact = window.innerWidth < 640;
      const left = near ? near.left + rand(-14, 14) : rand(2, 90);
      const top = near ? near.top + rand(-16, 16) : rand(6, 86);
      return {
        id: ++nextId,
        kind,
        token,
        left: Math.min(92, Math.max(1, left)),
        top: Math.min(90, Math.max(4, top)),
        dx: rand(-46, 46),
        dy: rand(-42, 28),
        duration: rand(8, 14),
        size:
          kind === "combo"
            ? compact
              ? rand(20, 28)
              : rand(26, 36)
            : compact
              ? rand(24, 38)
              : rand(32, 50),
        rotate: rand(-22, 22),
        delay,
      };
    };

    const burst = (count: number) => {
      const batch: DriftSprite[] = [];
      for (let i = 0; i < count; i++) {
        const delay = i * rand(0.05, 0.22);
        const roll = Math.random();
        if (roll < 0.46) {
          batch.push(makeSprite("combo", pick(SHRUGS), undefined, delay));
        } else if (roll < 0.82) {
          const six = makeSprite("solo", "𝟔", undefined, delay);
          batch.push(
            six,
            makeSprite(
              "solo",
              "𝟕",
              { left: six.left, top: six.top },
              delay + rand(0.08, 0.28),
            ),
          );
        } else {
          batch.push(makeSprite("solo", pick(SOLOS), undefined, delay));
        }
      }
      setSprites((prev) => [...prev, ...batch].slice(-7));
    };

    const spawn = () => {
      if (cancelled) return;
      if (document.hidden) {
        timer = window.setTimeout(spawn, rand(2500, 5000));
        return;
      }

      burst(Math.round(rand(1, 2)));
      timer = window.setTimeout(spawn, rand(1600, 3200));
    };

    burst(Math.round(rand(2, 3)));
    timer = window.setTimeout(spawn, rand(1400, 2400));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setFireworks([]);
      return;
    }

    let nextId = 0;
    const onBurst = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail) return;
      const compact = window.innerWidth < 640;
      const sparks = compact ? 28 : 40;
      const batch: FireworkSprite[] = [];

      for (let i = 0; i < sparks; i++) {
        const angle = (i / sparks) * Math.PI * 2 + rand(-0.18, 0.18);
        const dist = rand(72, compact ? 200 : 280);
        const combo = i % 6 === 0;
        batch.push({
          id: ++nextId,
          kind: combo ? "combo" : "solo",
          token: combo ? pick(SHRUGS) : i % 2 === 0 ? "𝟔" : "𝟕",
          x: detail.x,
          y: detail.y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - rand(24, 80),
          duration: rand(0.95, 1.55),
          size: combo
            ? compact
              ? rand(18, 24)
              : rand(22, 30)
            : compact
              ? rand(20, 32)
              : rand(26, 42),
          rotate: rand(-40, 40),
          delay: rand(0, 0.08),
        });
      }

      setFireworks((prev) => [...prev, ...batch].slice(-90));
    };

    window.addEventListener(FIREWORKS_EVENT, onBurst);
    return () => window.removeEventListener(FIREWORKS_EVENT, onBurst);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[40] overflow-hidden"
      aria-hidden
    >
      {sprites.map((sprite) => (
        <span
          key={`d-${sprite.id}`}
          className={`meme-drift ${glyphClass(sprite.kind, sprite.token)}`}
          style={
            {
              left: `${sprite.left}%`,
              top: `${sprite.top}%`,
              fontSize: `${sprite.size}px`,
              animationDuration: `${sprite.duration}s`,
              animationDelay: `${sprite.delay}s`,
              "--meme-dx": `${sprite.dx}vw`,
              "--meme-dy": `${sprite.dy}vh`,
              "--meme-rot": `${sprite.rotate}deg`,
            } as CSSProperties
          }
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            setSprites((prev) => prev.filter((item) => item.id !== sprite.id));
          }}
        >
          <MemeGlyph kind={sprite.kind} token={sprite.token} />
        </span>
      ))}
      {fireworks.map((spark) => (
        <span
          key={`f-${spark.id}`}
          className={`meme-firework ${glyphClass(spark.kind, spark.token)}`}
          style={
            {
              left: `${spark.x}px`,
              top: `${spark.y}px`,
              fontSize: `${spark.size}px`,
              animationDuration: `${spark.duration}s`,
              animationDelay: `${spark.delay}s`,
              "--fw-x": `${spark.dx}px`,
              "--fw-y": `${spark.dy}px`,
              "--fw-rot": `${spark.rotate}deg`,
            } as CSSProperties
          }
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return;
            setFireworks((prev) => prev.filter((item) => item.id !== spark.id));
          }}
        >
          <MemeGlyph kind={spark.kind} token={spark.token} />
        </span>
      ))}
    </div>
  );
}
