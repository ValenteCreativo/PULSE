---
tags: [frontend, stable]
updated: 2026-08-10
---

# Catalog — Common Components

Files in `src/components/common/` — shared infrastructure that may depend on
providers. Conventions: [[component-conventions]].

> [!info] Everything below is written at **three** widths
> Bare classes are the **phone** (< 640, the 360 design), `sm:` is the **tablet**
> (640–1023, the desktop design made compact), `lg:` is the **desktop** (≥ 1024,
> the Figma frame untouched). The numbers quoted in each entry are the desktop
> ones unless a *Narrow* note says otherwise. See [[design-system]] → "The
> ladder", [[decisions-log]] ADR-0035.

## Cookie — `Cookie/`

Self-contained cookie consent system — a bottom-right **banner** plus a full
category **preferences modal**. No third-party library (the old
`react-cookie-consent` dependency was removed). Lives in `src/components/common/Cookie/`.

| File | Role |
|------|------|
| `Cookie.tsx` | Mount component — hydrates the store, renders banner + modal |
| `LazyCookie.tsx` | `next/dynamic` `ssr:false` wrapper — keeps cookie JS out of first-load |
| `CookieBanner.tsx` | Bottom-right consent banner |
| `CookiePreferencesModal.tsx` | Category preferences dialog with per-category toggles |
| `CookieButton.tsx` | Local button primitive — `primary` / `secondary` variants |
| `PrivacyPolicyLink.tsx` | *privacy policy* — an anchor only where there is a policy |
| `cookieStore.ts` | Zustand store + `localStorage` persistence |
| `index.ts` | Barrel exports — `Cookie`, `LazyCookie`, `useCookieStore`, `CookieConsent` |

**Mounting** — the root layout renders `<LazyCookie />` inside `ScrollLayout`:
```tsx
import { LazyCookie } from "@/components/common/Cookie";
```

**State** — `useCookieStore` (Zustand). `consent` is `null` until the user decides;
the banner shows only after hydration confirms `consent === null`. Persisted to
`localStorage` under key `cookie-consent-v1`. Three categories: `necessary`
(always on), `analytics`, `marketing`.

**Styling & motion** — ported to the project stack: Tailwind v4 with the
`background` / `foreground` design tokens (dark-mode adaptive, no hardcoded hex),
and `@react-spring/web` for all motion — `useTransition` drives the banner and
modal mount/unmount, `useSpring` drives the toggle knob. No CSS transitions.
The modal locks scroll through the Lenis [[smooth-scroll|scroll store]]
(`useScroll.stop()`), not `body` overflow.

**The privacy-policy link** goes through `<PrivacyPolicyLink>`, which reads
`siteConfig.privacyPolicyUrl` — `null` until a policy exists, and until then the
phrase renders as plain text rather than as an underlined link that 404s. Both
consent surfaces use it, so the two can never disagree. Set that one field and
both become links. ADR: [[decisions-log]] ADR-0037.

> [!note] `#todo`
> The consent copy is placeholder and should be reviewed before launch — and a
> real privacy policy written, which is what `privacyPolicyUrl` is waiting for.

## Grid — adaptive scaling (`grid/`)

The **adaptive scaling grid** keeps a rem-based layout proportional across every
viewport by scaling the root (`<html>`) font-size. Design in `rem` once, and the
whole UI scales as one unit. Lives in `src/components/common/grid/`.

| File | Role |
|------|------|
| `grid.config.ts` | Breakpoints + `FONT_BASE` — the single source of truth for the grid |
| `adaptive-grid.tsx` | `<AdaptiveGrid>` client component — drives the scale-up, renders `null` |
| `index.ts` | Barrel exports — `AdaptiveGrid`, `GRID_BREAKPOINTS`, … |

**How it works** — two halves cover the whole viewport range:

- **Scale down** (viewport ≤ 1920px) — `vw`-based `html { font-size }` media
  queries in `globals.css`. At each breakpoint's design base width the root
  font-size resolves to 16px; between breakpoints it tracks the viewport.
- **Scale up** (viewport > 1920px) — the `<AdaptiveGrid>` component sets an
  inline `html` font-size at runtime via [[hooks|`useAdaptiveGrid`]], so the
  design keeps growing (damped by `coef`) on large displays.

The `globals.css` media queries and `grid.config.ts` describe the same
breakpoints — **keep them in sync** (formula: `font-size = 16 * 100 / baseWidth vw`).

**The two lower ranges are clamped** (`GridBreakpoint.clamp`): the tablet range
has a **12px floor** and the phone range an **18px ceiling**. A range's bottom
edge is `16 × bottomWidth / baseWidth`, and unclamped those two land at 10px root
at 641px and 28px root at 640px — sizes no layout was drawn for. Below a floor
the layout **reflows** instead of shrinking; that is what the `sm:` / `lg:`
variants through this catalog are. The phone range takes no floor: under 360px
there is no narrower design to switch to, so proportional shrinking is the only
right answer. Full table and reasoning in [[design-system]] → "The ladder";
ADR: [[decisions-log]] ADR-0035.

