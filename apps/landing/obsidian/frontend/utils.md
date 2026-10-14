---
tags: [frontend, stable]
updated: 2026-08-10
---

# Catalog — Utilities

Pure helper functions in `src/utils/` (no side effects, unless noted).

## `is-bot.ts`

`isBot(): Promise<boolean>` — **server-only**. Reads the `user-agent` header,
returns `true` for crawlers/audit tools. Used to skip heavy animation for bots.
See [[seo-metadata]].

## `scroll-to.ts`

`scrollTo(id?, immediate?)` — programmatic scroll to an element id (string) or a
numeric position. Integrates with the Lenis [[smooth-scroll|scroll store]];
temporarily disables scroll state during the animation. Has `//if lenis` guards so
the Lenis dependency can be stripped if smooth scroll is removed.

## `math.ts`

| Function | Purpose |
|----------|---------|
| `transformRange(value, min, max, newMin, newMax)` | remap a value between ranges (clamped) |
| `lerp(start, end, t)` | linear interpolation |
| `debounce(...)` | debounce helper (used by `useWindowSize`) |

## `lvh.ts`

CSS-string builders for viewport-height units with fallbacks
(`vh` → `lvh` → `calc(var(--vh) …)`): `heightLvh`, `minHeightLvh`, `marginTopLvh`,
`marginBottomLvh`. Solves mobile-browser viewport-height inconsistencies.

## `animation/coords.ts`

Element-coordinate helpers — `getElementCoords`, `getScrollCoordsFromElement` —
used internally by the scroll/animation system. Marked `@ts-nocheck`. `#do-not-modify`

## `seo/generate-page-metadata.ts`

`generateMetadata(props?)` — shared page-`Metadata` builder. `generateViewport()`
— the `Viewport` export (carries `themeColor`, and deliberately no
`maximumScale`). Beyond the obvious props it takes `titleTemplate` (**root layout
only** — a template rewrites the titles its descendants declare) and
`titleAbsolute` (opts a page out of an ancestor's). No `keywords`, by decision.
See [[seo-metadata]].

## `seo/structured-data.ts`

`getSiteStructuredData()` — the `Organization` + `WebSite` JSON-LD graph rendered
by the root layout. `getHomeStructuredData()` — the home page's `WebPage` node,
rendered by `views/home.tsx`. `schemaId` — the three absolute `@id`s both use, so
the graph links to itself rather than repeating URLs. See [[seo-metadata]].

> [!note] `scene/gradient-texture.ts` is gone
> The sky used to be a gradient painted into a canvas and handed to
> `scene.background`. It is now a dome with the gradient in its shader —
> `lib/scene/tv-sky.ts`, [[decisions-log]] ADR-0024 — because a texture
> background is screen space and its horizon does not move with the room.

## `scene/dispose-object.ts`

`disposeObject(root)` — traverses an `Object3D` and disposes every geometry,
material and texture under it. three.js keeps GPU resources alive after an object
leaves the scene graph, so an unmounted scene leaks without this.

## Adding a util

Keep utilities **pure** and side-effect-free (server-only ones like `isBot` are the
exception — note it clearly). Group by domain under `utils/<domain>/`.

## Related

[[hooks]] · [[seo-metadata]] · [[smooth-scroll]]
