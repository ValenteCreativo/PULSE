---
tags: [frontend, animation, stable, do-not-modify]
updated: 2026-07-17
---

# Animation System

The core of this starter. **Every motion is spring-based** via `@react-spring/web`.
CSS keyframes and `framer-motion` are **banned**. ADR: [[decisions-log]] ADR-0002.

> [!note] One narrow CSS exception (ADR-0014)
> CSS `transition-*` is allowed for **simple, discrete state changes only** —
> hover/focus colour, opacity, border, underline, small decorative nudges — with
> token-backed timing (`duration-[var(--duration-fast)] ease-entrance`). Anything
> scroll-driven, revealing, layout-affecting, staggered, or interruptible is a
> spring. `@keyframes` stay banned. Rules and examples: [[design-system#Motion: springs first, CSS for trivial state]].

> [!warning] #do-not-modify
> `src/components/animation/springs/` and `src/hooks/animation/` are the animation
> engine. Treat them as a vendored library — **consume them, don't edit them
> without explicit sign-off**. One authorized performance refactor has been made;
> see [[decisions-log]] ADR-0009.

## Shared render loop (ticker)

Every per-frame animation hook subscribes to **one** app-wide
`requestAnimationFrame` loop — `src/lib/animation/ticker.ts` (`subscribeToTicker`).
A page with N scroll-driven components runs **one** rAF, not N. The loop is
reference-counted: it starts on the first subscriber and stops when the last one
unmounts, so an idle page costs nothing.

- `useLoop` (and everything built on it — `useLoopInView`, `useResizeLoop`,
  `useSpringTrigger`, `useProgressTrigger`, `<AdaptiveGrid>`) goes through the
  ticker. Each subscriber keeps its own `framerate` throttle.
- Window dimensions (`useWindowWidth` / `useWindowHeight` / `useWindowSize`)
  share **one** debounced `resize` listener via a `useSyncExternalStore` store.

`src/lib/animation/ticker.ts` is **not** `#do-not-modify` — it is the supported
extension point for loop-based animation.

### Scroll progress — `lib/animation/scroll-progress.ts`

Anything that needs *how far down the page we are* calls `scrollProgress()`
rather than working it out itself. Three subscribers did — the scene, the panel
stack and the hero's copy — which meant **three reads of
`document.documentElement.scrollHeight` per frame**, and that is a *layout* read:
interleaved with the style writes those same subscribers make, it forces the
browser to re-run layout several times a frame (`optimize-3d-scene` §9). The
height is cached and re-measured on resize and on a `ResizeObserver` over the
document; `window.scrollY` is free and stays live.

**Animate off `smoothScrollProgress(time)`, not off `scrollProgress()`.** The raw
number arrives in steps — coarse ones on a wheel, coarser on touch — and anything
derived from it inherits those steps. The smoothed one is the page's single
low-pass: frame-rate independent (`1 − (1 − k)^(dt·60)`), snapping rather than
crawling across a jump, and **idempotent within a frame** — the first call
advances it and later calls with the same timestamp get the same number, so three
subscribers reading it is still one filter. The scene used to keep a filter of
its own while the panels and the copy over it stepped; one filter is why they now
move together. Lenis itself runs on the shared ticker as its **first** subscriber
(`layouts/scroll-layout.tsx`), so the position everything reads was written this
frame and not last one. See [[decisions-log]] ADR-0032.

### The page's opening — `lib/page/intro.ts`

Two one-way flags and a set of callbacks: `sceneReady` (the room is loaded,
compiled and has drawn a frame) and `introDone` (the curtain is up). The scene
sets the first, [[components/common|`<Preloader>`]] waits on it and sets the
second, and the hero's copy waits on *that* — it starts scattered and resolves
only when the page can actually be seen.

A module rather than a store or a context because the three parties sit on three
branches of the tree and one of them (the scene, behind `next/dynamic`) does not
exist yet when the others mount. Subscribing after the fact is safe: a flag that
has already been set calls the new listener immediately. See [[decisions-log]]
ADR-0034.

> [!important] Scroll-driven motion is **linear**
> Every act maps its scroll window straight through `phase()` — no smoothstep
> anywhere the user is the clock. The windows are wide instead; see
> [[decisions-log]] ADR-0033. Easing curves belong in the shaders, where the
> clock is time.

## The components

All live in `src/components/animation/springs/` and accept a `tag` prop so they
render the semantically correct HTML element. Full catalog:
[[components/animation-springs]].

| Component | Trigger | Use for |
|-----------|---------|---------|
| `<Inview>` | element enters viewport | fade/slide-in reveals |
| `<Spring>` | mount / enabled flag | unconditional spring animation |
| `<SpringTrigger>` | scroll progress | parallax, scrub, scroll-toggled motion |
| `<ProgressTrigger>` | scroll progress | raw 0–1 progress callback (no animation) |
| `<Hover>` | mouse enter/leave | hover effects (off on mobile) |
| `<Handle>` | content change | smooth enter/exit on children swap |
| `<AnimatedVarTextTag>` | — | low-level `animated[tag]` primitive |

For **text**, do not use these — use [[text-engine]].

## Choosing the right primitive

| Need | Component |
|------|-----------|
| Element fades/slides in when scrolled into view | `<Inview from={} to={} mode="once">` |
| Element moves continuously with scroll (parallax) | `<SpringTrigger mode="scrub">` |
| Element snaps to a state at a scroll point | `<SpringTrigger mode="toggle">` |
| Mouse hover animation — physical, or animating transforms | `<Hover from={} to={}>` |
| Hover/focus **colour, opacity or border** change only | plain CSS `transition-*` (ADR-0014) — no component |
| Just a 0–1 scroll progress value | `<ProgressTrigger onChange={}>` |
| Heading / copy reveal | `<TextEngine>` → [[text-engine]] |

## Common props

| Prop | Meaning |
|------|---------|
| `tag` | HTML element to render (`section`, `h1`, `div`…) — use the semantic one |
| `from` / `to` | spring start / end states — animatable CSS values only |
| `config` | `@react-spring/web` `SpringConfig` (`tension`, `friction`, …) |
| `mode` | trigger behaviour — varies per component (see below) |
| `delayIn` / `delayOut` | ms delay before enter / exit |
| `disableOnMobile` | respect the global mobile-disable config |
| `className` / `innerClassName` | Tailwind classes (kept separate from spring `style`) |

> Never pass Tailwind class names into `from`/`to`. Spring values are numbers or
> unit strings; classes go on `className`.

## Modes

- **`<Inview>` / `<Spring>`:** `"once"` (play once, stay), `"always"` (reverse on
  leave), `"forward"` (only on downward scroll).
- **`<SpringTrigger>`:** `"scrub"` (interpolate with scroll), `"toggle"` (snap at
  trigger point).

## Trigger positions (`start` / `end`)

Scroll components use a GSAP-style `TriggerPos` string:
`"<element-edge> <viewport-edge>"`, e.g. `"top bottom"`, `"center center"`,
`"bottom top-=100"`. Full grammar in [[text-engine]] (shared format).

## Global config

`src/lib/springs/config.ts`:

```ts
export const springsConfig = {
  mobileWidth: 768,
  disableOnMobile: {
    hover: true,        // always — no hover on mobile
    inview: false,
    spring: false,
    springtrigger: false,
  },
};
```

`isMobileDisabled(value, viewportWidth?)` checks the viewport against `mobileWidth`.
Pass a React-tracked width (e.g. from `useWindowWidth()`) as the second argument so
the check re-evaluates on resize; it falls back to `window.innerWidth` when omitted.
Components opt in per-instance via `disableOnMobile`. **Never disable animation
globally** — toggle per component when an animation hurts mobile UX.

## Underlying hooks

The components are built on `src/hooks/animation/` — also `#do-not-modify`. See
[[hooks]] for the catalog.

## Related

[[text-engine]] · [[components/animation-springs]] · [[data-flow]] · [[new-page]]