**Mounting** — the root layout renders `<AdaptiveGrid />` inside `ScrollLayout`:
```tsx
import { AdaptiveGrid } from "@/components/common/grid";
```
Mount it once. Props: `baseWidth` (defaults to the largest breakpoint) and
`coef` (0–1 scale-up damping, default `0.6666`).

> [!note]
> This replaced a `styled-components`-based scaling system that was dropped into
> `common/` — see [[decisions-log]] ADR-0008. `styled-components` is **not** a
> project dependency; the scale-down CSS lives in `globals.css` per [[design-system]].

## ReducedMotion — `reduced-motion.tsx`

`<ReducedMotion>` — a client leaf that calls react-spring's `useReducedMotion()`.
It watches the `prefers-reduced-motion` media query and toggles react-spring's
global `skipAnimation`, so every spring — and `spring-text-engine` — jumps to its
end state instead of animating. Renders `null`; mounted once in the root layout.
See [[animation-system]] and [[seo-metadata]].

## Skeleton loaders

Three skeleton components for `loading` states of async-data components — every
async component must mirror its final layout with one of these
(see [[component-conventions]]).

| Component | File | For |
|-----------|------|-----|
| `<SkeletonImage>` | `skeleton-image.tsx` | image placeholders |
| `<SkeletonLoader>` | `skeleton-loader.tsx` | generic block placeholders |
| `<SkeletonVideo>` | `skeleton-video.tsx` | video placeholders |

## Header — `header/site-header.tsx`

`<SiteHeader label homeLabel menuLabel contactLabel contactHref>` — the nav pill
from the Figma hero (node `1097:251` → *1441:331*): 279×41 at 16px from the top,
centred. **Translucent white at 20% over a 3px backdrop blur**, with a border of
the same 20% and a **6px** radius — not a solid grey stadium, which is what the
first pass guessed before the design context would load. The "Menu" chip is
`#dbfffe`, 109 wide, also 6px, with `pl-25 pr-24 gap-7` and a **three**-rule
hamburger (14×1 at 0/3/6). Type is Chakra Petch **SemiBold 14** throughout.

Both outer labels are placed by their **text centres** (`< >` at 42.5, `Contact`
at 50%+97), as the design positions them, so the spacing holds whatever the
strings say. Every number is the frame's own, in `rem` so it rides the adaptive
grid — at the 1440 base `1rem` is the design's 16px.

`fixed`: the brief is that it stays at the top for the whole scroll, and
**`pointer-events-none` on the bar with `auto` on the pill** — it is a full-width
strip across the top of the window, and without that it swallows every click
along that strip, which is what made the dev panel's button unclickable. A
**server component** — nothing here holds state, and keeping it off the client is
what lets the route's only client leaf stay the scene.

`contactHref` is **optional**: without one, *Contact* renders as a `<span>` — no
tab stop, no pointer, no hover — because the `/contact` it named was never built.
See ADR-0037.

