---
tags: [meta, optimization]
updated: 2026-10-06
---

# Optimization history — Codescan

What the performance/SEO optimization pipeline changed in this project, why,
and what must not be undone. Maintained by the optimization pipeline
(`getlayers-pipeline/optimization-pipeline`); the full chronological record with
every measurement is its `obsidian/Projects/codescan.md`, raw runs in
`runs/codescan/`. Per-change prose is in [[changelog]] (entries 2026-10-03
"Mobile 90 pass", 2026-10-05 "D-031 scroll round", 2026-10-06 "owner review");
design ADRs in [[decisions-log]]. D-numbers are the pipeline's decisions log.
Last updated 2026-10-06.

## Current state

- **Live:** https://getlayers-codescan-djsfhhiufhklsadf.vercel.app (deploys
  `main`). Status: **optimized** (2026-10-05, D-031; `blocked` before on scroll).
- **Lighthouse, production** (D-029 sweep, 2026-10-04, 3 runs): people desktop
  97 / mobile 91, A11y/BP/SEO 100; robot form 100 across on both. D-031
  verification (2026-10-05): people 99 / 91. After D-033 (local ×1): mobile 92,
  desktop 99, 100s.
- **Scroll, production** (D-031 sweep, 2026-10-06, 3 runs): desktop **ideal**
  (0.18 %, max 41.6 ms), mobile **ideal** (0.79 %, max 43.2 ms).
- One 840 lvh section whose sticky three.js room (Draco GLB 3.1 MB, seven video
  screens, bokeh composer, dust; `LazyTvScene`, `dynamic ssr:false`) carries
  every act; a counting preloader in the view locks scroll until the room has
  compiled and drawn.
- Last commit on `main`: `7c27d7e` (D-033).

## Invariants — do not undo

- **The room is built one piece per task, model fetch first** — env-map bake
  programs linked first and the bake in its own task; programs **compiled
  against the post target** (compiled for the screen, every program re-linked in
  the warm-up frame, ~190 ms); **no frames drawn under the curtain** (videos keep
  playing). TBT at 4× ~380 → ~110 ms, mobile ~80 → 88–92 local, 90–91 hosted.
  Also: in headless Chrome on Metal the old build never showed the room before
  its 6 s timeout; the new one by ~2 s.
- **Scene frame budget** — `src/lib/scene/device.ts` `frameBudget()`: desktop
  at most 60 fps (`1000/60 − 1`, D-031) — on a 120 Hz panel the full chain (two
  scene renders, bloom, 41-tap bokeh, grain, CRT) redrew every tick: desktop
  janky 4.0/7.2 % → ideal/smooth ~0.3–1.3 %. Motion is time-based. Phones keep
  the author's 30 fps budget (see Open items).
- **Dissolving panels' content carries `will-change: opacity`** —
  `src/components/common/panels/panel-stack.tsx`. An opacity-0 layer isn't
  painted, so all fourteen team-ring cards rasterised in one frame (43 ms) at
  y≈2,732 on phones. Mobile drops 2.48/0.83/1.96 → 1.76/0.69/0.44 %.
- **The team carousel writes `--rot` only on change** (already so; checked in
  D-031).
- **Screen clips are H.264, not HEVC** — `public/assets/hero/Videoes/*.mp4`
  (642×480, CRF 23, faststart; 4.6 → 2.6 MB). HEVC played only with a hardware
  decoder; `TvScreens` has no fallback (dead screens elsewhere). Never ship HEVC.
- **Fonts are Latin WOFF2 subsets** — `src/app/fonts/` (Big Shoulders Inline,
  Chakra Petch Regular/SemiBold; 300 → 65 KB). The canvas signs read the same
  faces from the document.
- **The privacy URL lives in `src/lib/legal.ts`** — importing `siteConfig` from
  the banner pulled zod into the client (314 KB chunk). `privacyPolicyUrl: null`
  is the author's design ("never built"); BP is 100 without the route.
- **`experimental.inlineCss: true`** (`next.config.ts`); **no
  `src/app/loading.tsx`**.
- **Robot form (D-016)** — `src/proxy.ts` → `src/app/robot-view/` rendering
  `src/views/robot-home.tsx` (`RobotHome`): a still of the room
  (`public/assets/robot/room-{desktop,mobile}.webp`, `<picture>` by
  breakpoint), the hero words at `HeroCopy`'s geometry, and **the cases, team,
  about and closing as plain sections** — before this, that copy existed only
  inside the client scene and no crawler had ever read it. `homeMetadata` shared
  by both routes. Robot 98/79 → 100/100.
- **Consent banner SSR** (`src/components/common/Cookie/consent-flag.ts`) — it
  was the mobile LCP: 3.05 → 1.40 s, 78 → 85.
