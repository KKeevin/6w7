---
name: redesign-existing-projects
description: Audits and upgrades existing 6w7 UI without rewriting the product. Finds generic AI layout, weak hierarchy, and missing hover/empty/error states, then applies targeted visual fixes using the current Tailwind + shadcn system. Use when redesigning, polishing, restyling, improving taste, or when the user mentions slop, generic UI, 美感, 改版, 視覺, landing, inbox, or public ask page.
---

# Redesign existing 6w7 UI

Based on [taste-skill / redesign-existing-projects](https://github.com/Leonxlnx/taste-skill).
**6w7 overlay wins** if this file conflicts with `AGENTS.md`.

## How this works

When applied to this repo, follow this sequence:

1. **Scan** — Read the current stack and tokens before changing anything.
2. **Diagnose** — Run the audit. List generic patterns, weak points, missing states.
3. **Fix** — Targeted upgrades only. Do not rewrite from scratch.

Before any visual change, state one line:

> Reading this as: 6w7（樂玩ㄑ）[page kind] for [audience], keep existing brand tokens, lean toward [what to improve].

## Scan this repo first

| Layer | Current 6w7 fact |
| --- | --- |
| Stack | Next.js App Router, TypeScript strict, Tailwind v4, shadcn/ui |
| Tokens | `src/app/globals.css` `:root` (`--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--mint`, `--danger`, `--ring`) |
| Type | Display `Syne` (`--font-display`), body `Figtree` (`--font-body`) in `src/app/layout.tsx` |
| Copy | Traditional Chinese. Brand: **6w7** / **樂玩ㄑ**. Domain `6w7.link` |
| Motion | Few meaningful animations already exist (`rise-in`, glow). Keep 2–3 purposeful moments |
| Product | MVP is anonymous ask links, not a marketing-site playground |

Do not migrate frameworks or CSS libraries. Do not add GSAP, extra icon packs, or new UI kits unless the user explicitly asks.

## 6w7 overrides (must win)

These beat the generic taste-skill advice below.

- **Do not swap fonts.** Keep Syne + Figtree.
- **Do not invent a new palette.** Reuse CSS variables. One accent (`--accent` coral) + one secondary (`--mint`). No purple/blue AI gradient.
- **Do not add glassmorphism**, mesh blobs, grain overlays, spotlight borders, or stock photos (`picsum.photos` etc.).
- **Do not increase motion.** No parallax stacks, split-screen scroll, smooth-scroll hijack, magnetic cursors, or infinite decorative loops. Prefer `transform` / `opacity`, 200–300ms.
- **Inbox / dashboard / settings / public ask** are product UI. Do not apply landing-page broken grids, masonry heroes, or artsy off-canvas type.
- **Keep shadcn + Lucide** unless a specific icon is wrong. Do not replace the icon set for novelty.
- **Do not copy NGL** copy, color, layout, or interaction.
- **Do not implement** AI face-swap / image-gen. Unreleased tools stay out of UI.
- User-facing strings stay **繁體中文**. No Simplified mix. No English marketing clichés.
- After UI changes, verify the real flow (click/type/submit/navigate), not a single screenshot.

## Design audit

### Typography

- Headlines should feel present: display font, tighter tracking, controlled line-height.
- Body should not stretch forever; keep readable measure.
- Use Medium / Semibold where Regular vs Bold is too coarse.
- Tabular nums for counts, dates, pagination.
- Negative tracking on large headers; `text-wrap: balance` / `pretty` on display lines.
- Sentence case. Do not Title Case every heading.

Skip: swapping to Geist / Outfit / Satoshi / a new serif pair.

### Color and surfaces

- Keep off-white `--bg` / `--surface`. Do not jump a light page into a random `#111` band.
- Keep saturation in check. Tint shadows toward `--ink`, not pure black.
- One gray family already exists (`--muted`, `--line`). Do not mix a second gray temperature.
- Purple/blue “AI gradient” is forbidden (already in `AGENTS.md`).
- Depth comes from existing atmosphere, borders, and spacing — not noise textures or extra libraries.

### Layout

- Mobile first (IG in-app browser). Use `min-height: 100dvh` instead of `100vh` for full-screen shells.
- Add / keep a max-width container on marketing-ish pages; product pages may be denser.
- Vary radius: tighter on chips/inputs, softer on large cards — using existing rounded tokens.
- Optical alignment beats mathematical centering (icons in circles, button text).
- Align shared baselines in card rows (titles, meta, actions).
- Landing: avoid three equal feature cards as the only idea. Product: keep scannable lists.

Skip: dashboard-for-the-sake-of-asymmetric-art, overlapping broken grids on inbox.

### Interactivity and states

- Hover, active (`scale(0.98)` or 1px press), focus ring (`--ring`), loading, empty, error.
- No `window.alert()`. Inline errors in Traditional Chinese.
- Current nav item must be visible.
- Animate with `transform` / `opacity`, not `top` / `left` / `width` / `height`.
- Skeleton loaders should match layout shape, not a generic spinner-only empty hole.

### Content

Forbidden filler: Elevate, Seamless, Unleash, Next-Gen, Game-changer, Delve, Tapestry, “Oops!”, Lorem Ipsum, John Doe, Acme, 99.99%.
Write specific 6w7 copy. Success messages do not need exclamation marks.

### Components

- Cards need a reason (hierarchy), not border+shadow+white by default.
- Prefer one strong CTA; extra ghost/text actions only when needed.
- Do not add FAQ accordions, testimonial carousels, or 3-tier pricing towers unless the page actually needs them.
- Footer: real paths + legal links. No 4-column link farm.

### Code quality

- Semantic HTML. Styles through Tailwind / CSS variables, not mixed inline soup.
- Relative units. Meaningful `alt`. A small z-index scale, not `9999`.
- No import hallucinations. Check `package.json` before adding a dependency.
- Keep meta / OG using `BRAND` helpers.

## Fix priority

1. Hierarchy and spacing (type scale, padding rhythm)
2. State completeness (hover / focus / empty / error / loading)
3. Generic layout tells (equal card rows, dead `#` buttons, missing current-nav)
4. Copy (AI clichés, mixed script, NGL-like phrasing)
5. Motion only if a real interaction is unclear

Do **not** start with a font swap or a new color story.

## Rules

- Work with the existing stack. Do not break auth, inbox, ask, or sticker flows.
- If Tailwind config comes up, this project is **v4** (`@import "tailwindcss"` in `globals.css`).
- Keep diffs reviewable. Small targeted upgrades over a visual rewrite.
- If a taste-skill “upgrade technique” fights this overlay, drop the technique.