**Narrow (< 640): the same pill at 79%** — 220×36, SemiBold 12, chip 88 wide,
and the two text centres moved with it (34 and 50%+77). Every offset is a text
centre rather than a flex position, so a smaller pill means smaller numbers on
all three children; letting them loose in a flex row instead would move all three
and lose the shape the design drew. At 390px it comes to 240 of them, which is
what [[#HUD — `hud/scene-hud.tsx`]]'s top row is sized around.

## HUD — `hud/scene-hud.tsx`

`<SceneHud date recordingLabel>` — the window's chrome: four hairline rules and
four corner brackets, with readouts 32px in from the corners (fps, `REC`, the
date, and time-on-page — Chakra Petch **Regular 16**, white).

**It is not a rounded rectangle.** The rules are 1px at **50%** white, inset 16
and stopping **48px** short of each corner; the corners are **32×32 brackets at
2px and full** white, an elbow with a 10px arc (`M32 0 V22 C… H0`, flipped four
ways — the same construction Figma uses). That weight difference is the design's
signature, and collapsing the whole thing into one `rounded-[2rem] border` — the
first attempt — loses it.

`fixed inset-0` and **`pointer-events-none` throughout** — it is the window's
frame rather than the hero's, it stays over every act of the scene, and a
full-screen overlay that swallowed the pointer would take the scene's hover with
it. The two live numbers come from [[hooks|`useFpsReadout` / `useElapsedReadout`]],
which write into refs rather than re-rendering. The date is formatted on the
server so the first paint already has it.

**Narrow (< 640): the frame tightens and the top row empties.** 12/36/24 in place
of 16/48/32, readouts 24px in at 13px — the 1440 rhythm kept at a phone's root
size is a two-centimetre border on a five-centimetre screen. `60 fps` and `REC`
are `hidden`: the nav pill takes 240 of a 390px window and leaves the corners
about 70px each, which is why they were rendering *over* its blur. The date and
the clock have the bottom row to themselves and stay.

## Text — `text/scatter-text.tsx`

`<ScatterText children active tag className>` — a line whose letters resolve out
of a blur, **each at its own speed from the same starting gun**, and scatter back
into one when `active` goes false. Used by every heading on the page: the hero's
`h1`, *Our cases*, *Meet our team*, *About*.

**The exit is the entrance inverted**: a letter's speed on the way out is drawn
from `1 - seed`, so the one that resolved first is the last to go. With the same
speed both ways the line just plays backwards, which reads as an undo rather
than as the words leaving.

One spring per letter, which is why each letter is its own little component — a
hook cannot live in a loop. The per-letter speed comes from a **hash of the
index**, never `Math.random`: the letters are laid out on the server and hydrated
on the client, and two different draws would mean the markup and the animation
disagreeing. Words are kept whole (`whitespace-nowrap` per word) so a line still
breaks between words rather than between letters, and the unsplit string stays in
the DOM as `sr-only` while the split copy is `aria-hidden` — the same bargain
[[text-engine]]'s own `seo` prop strikes.

> [!warning] This is the one text animation the engine does not do
> `spring-text-engine` staggers by a **single number applied by sequential
> index** and takes **one `letterConfig` for every letter**, so what it can
> produce is a sweep — left to right, every letter at the same speed. The brief
> here is the opposite: all at once, each at a different speed, in no order. A
> deliberate exception to hard rule #3, recorded as [[decisions-log]] ADR-0031;
> everything else with text still goes through the engine.

## Preloader — `preloader/preloader.tsx`

`<Preloader label>` — the curtain over the first paint, and the page's starting
gun. A field of the site's mint, the count top-left in the display face, and a
bar of **64 rounded cells** across the foot that fills left to right. When the
room reports in the bar finishes, and the whole sheet is clipped away from the
bottom up (`clip-path: inset(0 0 x% 0)`) — the hero is revealed by the curtain
leaving the frame rather than by a fade.

The count is real where it can be: it advances at its own pace to **92%** and
waits there until the scene says it has loaded, compiled and drawn a frame. What
it must never do is finish before the room has. A six-second `PATIENCE` cap
covers the case where the scene never reports at all (WebGL refused), because a
loader that can hang forever is worse than one that lets you in early.

Two things it owns beyond its own pixels: it **stops Lenis** while it is up
(keyed on *gone*, not on unmount — it renders `null` rather than unmounting, and
an unmount cleanup would leave the page locked for good), and it calls
`markIntroDone()` **as the lift begins**, which is what lets the hero's headline
resolve.

> [!note] The hero starts with the curtain, not after it
> The sheet is clipped from the bottom up, so the top of the window — where the
> headline is — is the *last* thing uncovered. Firing on the spring's rest meant
> the letters only began resolving once they were already in view, seconds after
> the page appeared to have arrived. Started with the lift, the headline is half
> resolved by the time it is uncovered. See
[[animation-system|`lib/page/intro.ts`]] and [[decisions-log]] ADR-0034.

**Narrow:** the count is 48 rather than 72, insets are 24, and the bar's **gap
closes to 1px**. The cell count is fixed on purpose (the server and the client
draw the same row), and each cell has a 1px floor — so 64 of them 4px apart is
316px of bar, wider than the window it is laid across, and a flex row that cannot
shrink past its floor overflows rather than tightening.

## Hero — `hero/hover-chip.tsx`

`<HoverChip hint>` — the chip that follows the cursor: a line typed in a
character at a time, and optionally a divider and an action after it. `null`
closes it.

**It renders nothing without a cursor.** `hasFinePointer()` is read after mount
(never during render — the server has no pointer to ask about, and answering
differently on the two passes is a hydration mismatch) and a coarse pointer
returns `null`. The scene already withholds its own hover on touch, but the team
ring reports a pointer over it from a finger as readily as from a mouse, which
left a label parked at the last place the screen was touched, chasing nothing.

**Two tones, and the tone is an argument about honesty.** Over a case it is the
site's accent with black on it and *Explore →* after the divider; over a set
showing noise it turns black with the accent on the type and **drops the arrow
and the word**, so the offer is only made where it can be kept. The ring in the
team block borrows the same chip for *Drag to explore*, and the closing shot's
television for *Something is on next*.

> [!note] `#todo` — the case chip is currently making a promise the page cannot
> keep
> *Explore →* was written when `/work/<slug>` was in the data. ADR-0037 took
> those `href`s out, and the chip does not know: it still shows the arrow and the
> word over a case with no route. Gating it needs the hint's case name matched
> against `cases.items` in `scene/tv-scene.tsx` — which is where the `kind` →
> tone mapping already lives, so it belongs there. Left as-is for now because it
> is a hover affordance rather than a control, and the set under it *does*
> answer by lifting; fix it, or give the cases their routes.

The scene supplies `{ text, kind }` (`TvHoverHint`) — it names what the pointer
found and how much of an offer it is; **what that looks like is the page's call**,
which is why the mapping from `kind` to tone lives in
`components/common/scene/tv-scene.tsx` and not in the room. Case names are keyed
on the texture that screen is wearing.

> [!warning] A chip has to be taken down by the act it belonged to
> The scene picks **on pointer movement only** (the wall drifts under a still
> cursor, and re-picking mid-drift hands the hover to a neighbour). So nothing
> takes a chip down when the *scroll* moves on: one put up over the wall stayed
> on the cursor for the rest of the page, over the team block and the studio's
> own words. Both hints are gated on their act — the wall's on the window the
> rack focus closes over, the closing one on the epilogue being staged — and
> `setCovered(true)` clears the hint outright, because the loop that would have
> noticed is about to stop.

> [!note] It used to be a plane in the room, and every problem it had came from
> that
> The label hung above the hovered set, turned the way that set was turned. It
> was therefore foreshortened to a different apparent size on every television,
> it had to be scaled by axial depth to stay one size on screen, it could be
> buried behind whatever stood in front of it, and it needed a canvas texture, a
> font read off the cascade and a per-letter draw. A chip on the cursor is one
> size, in one place, always legible, and is about a third of the code. The 3D
> version is in the history if the brief ever wants it back
> ([[decisions-log]] ADR-0028 still covers the flight's lines, which genuinely
> do have to be in the room).

It chases rather than tracks — the position eases toward the pointer each frame,
so it trails slightly instead of being welded to it — and everything about it is
written straight to the element off the shared ticker. React is told the label
and nothing else.

## Hero — `hero/hero-copy.tsx`

`<HeroCopy headline intro primary secondary>` — the first screen's words, all of
it read off the frame: the `h1` in **Big Shoulders Inline 72/1.0**, `#dbfffe`, on
a **535px** measure — one string, wrapped by that measure rather than broken by
hand — held **97px** down: the nav pill ends at 57 (16 + 41) and the brief is a
**40px** gap under it. Measured from the top, not from the centre the design
happens to constrain it against: the nav is `fixed`, so a centre-anchored
headline drifts away from it on any window that is not 800 tall. `<CasePanel>`'s
heading sits at the same 97. Under it a bottom-anchored column **50px** off the
bottom: a 32×32
crosshair (two 1px rules), 16px, the intro at **Chakra Petch Regular 16/1.2** on
a **411px** measure, 31.6px, then the buttons 12px apart — 6px radius, SemiBold
16, one filled `#dbfffe` on black text and one outlined in the same.

Both blocks are **positioned against edges**, as the design places them; flow
between them would put the copy wherever the headline's line count left it.

**It does not travel.** It was absolute inside the tall section, so the scroll
carried it up and out of frame — words being pulled off the page while the room
behind them held still. It is `fixed` now and **stays where it is**, going out on
**blur and opacity** over the first of the flight (written straight to the
element off the shared ticker), with the headline's letters scattering out on
their own springs. A client component for that reason, and the only thing React
is told is whether the headline should be resolved or scattered.

The frame and the nav stay for
the whole scroll; the copy belongs to the first screen and leaves with it —
sticky here would carry "We make the web" over the carousel and the finale too.
It is `pointer-events-none` apart from the buttons, so the scene keeps its hover.

The two calls to action go through a local `<Cta>`: **a link only when it has an
`href`**, otherwise the same shape as a `<span>`, with `pointer-events-auto` and
the hover colour left off — the hover is the promise. `/contact` and `/work` were
written here before any route existed for them. ADR-0037.

**Narrow: the two measures become margins.** 535 and 411 are what break the copy
into its lines on the design's window; on a phone they are wider than the window,
and a *centred* block wider than its frame runs off both edges at once. Under
`sm` each is the window less a gutter (`calc(100% − 3.5rem)` / `−3rem`) at 32/14
instead of 72/16, so the same copy takes more lines rather than the bezel. The
bottom column also stands **72px** off the foot rather than the design's 50: the
frame's date and clock are down there, and the buttons were landing on them.

## Closing — `closing/closing-copy.tsx`

`<ClosingCopy content onWriter>` — the last shot's words. Figma `1463:1054`:
*Have an Idea?* in the hollow display face at **72/1.0** on the design's **60px**
margin, *Lets collaborate!* under it at **Chakra Petch 32/1.2**, both in
`#dbfffe`, and a 1px rule at 20% white ruled under the pair.

> [!important] The rule is **under the television**, and the television is in a
> canvas
> There is no z-order that puts DOM behind an opaque canvas, so the rule is
> **cut** where the set begins: the scene measures the set's real outline at the
> rule's own height and the line is drawn exactly that wide, following the set as
> the hover turns it. Two things had to be got right — asking at the rule's
> height rather than for the set's leftmost point anywhere (it is turned three
> quarters away, so its near bottom corner reaches much further left than its
> middle), and asking the **geometry** rather than a projected bounding box (the
> set stands close enough to the lens for a box corner to fall behind the near
> plane, and a box with a corner behind the camera is not a shape). The last
> stretch of the rule fades out, which covers the difference between where the
> geometry is and where the CRT pass's curvature puts it on glass.

The component hands its writer **up** to the scene in an effect, and the scene
calls it every frame of the last act: reveal and width are written straight to
the elements, and the only thing React is told is whether the heading is resolved.

The rule's own left edge is **measured** (cached with its top, both re-read on
resize) rather than the design's 60px written into the file — the block sits on a
24px margin on a phone and a 40px one on a tablet, and a constant made the line
start inside its own heading and stop short of the set by the same difference.
**Narrow:** 36/20 in place of 72/32, on those smaller margins.