- **Origin:** D-019 chain, with the author's own last fallback
  `https://codescan.studio` kept (not localhost).
- **Brand kit + meta (D-033)** — `src/assets/brand/mark.svg` (the nav's "< >"
  in accent mint on black), favicon set, OG 1200×630; title "Codescan —
  Identity, art direction and web studio"; no `@codescan`. **The name stays
  "Codescan"** (D-034). Bot UA head = people head.
- **Bot list includes AI crawlers** (`src/utils/bot-ua.ts`, `0e9c82d`);
  `src/utils/math.ts` typed (verify 0 FAIL).

## Owner decisions that bind this project

- D-016 / D-017 (2026-09-29) — robot form; A11y/BP/SEO 100.
- D-021 (2026-09-30) — codescan measured on a temporary `opt-` deploy (live was
  an older commit).
- D-026 (2026-10-01) — answers #30: desktop ≥ 90 / mobile ≥ 80 then; beautiful
  kept; no mobile scene cut without asking.
- D-027 — branches merged on close.
- D-028 / D-029 (2026-10-02/03) — mobile ≥ 90, 100 elsewhere (met).
- D-031 (2026-10-05) — scroll ideal both (met).
- **D-033 (2026-10-06)** — favicon + OpenGraph + all required meta.
- **D-034 (2026-10-06)** — "codescan keeps its name".

## History by pass

**Pass 1 — 2026-09-30, commit `815f458`.** Baseline (`opt-codescan` = HEAD):
PC 98 / mobile 78 (LCP 3.05 s = banner, TBT 509 ms); robot 98/79; scroll ideal.
Robot form with the scene's copy as sections; banner SSR; WOFF2 subsets;
H.264 screens. Hosted after: PC 99 / mobile 85 (LCP 1.40 s), robot 100 across,
PSI 99/98. `blocked` on #30 (mobile 85 = the room's lab floor).

**AI crawlers — 2026-10-02, `0e9c82d`.**

**D-028 round — 2026-10-02/03, commit `9ff973f`.** Room built in tasks, post-
target compile, no curtain frames, inlineCss, zod out of the client, `math.ts`,
`loading.tsx` deleted. Hosted: PC 99 / mobile **90**, robot 100/100; scroll PC
janky (4.1 %, room GPU), mobile smooth.

**D-029 production sweep — 2026-10-04:** 97 / 91, robot 100/100.

**D-031 round — 2026-10-05, commit `6c58ae5`.** Desktop 60 fps cap; panels
painted before they fade in. Prod vs branch: desktop ideal 0.36 % both, mobile
smooth 1.44 → 1.05 %; Lighthouse 99/91. Production sweep 2026-10-06: ideal both.
**Optimized.**

**D-033 — 2026-10-06, commit `7c27d7e`** (`optimize/pass-2`): brand kit + meta.

## Tried and reverted / didn't help

- Lower fragment budget (1.24×) on desktop: flat — reverted (the 60 fps cap was
  the lever).
- Lighthouse blamed react-spring's and react-dom's chunks for TBT — misleading:
  the scene renders from react-spring's raf ticker, so the chunk gets billed; a
  real-4× CPU profile showed no long task, only continuous `renderFrame`.
- `tools/profile.mjs` produced an empty profile for this scene (the room never
  ran under it) — use a CPU profile of the hosted page instead.
- One hosted record during D-031 was at load 12–18 — **unreliable**, not acted on.

## Open items / leads

- **Phones still have a 30 fps scene budget** (`1000 / 30` without the 1 ms
  slack, `device.ts`) — the fleet rule since D-033 is "no fixed phone frame cap"
  (a budget throttle draws ~20–26 fps). Codescan was approved as is → ask the
  owner before lifting it (#50); measure with `fps-probe`.
- Pointer raycasts in `tv-hover.ts` / `tv-carousel.ts` are a fleet candidate
  (dense meshes on pointermove) — unmeasured.
- "Codescan" appears nowhere on the page (no wordmark); the `codescan.studio`
  fallback URL is unverified.

## How to measure

Run from `getlayers-pipeline/optimization-pipeline`:

```sh
node tools/measure.mjs codescan --hosted --runs 5   # Lighthouse + scroll, PC + mobile
node tools/measure.mjs codescan --hosted --as-bot   # robot form
node tools/fps-probe.mjs <url> --desktop            # the 60 fps desktop cap
node tools/fps-probe.mjs <url> --cpu 4              # phone budget
node tools/axe-sweep.mjs <url> --device both
```

Scroll here is GPU-bound and load-sensitive (records above load ~15 are
unreliable) — interleave against production in a quiet window.