## Scene — `scene/`

The home route's WebGL scene. `<LazyTvScene modelUrl screenVideos>` is the only
export meant for consumers — a `next/dynamic` `ssr:false` wrapper, so three.js
never reaches the server render. `<TvScene>` under it owns a container element
and the lifetime of the plain-three.js class in `lib/scene/tv-scene.ts`; the
canvas itself is created and removed by that class.

Its props are content, passed down from `data/mocks/home.ts`: `modelUrl` is the
GLB, `screenVideos` the clips that play on the television screens (matched to
screens by texture name) and `screenVideoOverrides` the per-screen escape hatch.
The component keys its effect on the *contents* of those, not on the array or
object identity, so a re-render never tears the scene down.

The rest are content for the acts past the first: `flightSigns`, the lines
standing in the room for [[scene-3d|the flight]] to pass through; `cases`, the
carousel section's heading, controls and works; `team` and `about`, the two black
panels; `finalShot`, the still hung on the closing shot's television and the line
the chip carries over it; and `closing`, the words laid over that shot.

It also renders four things that are **not** the canvas, as siblings of it: the
carousel section's `<CasePanel>`, the finale's black layer, the one `<HoverChip>`
the whole page shares, and `<ClosingCopy>` — which sits at `z-15`, under the
panels' `z-25`, so the block that dissolves off the top of them passes over the
closing words rather than under. Siblings rather than children because the
canvas container is `aria-hidden` and focusable controls must not live inside
that.

**The chip has two sources and this component is where they meet.** The scene
reports `TvHoverHint` for the wall and the closing set; `<TeamPanel onHint>`
reports the ring. They can never disagree, because while a panel is up the scene
is not being drawn at all. Mapping a hint's `kind` to the chip's tone and action
happens here too — the room names what was found, the page decides what an offer
looks like.

`<TeamPanel content active arriving onHint>` is the first black panel: the
heading, the `[ 01 / 08 ]` counter, the ring, and the front card's name and tags
against the usual 50px footing. It holds only *which card is at the front*; how
the panel arrives and when it is interactive belong to `<PanelStack>`.

**Narrow:** the counter is held one line under the heading at each size rather
than at a fixed 201px, which is halfway down a phone's heading; and both tag rows
here and in `<CasePanel>` **wrap and centre** — *9 years of experience* is most
of a phone's width on its own, and a row that cannot wrap runs out of both sides
of the window instead of becoming two lines.

`<CasePanel visible label heading previous next explore items index onTurn>` is
the second section's whole interface, read off the Figma frame (node `1441:247`):
the heading in the hollow display face at the same **97px** the hero's sits at,
*Previous* and *Next* **240px** in from each edge on the vertical centre, and a
bottom-anchored column of case name (**Inline 32**), three tags 32px apart, and
the *Explore* pair — 50px off the bottom, the same footing the hero's column has.

`visible` is the scene's own verdict on whether the scroll is in the stretch
where the carousel is assembled and the finale has not started; the panel fades
in on a `<Spring>` and takes itself out of the tab order — and out of
`pointer-events` — otherwise, because faded out it still lies over the first
screen and its *Explore* link sits exactly where the hero's buttons are.
`onTurn(±1)` goes to `scene.turnCarousel`; `index` comes back the other way, from
the scene's `onCarouselIndex`, and names the work at the front. The name and its
tags are keyed on the work, so turning the ring re-runs their spring.

*Explore* and its arrow are **one link in two pieces**, not two links to one
place: a second `<a>` beside it would read as a second destination to anything
that lists them. The pair lives in a small `<ExploreFace>` so it is written once
whether or not it is wrapped in a link — `HomeCase.href` is optional, none of the
`/work/<slug>` routes it named was ever built, and without one the same two
pieces render as a plain box with no tab stop and no `group-hover`. ADR-0037.

> [!warning] *Previous* and *Next* only flank the set while there is room beside
> it
> 240px in from each edge is past the middle of a 390px window, so under `lg` the
> two literally **crossed over** — *Next* to the left of *Previous*, both over the
> picture. They come down instead and sit as a pair just above the work's name,
> which is the one band of the frame the television never fills at any aspect.
> It is the same two nodes with different position classes (`TURN`), not a second
> pair for small windows: a second pair is a second set of tab stops.

The black layer is a plain `div` whose opacity the scene writes **directly**,
through an `onBlackout` callback and a ref — no state, because it changes on most
frames of the finale and a re-render per frame to set one opacity is a re-render
per frame too many.

In development it also renders `<SceneControls>` — a slider panel for bloom (including its
threshold **knee** and **fine levels**, the two that decide glow-versus-outline),
depth of field (whose **max blur** is in page pixels), atmosphere (fog mode with density or near/far, fog colour, sky
top and bottom, exposure, grain), lighting (screen glow, environment
intensity, key light), a **"CRT glass"** block (scanlines, line pitch,
vignette, roll, roll speed, chroma), a **"Final shot"** block of number fields (the
television's and the figure's world position *and* world-axis rotation offset, at
the start and end of the epilogue's reveal — typed, not dragged, because neither
a coordinate in a room nor an angle offset has a natural slider range), plus buttons to hide the panel and to copy the current
values as a config block. The `NODE_ENV` check guards the `dynamic()` call itself, so a
production build emits no chunk for it at all. Full documentation: [[scene-3d]].

> [!note]
> `components/ui/` (design-system primitives) does not exist yet — create it when
> the first primitive is added. See [[folder-structure]].

## Black panels — `panels/`

Everything the scroll slides up over the scene once the carousel is done. Two
panels today; the stack takes as many as it is given.

| File | Role |
|------|------|
| `panel-stack.tsx` | The machinery — where each panel is, which one is up, and when the scene may stop drawing |
| `pixel-wave.tsx` | The dissolve the first panel arrives on — a wave of squares filling the window from the bottom |
| `team-panel.tsx` | Figma node `1442:352` — heading, `[ 01 / 08 ]`, the card ring, the front member's name and tags |
| `about-panel.tsx` | Figma node `1444:410` — heading, the two-tone lead, three `#dbfffe` cards |
| `../team/team-carousel.tsx` | The ring itself: geometry, drag, throw, snap |

### `<PanelStack panels onCovered>`

**The stack is the transition.** The scroll used to hand over to these by driving
the lens into a television until the glass was the whole frame; that zoom is
gone. The first panel **dissolves** in — a wave of pixels up the window — and
the rest rise from the bottom, each pushing the last out of the top, until the
final one carries on up and out as the closing shot is revealed.

A panel's `enter` and `exit` pick which, independently: `slide` (the default) or
`pixels`. Today the first panel dissolves **in** and the last dissolves **out**,
with an ordinary slide between them. A panel does **not travel through the side
it dissolves on** — it is already squared with the window and the wave is what
brings it up or takes it away — but the other side still slides, so the tiling
below is unaffected. A panel with a dissolve on either side carries **no
background of its own**: the wave's squares are the black, and painting it behind
them would put the whole panel up the moment the wave started. Its words arrive
on the back half of the dissolve and leave the same way, before the ground goes
out from under them.

> [!important] The windows are laid end to end, and that is the point
> Every version of this that left a gap between two of them put a **pause** in
> the scroll — a panel sitting perfectly still while the wheel turned. The rise,
> each hand-over and the leave now run straight into one another, and the dwell
> is inside the transitions: they are long enough (about half a viewport of
> scroll each) to read the panel *during* the move.
>
> Each of them is travelled **linearly** ([[decisions-log]] ADR-0033), which is
> why they are as wide as they are: the rise opens at 0.12 of the finale (it was
> 0.35 when it was eased) and the leave takes two thirds of the reveal (0.45).
> An eased window hides its own shortness because it is barely moving at either
> end; the same window at one rate is abrupt at both.

The stride is a window **plus `GAP` (294px)**, not a window exactly. Tiling them
edge to edge put the team block's tags 147px from the studio's opening line as
the two crossed the window — 50px of the one's footing plus 97px of the other's
head — and the brief was three times that. What shows in the gap is the finale's
black layer, which is at full strength for the whole stretch the stack covers;
the room behind it is not being drawn at all.

One number does all of it: `offset` runs `0` (all below) through `1` (the first
panel covering) and `2` (the second) to `panels.length + 1` (all gone), and panel
`k` sits at `(k + 1 − offset) × (100% + GAP)`. They are laid **one window plus
`GAP` apart**, and nothing of the room shows in that gap — the finale's black
layer is up for the whole stretch, which is also why `onCovered` is a *range*
(`1 ≤ offset ≤ n`) and not a per-panel test: what matters is that the scene is
not worth drawing across the whole hand-over, not that a panel covers every
pixel of every frame of it. The windows come from the scene's own acts: up over the tail of
the finale, a hand-over per join across the stretch where the scene is being
staged, away as the epilogue's reveal begins.

`fixed` and driven by the scroll rather than placed in the flow: the scene is a
canvas that is `sticky` for the whole page, so what covers it has to be pinned to
the window too. Transforms are written **straight to the elements** off the
shared ticker — two whole acts change them, and a re-render per frame to set one
number is a re-render too many. React state carries only *which panel is up* —
and *which panel is **arriving***, a wider test (`0.62` of the way rather than
`0.1`) that the headings key off, so they are already resolving while the panel
is still on its way rather than starting once it has landed.

While the stack covers the window it calls `onCovered`, and the scene **stops
drawing altogether**. A canvas behind an opaque panel costs exactly what an
uncovered one does — bloom, defocus and all — and holds seven video decoders open
for a picture nobody can see.

> [!warning] Do not park a panel with `translate-y-full`
> Tailwind v4 compiles `translate-*` to the standalone **`translate`** property,
> which is applied *before* `transform` and cannot be overridden by it. The panel
> sat a viewport below the window while its own transform read as identity, and
> every measurement said it was in the right place. `invisible` covers the first
> frame instead; the ticker owns transform and visibility from there.

The stacking order this rests on: blackout `z-20` → panels `z-25` → the frame and
its readouts `z-30` → the nav `z-40`. The panels are opaque, so the HUD had to
come up over them to stay visible, as the design has it.

### `<PixelWave handle>`

The hand-over from the room to the team block, and the one piece of this that is
drawn rather than laid out. A grid of 18px squares fills from the bottom up — and empties the same way when
a panel dissolves out, since the handle only takes a number and the caller
decides which way it runs. Each cell has a fixed random offset, and it turns
solid once the wave has passed *its row plus its offset*. The randomness is the whole look — it makes the front
a scatter of pixels ahead of the solid fill rather than a ruled line — and
because the offsets are drawn once and kept, scrubbing the scroll replays the
same dissolve instead of boiling.

**Canvas, not elements.** The same thing in DOM is four thousand `div`s to lay
out and style; here it is one node and a few hundred `fillRect`s, and only the
rows inside the ragged band are drawn cell by cell — everything below it is one
rectangle. Driven imperatively through a handle, like everything else that moves
on most frames of an act. Measured at 16.66 ms average while scrubbing the wave
with the scene still drawing behind it.

`SPREAD` (a third of the window) is how deep that ragged band is: at zero the
wave is a straight line sweeping up, and too much makes it a slow grey fog.

### `<TeamCarousel members label index onIndex active onHint>`

A **real cylinder**, which the two builds before it were not. Each card is
`rotateY(--a) translateZ(-r)` on a ring that is itself `translateZ(push)
rotateY(--rot)`, and `push = r · (1 − arcDepth)` is the whole trick: it carries
the ring forward so the front card ends up at the viewer rather than a radius
away. That is what makes the arc read as *concave* — curving away from you —
while every card is genuinely turned to face the axis it stands on.

Sizing, re-derived on resize: `cw = max(150, min(share × vw, 26vh))`,
`ch = cw × 1.36`, `r = cw × 3`, `push = r × 0.3`, and a perspective of
`max(900px, 115vw)`. **`share` is not one number** — 0.17 desktop, 0.30 tablet,
0.52 phone. A sixth of the window is a generous card at 1440 and a postage stamp
at 390, where the ring was falling back to its 150px floor: a third of the screen
for the thing the whole panel is about. The narrower the window, the larger the
share it can afford, because there is no longer any question of the row reaching
both edges — and the height cap below is unchanged and still wins wherever it is
the tighter of the two.
The card at the front stands inside a **static** mint frame — a `span` on the
stage, not on the ring, so it does not turn with the cards and does not live in
their 3D space: the card the ring brings round arrives *inside* it. Slightly
larger than a card on every side, which is what makes it read as a viewfinder
rather than as a border on the photograph.

Cards **fade** across the last third of their travel (`fadeFrom`/`fadeTo`, 58°
to 92°) and are only dropped from the compositor once they are already invisible.
They used to switch off at 96°: one frame solid, the next not there, and a row of
photographs blinking out at both edges is the first thing the eye goes to.

`onHint` fires on pointer enter and leave and is what puts *Drag to explore* on
the cursor — the ring is the one thing on the page that has to be *told* it moves,
because a row of photographs carries no promise that it does. It also fires
`false` when the panel goes inactive: a panel that leaves under the cursor does
not always send a `pointerleave`, it stops taking the pointer instead.

Fourteen slots; the members cycle to fill them, so the duplicates are round the
back where nobody is.

> [!warning] Two sizing traps, both paid for
> **No upper cap on the card.** There was one (238px), and a wide window kept
> 238px cards on a 714px radius while the window grew around them — the arc
> stopped short of both edges and left a band of empty black down each side.
> **The height is the binding limit, and it is set by the ring's sides, not its
> front.** Those pass close to the lens and render half again as tall as the
> front card; 26% of the window's height is what keeps them from running up
> behind the heading, and it leaves the front card at about a quarter of it —
> 165×224 at 1440×800, against the design's 173×235.
>
> The perspective was lengthened from the specified `0.8vw` to `1.15vw` for the
> same reason: a longer one flattens the difference between the ring's front and
> its sides *and* makes the front card bigger.

Nothing is printed on the cards. A number and a handle on every face made the row
read as a deck of tickets; the dock under the ring names whichever card is at the
front, and each card keeps its member's name for a screen reader.

**Cards round the back leave the compositor.** `backface-visibility` already
stops them being drawn, but each is still a layer to hold and transform, and
fourteen of those at a third of the window each is the difference between sixty
frames and twenty on a weak GPU. Anything more than 96° round is set
`visibility: hidden` — seven of the fourteen at any moment — and only the frames
where a card crosses that horizon write anything.

**Drag, throw, snap.** The pointer turns the ring 0.16° per pixel; letting go
leaves it spinning and the spin decays by `0.94` a frame; under `0.05` the
nearest card is eased to dead centre by `0.14` of the remaining angle, landing
*exactly* so the rotation stops changing and a hovered card does not shiver.
Arrow keys and the dock's controls step it by one; a tap — hit-tested at the
release point, because the pointer capture has retargeted the event to the stage
— brings that card round the shorter way.

> [!warning] It is not a spring, and that is on purpose
> Hard rule #1 bends here: this is a thrown object with friction, and a spring
> started at a target has no memory of the velocity that got it there. See
> [[decisions-log]] ADR-0030 — which also records the two builds that got the
> geometry wrong (a cylinder with the turn and the depth *separated*, then the
> same with every length in raw pixels, which closed the row into a solid
> overlapping wall on a wide window).

The portraits under `public/assets/team/` are **generated placeholders** — PNG,
not SVG, because `next/image` refuses SVG without `dangerouslyAllowSVG`, and
abstract on purpose: a drawn-on figure reads as a bad photograph, a duotone panel
reads as a slot waiting for one.

> [!note] Regenerating them needs the dev image cache cleared
> `next/image` keeps optimised copies in **`.next/dev/cache/images`** (Next 16
> moved it out of `.next/cache`). Overwrite a file in `public/` and the optimiser
> keeps serving the old one through reloads *and* a server restart — half an hour
> went into art that was already on disk. `rm -rf .next/dev/cache/images`.

### `<AboutPanel content>`

Figma node `1444:410`. The
heading is hard against the **60px** left margin at the usual 97px; the lead sits
beside it on a **667px** measure at **Chakra Petch 32/1.2**, with alternate
clauses at half strength (that alternation is what gives one sentence its
rhythm, so the copy arrives as clauses rather than a string); three `#dbfffe`
cards run across the foot, **331** tall on a 16px gutter, each with a black 66px
tile at the top-left and its copy on a 341px measure at the bottom. Every inset
in a card is **32px**, and the row is a grid on the design's own margins rather
than three placed boxes, so it holds together on a window the design never drew.

The three cards **rise into the panel on a trail** rather than on three delays:
a trail is one spring pulling the next, so the row arrives as a run of movement
instead of three things landing on a metronome, and it leaves in the same order.
Low tension against high friction — these are big flat slabs, and a bounce on one
reads as a wobble in the whole row.

The three marks — ring, triangle, rounded square — are **drawn**, not shipped:
three outlines at one stroke weight are less code than three files, and they take
the palette's colour.

> [!important] It is a **column**, not four absolutely-placed boxes
> Every number above survives — the 97px head, the 60px margins, the 50px
> footing, the 331px row on its 16px gutter — but as padding and a height on a
> `justify-between` flex column rather than as four independent `top`/`bottom`
> offsets. Absolutely placed, the head and the foot were pinned to opposite edges
> of *whatever shape the window is*: on a 3:4 tablet that left a third of the
> panel as a black band through the middle, and on a phone the three cards were
> 69px wide with 32px of padding in them.
>
> The column does three things no set of offsets can. The head is a
> `sm:grid-cols-3` whose lead spans columns 2–3, which is what aligned the
> paragraph to the second *card* rather than to the middle of the window — now
> without the `calc()` that used to say so. The cards are one column under `sm`,
> tile beside copy instead of above it, same two children in the same order. And
> the panel is **centred until `lg`**: holding a head and a footing apart is a
> 16:9 idea, and `lg` is near enough the line between a tall window and a wide
> one — every tablet is over it in landscape and under it in portrait.

## Related

[[component-conventions]] · [[components/animation-springs]]
