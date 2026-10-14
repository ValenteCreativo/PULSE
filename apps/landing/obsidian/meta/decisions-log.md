---
tags: [meta, decision]
updated: 2026-08-10
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0037 — A link exists only when its route does

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The site has **one** page. It was shipping links to five more:
`/contact` (twice — the nav pill and the hero's primary call to action), `/work`,
`/work/<slug>` for every case in the ring, and `/privacy-policy` from both
consent surfaces. Every one of them 404s. The failure is worse than a dead end:
each carries a hover state, a pointer, a tab stop and — for *Explore* — an arrow,
all of which are a page **promising** something it cannot do. The consent banner's
was the worst of them, being the one place on a site where a visitor is asked to
trust it.

**Decision.** `href` becomes **optional** wherever it is content, and a component
renders an anchor only when it has one:

| Where | With an `href` | Without |
|---|---|---|
| `<HeroCopy>` | `<Link>` + hover | `<span>`, no hover, no pointer |
| `<SiteHeader>` *Contact* | `<Link>` + hover | `<span>` |
| `<CasePanel>` *Explore* | `<Link>`, `group-hover`, tab stop | plain `<div>` |
| consent copy | `<Link>` in both surfaces | plain text |

The **hover goes with the link**, deliberately. A shape that lights up under the
cursor and then does nothing is what reads as broken; the same shape sitting
still reads as a label, which is what it is. Nothing about the design changes —
every button, the arrow included, still renders exactly as drawn.

The values live where the content does: `data/mocks/home.ts` for the CTAs and
the cases, `siteConfig.privacyPolicyUrl` for the policy (both consent surfaces
read the one field through `<PrivacyPolicyLink>`, so they cannot disagree).
**Writing a route means writing its `href` back** — one line, in one place, and
the element becomes a link with its hover again on its own.

**Consequences.** `curl` the page or walk it with a headless browser and the only
anchor on it is `/`. New sections must not write an `href` ahead of the route:
the reflex "add the link now, build the page later" is exactly what this ADR
exists to catch. The trade is a conditional in four components — cheap, and each
one is three lines.

`/api/contact` is **kept**. It is not a page, nothing links to it, and it is the
worked example the [[api-architecture]] note documents plus the consumer of
`CONTACT_ENDPOINT`; deleting it would remove the backend convention from a
starter whose point is to carry one.

---

## ADR-0036 — The site is Codescan, and `siteConfig` is the only place that says so

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The SEO layer was fully plumbed and entirely placeholder: *New
Project*, `@newproject`, `http://localhost:3000`, a manifest named `App`, and a
`browserconfig.xml` pointing at three `ms-icon-*.png` that were never in
`public/`. Everything downstream of `siteConfig` was therefore correct machinery
producing wrong output — which is the failure mode that ships, because it does
not error.

**Decision.** Name the studio **Codescan** and derive the rest:

- `siteConfig` gains `title` (the whole home-page title, separate from `name`,
  which is what a `%s — Codescan` template appends), `ogImageSize` (declared from
  the real asset, so nothing else names 900×600), `locale`/`language` (the root
  layout's `lang` reads it), and a production-domain fallback for `url` rather
  than `localhost`.
- The **title template lives in the root layout only** — a template rewrites the
  titles its descendants declare, so a second one compounds. `titleAbsolute` on
  the home page opts its already-complete title out of it.
- JSON-LD grows a `WebPage` node beside the `Organization` + `WebSite` pair, with
  the three `@id`s exported as `schemaId` so the graph links to itself rather
  than repeating URLs. It is rendered from the **view**, not the route file,
  which keeps `page.tsx` to its `metadata` export and its view (ADR-0003).
- `googleBot` gets `max-image-preview: large` / `max-snippet: -1`;
  `formatDetection` is off; **no `keywords`** — that was dropped from this
  generator years ago on purpose and stays dropped.
- `generateViewport()` keeps pinch-zoom. `userScalable: false` on a site whose
  smallest design is 360px wide is a WCAG 1.4.4 failure.

**Consequences.** Renaming the site is one file. The `url` fallback is a real
domain, so a preview deploy that forgets `NEXT_PUBLIC_SITE_URL` points its
canonicals at production — documented in [[seo-metadata]] and `.env.example` as
something to set per environment, which is the lesser of the two failures
(the other being canonical URLs that resolve nowhere).

---

## ADR-0035 — A clamped ladder, and three regimes instead of five

- **Status:** Accepted — amends ADR-0008
- **Date:** 2026-08-10

**Context.** *"Looks a bit off on mobile and tablet."* Two separate faults.

The **ladder** (ADR-0008) gives each viewport range a design base width and
scales the root font-size by `16 × 100 / baseWidth` vw. That is exactly right
when every range has a design drawn at its base. This project has **two**
designs, 1440 and 360, and five ranges — so three of them were interpolating
toward a base that does not exist. A range's bottom edge is `16 × bottomWidth /
baseWidth`, which put the root font-size at **10px at 641px** (the whole page at
62%; body copy at ten pixels) and **28px at 640px** (a 360px design at 1.8×; the
nav pill wider than the window, the headline off both edges, the frame's readouts
under the pill). One pixel of window between them.

The second fault is that scaling cannot fix **shape**. Three cards across a phone
are 69px of card and 64px of padding at any root font-size; *Previous* and *Next*
240px in from each edge of a 390px window cross over and swap sides; a centred
535px measure in a 390px window runs off *both* edges at once. All three were
live.

**Decision.** Two changes, and a rule about where each one applies.

1. **Clamp the ladder.** `GridBreakpoint.clamp` — a **12px floor** on the tablet
   range and an **18px ceiling** on the phone range, mirrored in `globals.css` as
   `max(1.5625vw, 12px)` and `min(4.444444vw, 18px)`. The phone range takes no
   floor: under 360px there is no narrower design to switch to, so proportional
   shrinking is the only honest answer. The two lower thresholds move to 1023.98
   and 639.98 so they line up exactly with Tailwind's `lg:` and `sm:` — `rem` in
   a media query is always the initial 16px, so those do not drift with the root
   font-size.

2. **Reflow at three regimes, and only three.** Bare = phone (the 360 design),
   `sm:` = tablet (the desktop design made compact), `lg:` = desktop (the Figma
   frame untouched). `md:` and `xl:` are not used: a fourth breakpoint is a
   fourth layout nobody has drawn.

**`lg:` is doing double duty on purpose.** It is the width where the desktop
design takes over, and it is also — near enough — the line between a tall window
and a wide one: every tablet is above it in landscape and below it in portrait.
So the panels that hold a head and a footing at opposite edges (`about-panel`)
key *that* off `lg:` too, rather than off `sm:`.

Where scaling was the whole answer, nothing changed: the **3D scene** is already
aspect-aware in `lib/scene/` and frames a portrait window correctly, and the
page's `840lvh` stays — every act in `scroll` is a share of it, so shortening it
on a phone would rescale the whole choreography at once.

**Consequences.** Two designs now cover every viewport, and the reflow points are
few enough to hold in your head. `about-panel` had to become a **flex column**
to get there (same numbers, expressed as padding and `justify-between` rather
than four independent offsets) — absolute placement cannot stack, cannot swap a
tile from above the copy to beside it, and cannot give back space it does not
have. Every new component now carries three sizes rather than one; the catalog
([[components/common]]) marks them *Narrow*.

---

## ADR-0035 — The last shot is built on one fixed television

- **Status:** Accepted
- **Date:** 2026-08-10

**Context.** The epilogue was staged around `carousel.front` — whichever case the
visitor had left turned to the front of the ring. That reads as the obvious
choice and is wrong, because **the members are not interchangeable**. They are
clones of different televisions in the wall: a deep 4:3 CRT, a flat widescreen
set, glass of different sizes, some of them mirrored copies of their neighbours.

Everything in the last shot is measured against that glass — `finaleDistance` is
derived from its size, the lens's anchor from its centre, and the figure's place
from where the lens ends up. So the shot came out differently for every case a
visitor happened to stop on: the closing picture cropped on the widescreen set
and read backwards on a mirrored one, the television changed size, and the figure
landed somewhere else in the frame each time. Three separate bug reports, one
cause.

**Decision.** `carousel.closingIndex` names the member the last shot is built on,
and it is fixed. `TvCarousel.closing` is what the epilogue dresses, places, picks
and measures; `front` stays what the ring's own acts use, because the case a
visitor chose is exactly what the carousel and the finale are about. Passing
`frontPlacement` to `update()` is what switches which member counts as the hero —
that argument is only ever passed by the staging.

**Consequences.** The closing shot is the same shot every time, which is what a
closing shot is. The cost is that the last thing on the page is not the case the
visitor was looking at; that was never a promise the page made — the black is
total across the join, and what comes out of it is the studio's own card.

A set that has been *placed* is no longer standing on the ring, so it is exempt
from the ring's culling: `slot` is measured from the active index, and without
that exemption a few turns put the closing television past `hideBeyond` and the
last shot lost it altogether.

Anything new in the epilogue reads `closing`, never `front`. The mirror test in
`TvFlyer.screenReadsMirrored` stays: it costs three vertices, and the fixed set
being un-mirrored today is a property of the model, not a guarantee.

---

## ADR-0034 — The preloader is the page's starting gun, not a spinner

- **Status:** Accepted
- **Date:** 2026-08-09

**Context.** The room is a 12 MB GLB, seven videos and a post chain that links
thirty-odd shader programs. Before this, the first thing a visitor saw was a
black canvas that filled in over a second or two — and the hero's headline
resolved out of its blur *during* that, so its one animation was spent before
there was anything to look at.

**Decision.** A curtain (`components/common/preloader/`) over the first paint,
and a two-flag module (`lib/page/intro.ts`) that everything else keys off:

- The scene calls `markSceneReady()` after the model is loaded, the materials are
  compiled and **one real frame has been drawn** — not on `load`. It is also
  called when the scene fails to start, or a browser without WebGL would sit
  under the curtain forever.
- The curtain counts to that. It advances at its own pace to 92% and waits there,
  finishes when the room reports in, and is then clipped away from the bottom up.
  A `PATIENCE` cap lets the page in regardless after six seconds.
- It calls `markIntroDone()` **as the lift begins**, and the hero's copy starts
  then — not on the spring's rest. The sheet clips from the bottom up, so the top
  of the window is uncovered last; started on rest, the headline's letters only
  began resolving once they were already in view.

**Consequences.** The hero animates once, into a room that is already there. The
module is deliberately tiny and one-way: no store, no context, no provider, and a
late subscriber is told immediately rather than waiting for an event that has
already fired — the three parties (curtain, scene, hero) are on three branches of
the tree, and one of them does not exist yet when the others mount.

The curtain **stops Lenis** while it is up, and starts it again when it is gone —
keyed on that, not on unmount, because the component renders `null` rather than
unmounting and an unmount cleanup would leave the page locked for good.

---

## ADR-0033 — Everything the scroll drives is linear

- **Status:** Accepted
- **Date:** 2026-08-09

**Context.** Every act mapped its window through a smoothstep: the flight, the
carousel's entrance, the finale, the epilogue, the panels rising and handing over,
the hero's copy leaving. Each one is still at both ends of its own window, which
compounds — the page crept at the start of every transition, hurried through the
middle, crept out again, and the flight came to a **complete stop** in the middle
of itself where its two eased legs met.

An eased map is right when a *time*-driven animation plays on its own. It is
wrong when the user is the clock: the wheel turns at one rate and the picture
does not, and what that reads as is the page lagging and then catching up.

**Decision.** Every scroll → progress map is linear (`phase()` and nothing else).
Smoothstep stays where it belongs: inside shaders (the sky's gradient, the dust's
depth fade, the CRT's scanline), which are not driven by the scroll.

**Consequences.** The transitions were **widened** to compensate: an eased window
hides its own shortness because it is barely moving at either end, and the same
window travelled at one rate is abrupt at both. The panels' rise starts near the
top of the finale (0.12 of it, was 0.35) and their exit takes two thirds of the
reveal (was 0.45); the dissolve hands its words over across a longer stretch.

The flight keeps its two legs — the room is worth crossing at a different rate
from the empty corridor past it, and the two lines standing in that corridor are
timed against those numbers — so there is now a change of *speed* where they
meet. That is a far smaller thing than the stop it replaced.

---

## ADR-0032 — One scroll clock: Lenis on the shared ticker, one low-pass for the page

- **Status:** Accepted
- **Date:** 2026-08-09

**Context.** The page felt like it caught in places. Three things were pulling
against each other. Lenis ran a `requestAnimationFrame` loop of its own while
everything that reads the scroll ran on the shared ticker — two loops, and on any
frame where they fell the wrong way round the page was drawn from *last* frame's
scroll position. The scene low-passed its copy of the progress (`scroll.smoothing`)
and the panels, the hero's copy and the pixel wave did not — so the room eased
while the words over it stepped. And Lenis was on its stock `lerp`, tuned for a
document, not for eight screens of one continuous shot.

**Decision.** One clock and one filter.

- `lenis.raf` is a **subscriber to the shared ticker**, and the first one: the
  scroll layout mounts before the page does, and the ticker calls subscribers in
  the order they arrived. Everything downstream reads a position written this
  frame.
- `smoothScrollProgress(time)` in `lib/animation/scroll-progress.ts` is the one
  low-pass, frame-rate independent (`1 − (1 − k)^(dt·60)`) and snapping rather
  than crawling across a jump. It is idempotent within a frame — the first call
  advances it, later ones with the same timestamp get the same number — so three
  subscribers calling it is still one filter.
- `scroll.smoothing` / `scroll.snapAbove` in the scene config are deprecated;
  the tuning panel still prints them.

**Consequences.** The scene eases exactly as it did (0.18 per frame became 0.2
shared), and the panels and the copy now ease *with* it instead of stepping
alongside. A permanently-running rAF while the scroll layout is mounted, which is
what Lenis already had. Anything new that reads the scroll per frame should call
`smoothScrollProgress`, not `scrollProgress` — the raw one is for measuring, not
for animating.

---

## ADR-0031 — Headings scatter on their own springs, not through the text engine

- **Status:** Accepted
- **Date:** 2026-08-08

**Context.** Hard rule #3 sends **all** text animation through
`spring-text-engine`. The brief for the page's headings is: the letters resolve
out of a blur, *all starting together, each at a different speed, in no
particular order* — explicitly **not** left to right.

The engine cannot express that, and the reason is structural rather than a
missing option. Its staggers (`letterStagger`, `letterDelayIn`, …) are **single
numbers applied by sequential index**, and there is exactly **one
`letterConfig`** for every letter of a block. Whatever those numbers are set to,
what comes out is a sweep in index order at one speed. Its triggers are the
other half of the problem: `always` and `forward` are viewport-based and every
one of these headings lives inside a `fixed` panel that is always technically in
the viewport, while `progress` wants a scroll range that these panels — driven
by a custom scroll model — do not have.

**Decision.** A small `<ScatterText>`: one `@react-spring/web` spring per
letter, each with its own config, all started by one boolean. Per-letter speed
comes from a **hash of the letter's index**, not `Math.random`, so the server's
markup and the client's animation agree.

**Consequences.** One component, used by four headings, and the rest of the
project's text still goes through the engine — this is not a licence to hand-roll
the next reveal. Two things it has to keep doing, both of which the engine gave
for free: the unsplit string stays in the DOM (`sr-only`) with the split copy
`aria-hidden`, and words are kept whole so lines break between words rather than
between letters.

---

## ADR-0030 — The team's card ring is a thrown object, not a spring

- **Status:** Accepted
- **Date:** 2026-08-08

**Context.** Hard rule #1 is that all motion is spring-based, through the
vendored components or `SpringValue`. The team's carousel is the one place that
does not fit. It is **drag-driven**: the ring follows the thumb exactly while it
is down, keeps spinning when it is let go, slows under friction, and eases the
nearest card to dead centre once the throw is spent. A spring can model the last
step alone, but not the middle one — and the three together are one gesture with
one feel, specified as such (`drag 0.16°/px`, `damp 0.94`, snap factor `0.14`).

Two builds tried to avoid this. The first put the ring on a `SpringValue` and
`set()` it during the drag; a throw then had no carry at all, because a spring
started at a target has no memory of the velocity that got there. The second
guessed at the geometry as well, and both are described in
[[components/common]].

**Decision.** A plain integrator: `rot += velocity; velocity *= damp`, then a
proportional ease onto the nearest slot once `|velocity|` falls under a
threshold, with an exact landing so the value stops changing and a hovered card
does not shiver. It runs on the **shared ticker** like everything else, and it
writes the rotation straight to one custom property — the cards are laid out
from it in CSS, not per-card in JavaScript.

**Consequences.** The rule's *reason* still holds — no CSS keyframes, no second
animation library, one rAF for the page — but the letter of it does not, and
that is deliberate. Anything else that wants throw-and-settle should copy this
rather than reach for a spring; anything that is a state change (a reveal, a
hover, a fade) still uses the springs.

The geometry is a **real cylinder** and has to stay one: each card is
`rotateY(a) translateZ(-r)` on a ring that is itself `translateZ(push)
rotateY(rot)`, where `push = r · (1 − arcDepth)` carries the ring forward so the
front card lands at the viewer. Depth and turn are one thing on a ring; the
build that separated them (a hand-made depth curve plus an independent tilt) put
every card at the wrong angle for where it stood, and no amount of tuning either
number fixed it.

---

## ADR-0029 — Sections on the black are pinned overlays, not flow sections

- **Status:** Accepted
- **Date:** 2026-08-08

**Context.** The scroll ends on a stretch of total black that exists to carry
page sections — the team block is the first. The obvious build is a normal
`<section>` after the scene's, in the flow, scrolling past like any other. It
does not work: the black is a `div` over a canvas that is **`sticky` for the
whole page**, so a section placed after the scene's `700lvh` scrolls in *below*
the black rather than over it, and one placed inside the sticky box inherits the
box's own scroll behaviour and cannot be scrolled through.

**Decision.** `fixed inset-0`, above the black's `z-20`, with its **transform
written straight to the element** from the shared ticker over windows read from
the scene's own acts rather than restated. `visibility` follows it — which is
what takes the block out of the pointer's way, since a hidden element is not
hit-tested — and `inert` takes its controls out of the tab order.

> [!note] Revised 2026-08-08 — the panel is now the transition
> As first built the block **cross-faded** in over a black the scene produced by
> driving the lens into a television until the glass filled the frame. That zoom
> is gone: the block is **opaque** and slides up from the bottom of the window
> instead, so the hand-over is the panel arriving rather than the scene being
> dressed for it. The blackout layer stays underneath as a guarantee that
> nothing of the staging leaks at an aspect the panel does not quite fill.
>
> Being opaque also means the scene behind it can **stop drawing altogether**
> (`onCovered` → `scene.setCovered`), which is the single biggest saving on the
> page: a covered canvas costs what an uncovered one does, and holds every video
> decoder open for a picture nobody can see. It is safe because everything the
> scene shows is derived from the scroll rather than integrated — the frame it
> draws on the way back is correct without having drawn any of the ones between.
>
> Tailwind v4 compiles `translate-*` to the standalone **`translate`** property,
> which is applied before `transform` and cannot be overridden by it; the panel's
> resting position has to come from the same inline transform the ticker writes,
> never from a `translate-y-full` class.
>
> **Revised again the same day:** the *first* panel does not slide in and the
> *last* does not slide out. Both are held square with the window and
> **dissolved** — a canvas of squares filling from the bottom on the way in and
> clearing the same way on the way out — because a panel sliding over the
> carousel read as a shutter rather than a hand-over. The joins between them
> still slide, so the tiling the stack depends on is unchanged.
>
> The stack's windows are also laid **end to end**, with no still air between
> them: every gap was a pause in the scroll, a panel sitting motionless while
> the wheel turned. The dwell lives inside the transitions instead, which are
> half a viewport of scroll each. `epilogue.hold` and `.reveal` moved with them
> — the pull-back now *starts* with the last dissolve rather than waiting for
> it, and the staging has to be finished before that dissolve opens.

**Consequences.** The block is legible for exactly the stretch where there is
nothing behind it, and it costs one ticker subscriber and no re-renders: React
state carries only which card is at the front and whether the block is up far
enough to drag. The cost is that the section does not *scroll* — it is pinned
and slid, so anything laid over it has to fit one frame. The second section will
need its own slice of the same window rather than more page height.

The card carousel inside it is **DOM with CSS 3D**, not more WebGL: it is
interactive content with text and focus, and the canvas is `aria-hidden`. Its
ring is driven imperatively on a ticker tick — the same bargain the scene
strikes, and the only one that survives a drag, which fires on every pointer
move. What drives it is not a spring; see ADR-0030.

---

## ADR-0028 — The words the camera flies through are canvas textures

- **Status:** Accepted
- **Date:** 2026-08-08

**Context.** Between the wall and the carousel the flight crosses several
seconds of empty fog, and two lines of copy are to stand *in* it — one large and
near, one small and further back — for the lens to pass through. The parallax
between them is the whole effect, so they need real depths. Three ways to get
type into a three.js scene: **a glyph mesh** (`TextGeometry` plus a JSON font, or
`troika-three-text`) — a dependency and a font asset, for two static strings; a
**DOM overlay** — free, but a `div` has exactly one depth, the screen's, and the
camera cannot fly through it; or a **canvas texture on a quad**.

**Decision.** Canvas textures. Each line is rasterised once with the page's own
webfont through the 2D context and mapped onto a `PlaneGeometry`
(`lib/scene/tv-signs.ts`). Two quads, two textures, no new dependency. Being in
the scene gets them the fog, the defocus and the grain for nothing, and the near
line is correctly **occluded by the sets it passes behind** — which is what sells
it as lifting out of the room rather than sitting over it.

They fade on **distance ahead of the lens**, not on scroll: passing is what the
fade belongs to, and it keeps them out of the opening shot for free — from back
there the near line is eight units off, well past the range at which anything
appears.

**Consequences.** No measurable cost (16.6 ms average, p95 16.8 during the
flight): two transparent quads and no per-frame work beyond an opacity write.

> [!note] The hover label was built on this reasoning, and it was the wrong call
> A label over the hovered television was made the same way — a plane in the
> room, turned with the set. Every complaint about it followed from that: a
> different apparent size on every television (perspective), needing to be sized
> by axial depth to hold one size on screen, being buried behind whatever stood
> in front of it, and needing `DoubleSide` because a set turned far enough showed
> it edge-on. It is a **chip on the cursor** now
> ([[components/common|`<HoverChip>`]]), which is one size in one place and a
> third of the code.
>
> The distinction worth keeping: the flight's lines have to be in the room
> because the camera **flies through them** and the parallax between them is the
> whole effect. A label naming what is under the pointer has no such need — it is
> interface, and interface belongs on the glass.
Two things to know before adding a third line:

1. **The family cannot be read from `--font-display`.** It is declared in an
   `@theme inline` block, which Tailwind resolves *into the utilities* and never
   emits as a custom property — `getPropertyValue` returns an empty string, and
   the first build of this silently rasterised the fallback grotesque, which
   looked plausible enough in a screenshot to nearly pass. Ask the cascade
   instead: a throwaway element with the `font-display` class, and whatever
   `font-family` it computes to.
2. **The first draw can precede the webfont.** `document.fonts.ready` triggers a
   redraw into the same texture object, so nothing downstream has to know.

---

## ADR-0027 — The last shot is staged behind the black, not cut to

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** The scroll ends on a full-frame black, which two page sections are
to be laid over. After them the black lifts on a closing shot: the figure close
at one edge, a television at the other. Two ways to get there. **Cut** to a
second staging area — a cloned figure, its own lights, its own set — which means
a second skinned mesh with a second `AnimationMixer`, a fourth light (and the
program recompile that a change in light *count* costs), and a second copy of a
television. Or **stage it out of what is already in the scene**, during the
stretch where the frame is entirely black.

**Decision.** Stage it. While the black is total the scene reuses:

- the **figure** — the same object from the opening, moved across the room and
  faded back up on the same `opacity` that dissolved it for the flight;
- one of the three **spill lamps**, moved to just in front of the glass, which is
  where that television would be throwing light anyway;
- the carousel's **front set**, left exactly where it stands with its aim frozen
  at the finale's viewpoint so the pull-back sees it from a quarter on.

And the reveal is a **pull-back, not a cut**: the lens starts hard up against the
glass and draws away into the blocking. The cover over the join is total, but the
shot on the other side of it is one continuous move.

> [!note] Revised 2026-08-08 — the lens is placed there, not driven there
> The finale used to *travel* to that starting point, pushing in until the glass
> filled the frame. The zoom is gone (see ADR-0029), so the lens is now put there
> while the panel covers the window — which is legitimate for exactly the reason
> the rest of the staging is. What the finale still computes is **where** there
> is: the glass's position and the distance at which it would be the frame. That
> arithmetic is load-bearing, and deleting it with the zoom would strand the last
> shot back in the room.

**Consequences.** The epilogue costs no new geometry, no new material, no new
light and no second animation — the running cost is unchanged (16.7 ms average,
p95 17.2 across the whole scroll). Two obligations come with it, and both were
learned the hard way:

1. **Everything borrowed has to go back.** Scrolling *up* out of the epilogue
   must return the figure to where it stands in the opening and the lamp to where
   the room's lighting expects it, or the opening shot comes back with nobody in
   it — which is exactly what happened.
2. **Staging must never be visible.** It is only legitimate because the black is
   total across it. Anything that moves the reveal earlier, or lets the black
   lift before the staging is done, breaks the trick rather than looking slightly
   off.

The blocking's sideways offsets are scaled by the window's aspect against a
`referenceAspect`, because a frame's height is fixed by the field of view and its
width is not: offsets that read as "at the edge" on 16:9 put the figure off frame
entirely on anything narrower.

---

## ADR-0026 — The carousel is a ring turned by one number

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** The carousel of works needs previous/next controls and has to
**loop** — press next enough times and the first work comes back round. The
obvious shape is a list of slots with the members shuffled between them on each
press, which needs a "which set is in which slot" map kept in sync, a special
case for the member falling off the end, and somewhere off-screen to teleport it
to. Every one of those is a place for the state to drift out of step with what is
on screen, and the teleport is a pop unless it is hidden.

**Decision.** The members hold **fixed indices on a ring**, and what moves is the
ring's rotation. A member's *slot* is the signed distance from its index to the
front, wrapped into `±count/2`:

```ts
const raw = index - rotation.get();
const wrapped = ((raw % count) + count) % count;
return wrapped > count / 2 ? wrapped - count : wrapped;
```

`turn(±1)` is `target += step` and a spring on `rotation` — nothing else. The
slot is continuous, so every member slides together, and looping is not a case at
all: it falls out of the wrap.

Where a slot *stands* is what makes the wrap invisible. `positionOf` is a shallow
arc across the front that peels away past a slot distance of ~1.4 and runs back
to a **single point** `fogDepth` behind the ring. Both ends of the ring meet at
that point, so the position function is continuous across the wrap, and the point
is deep enough that the `FogExp2` haze has closed over it. Past `hideBeyond` the
member is not drawn at all.

**Consequences.** There is no carousel state beyond one integer target and one
spring; the scene can be scrubbed, turned mid-entrance, or turned three times in
a row and the arrangement is always a pure function of that number. Adding a
sixth work is one entry in `carousel.members` — the ring re-spaces itself. The
cost is that the layout is now a formula rather than five hand-placed offsets:
`spread`, `bulge`, `fogDepth` and `scale` are the only handles, and a set can no
longer be nudged individually. The `entrance` from the fog still is per-member
(`fromOffset`, `delay`, `arc`), because that is a one-time flight and not a place
on the ring.

---

## ADR-0025 — The dust is drawn outside the composer, in a scene of its own

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** The dust cloud went through the post chain with everything else, and
came out wrong: every mote out of focus rendered as a **rosette of dots** rather
than a defocus disc. That is `BokehPass`'s sampling pattern becoming legible —
it blurs on three concentric rings with a handful of samples each, which is
invisible on continuous-toned geometry and unmistakable on a bright dot two
pixels wide. Reported as *"the dust looks very strange because of the focus"*,
with screenshots.

**Decision.** `TvDust` owns a private `Scene` holding only its `Points`, and
renders itself straight to the canvas after `composer.render()`, with
`autoClear` off. A camera layer masked out of the composer would work too, but
the extra render would still walk the room's whole graph to draw one object.

**Consequences.** Motes keep the hard rim their own shader draws, at any focus
distance, and the pass costs one draw call — measured at no change in frame time
(16.66 ms average, p95 17.1 across a full scroll). Three things follow from the
cloud being outside the chain, and all three are handled in `tv-dust.ts`:

1. **No depth — solved by reading someone else's.** The canvas depth buffer holds
   the composer's fullscreen quad, not the room, so a mote behind a television
   drew over it. That is not invisible, which is what the first version assumed:
   the cloud sat on the figure's silhouette and read as grain on the lens rather
   than dust in the air, and it was reported as such. **`BokehPass` already
   renders the scene's depth** for its own blur, so the dust shader samples it
   (`tDepth` off the pass's public uniforms, unpacked with three's `packing`
   chunk) and fades a mote out as it sinks behind whatever is in front of it.
   Faded, not clipped, or the boundary is a hard edge that flickers. Free: the
   depth pass was already being paid for. The **mobile tier builds no bokeh
   pass**, so there is no depth texture there and the shader compiles without the
   test — `USE_SCENE_DEPTH` is a define, because an unbound sampler is undefined
   behaviour rather than a no-op.
2. **`depthTest` must be off.** Left on, the cloud tested against that same
   canvas buffer and vanished entirely — the first symptom after the move, and
   not an obvious one.
3. **No fog.** The cloud fades itself out past ~13 units instead, or undimmed
   specks at the far wall read as a starfield behind the room.

It also misses bloom and grain, which for dust is no loss.

---

## ADR-0024 — The sky is a dome, not `scene.background`

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** The sky was a vertical gradient painted into a canvas and assigned
to `scene.background`. three renders a plain texture background in **screen
space**: its horizon sits at the same height in the frame no matter where the
camera looks or flies. Everything else in the shot moves and the horizon does
not, which reads — and was reported — as *"the horizon seems to shift; make the
fog stay in one place instead of following the camera"*.

The obvious fix, `EquirectangularReflectionMapping` on the same texture, does fix
the direction and introduces a worse bug: three sends an equirect background
through `PMREMGenerator` and **caches the result against the texture object**.
Repainting the canvas then changes nothing — the scroll's colour drift silently
stopped working — and handing over a fresh texture per step, which is what the
drift did before, pays for a PMREM conversion per step. Both were measured: the
sky stayed blue to the end of the scroll, and the scroll's p95 frame time went
from 17.3 ms to 22.5.

**Decision.** `lib/scene/tv-sky.ts`: a back-side sphere carrying a `ShaderMaterial`
that mixes two colour uniforms by the **latitude** of the view direction. It
follows the camera's position every frame and ignores its rotation, so the sky
behaves as one at infinity. `depthTest`/`depthWrite` off and `renderOrder = -1`
make it the backdrop; `toneMapped: false` matches what three does to a background
texture.

**Consequences.** The horizon belongs to the world: it turns with the lens under
pointer parallax and holds still through the scroll's flight. Recolouring is two
uniforms, so the sky's turn-over runs **every frame** instead of in 48 quantised
steps, and there is no texture upload at all — the full-scroll p95 came back to
17.1 ms, better than it was before any of this. `utils/scene/gradient-texture.ts`
is deleted. The gradient's `backgroundHorizon` still means "this far down the
frame", which the dome reproduces by laying the gradient across the band the
camera's `fov` actually covers — change the fov and the sky follows.

---

## ADR-0023 — The mobile tier is decided by the pointer, not by viewport width

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** `optimize-3d-scene` §2 defines the tier as
`innerWidth < 768 || (hover: none) and (pointer: coarse)`, and the scene followed
it. Width alone turned out to be a poor proxy: a desktop browser in a narrow
window — and in particular the preview pane inside an editor, measured at 741 px
— was handed the phone tier. That means **no depth of field, half the bloom, a
third of the dust and a 30 fps cap**, so the same build looked and ran visibly
differently in two windows on the same machine, with nothing in the UI to explain
why. It was reported as three separate bugs.

**Decision.** A coarse, hover-less pointer is mobile. A narrow viewport is mobile
only when the pointer is *not* fine:

```ts
matchMedia("(hover: none) and (pointer: coarse)").matches ||
  (innerWidth < 768 && !hasFinePointer())
```

**Consequences.** Phones and tablets are tiered exactly as before — they report a
coarse pointer. A small desktop window now keeps the full scene, which is both
what it can afford and what makes the two windows agree. The deviation is
deliberate and lives in `device.ts` with the reasoning; if the skill's formula is
ever ported back verbatim, this returns with it. Width-based tiering elsewhere in
the scene (there is none today) should follow the same rule.

---

## ADR-0022 — Scroll progress is low-passed, not sprung

- **Status:** Accepted
- **Date:** 2026-08-06

**Context.** The scene's scroll act — the camera pulling back, the television
rising into frame — needs a `0`–`1` progress value. Hard rule #1 says all motion
is spring-based, and every other moving value in the scene is a
`@react-spring/web` `SpringValue`. Scroll is the one input where that is the
wrong instrument: a spring is a follower with mass, so it lags the thumb on a
drag and overshoots at the end of a flick. On a value the user is *directly
scrubbing*, that reads as the page arguing with them, and it puts the scene out
of step with the scrollbar. `optimize-3d-scene` §10 prescribes a low-pass filter
here and gives the retention band to use.

**Decision.** Read `window.scrollY` **once per frame inside the shared render
loop** — never in a scroll handler, which would force a layout on every event —
and smooth it with `smoothed += (raw - smoothed) * k`. A jump larger than
`scroll.snapAbove` is assigned outright, so a restored scroll position or an
anchor link arrives immediately instead of crawling.

**Consequences.** Hard rule #1 now has a second, narrow exception alongside
ADR-0014's CSS transitions: **scroll-linked progress inside the WebGL scene**.
Everything the progress then drives is still ordinary interpolation, and every
motion that is *not* scroll-linked — hover, camera drift, rack focus — stays on
springs. The flight is a pure function of progress, so it scrubs in both
directions with no "already played" state. See [[scene-3d]].

---

## ADR-0021 — Development tooling is gated at the import, not at the render

- **Status:** Accepted
- **Date:** 2026-08-05

**Context.** The scene needed a slider panel for the values that are pure taste
(bloom, depth of field, fog). Tuning tools have a habit of shipping: the
`optimize-3d-scene` skill records a project that shipped `lil-gui` "hidden" —
never rendered, still downloaded, parsed and evaluated. The obvious guard,
`{process.env.NODE_ENV === "development" && <Panel />}`, does not prevent that:
the `dynamic(() => import(...))` call sits at module scope, so the chunk is still
emitted, and only the *fetch* is avoided.

**Decision.** Gate the `dynamic()` call itself:

```tsx
const Panel = process.env.NODE_ENV === "development"
  ? dynamic(() => import("./panel").then((m) => m.Panel), { ssr: false })
  : null;
```

The production build folds the flag, the `import()` becomes unreachable, and no
chunk is emitted. Verify it the same way it was verified here — grep `.next/`
for a string only the tool contains, after a real `yarn build`.

**Consequences.** Development tooling costs production nothing, and the check is
mechanical enough to repeat. The panel writes into live objects rather than
rebuilding them, so what it changes is not persisted: values found there must be
copied into `lib/scene/config.ts` by hand, which is deliberate — the config stays
the single source of what ships. See [[scene-3d]].

---

## ADR-0020 — The scene renders through a composer; the vignette does not

> [!note] Revised 2026-08-06 — the vignette moved into the pass after all
> The reasoning below holds only while the scene has **no** custom pass of its
> own: a whole `ShaderPass` and its render target, bought for a corner falloff, is
> a bad trade. That stopped being true when the CRT glass shipped
> (`lib/scene/tv-crt.ts`) — the pass exists, runs over every act, and a vignette
> inside it costs four instructions. Keeping the CSS one as well would have meant
> two stacked falloffs, only one of them adjustable. `.scene-vignette` and the
> `--scene-vignette` token are deleted; the CSS-over-pass principle stands for
> anything that does not already have a pass to ride on.

- **Status:** Accepted
- **Date:** 2026-08-05

**Context.** The scene had to match a reference still: a dark room lit only by
its televisions, with the glass blooming into the haze. Emissive materials alone
cannot do that — a bright rectangle stays a rectangle without a bloom pass — so
the frame needs post-processing. Post-processing is also the most expensive
thing in the scene, and `optimize-3d-scene` §6/§7 is explicit that a composer
owns its own render targets and will throw away the renderer's DPR clamp if left
unclamped.

**Decision.** Render through an `EffectComposer`: `RenderPass` →
`UnrealBloomPass` → `OutputPass`, with the composer's pixel ratio clamped from
the same `clampedPixelRatio()` as the renderer and the bloom's strength/radius
halved on the mobile tier. Every pass must earn its place — no vignette pass, no
colour-grade pass.

> [!note] Amended — the chain is five passes, bloom **before** the defocus
> Matching the reference took two more passes: a `BokehPass` (the figure stands a
> metre from the camera and has to read as out of focus) and a `FilmPass` after
> `OutputPass` (grain belongs in display space, not before tone mapping). The
> bokeh pass costs a second scene render for depth and is **dropped on the mobile
> tier**.
>
> It was first placed *before* the bloom, on the reasoning that the glow should
> spread from already-soft screens. That was wrong: bloom fed a defocused frame
> turns every small highlight into a blob its coarsest mips then smear, and the
> stain swims as the focal plane moves — which the hover's rack focus does
> constantly. Bloom now runs first. The rule above still holds: the vignette
> stayed in CSS.

The **vignette is CSS** instead: a `radial-gradient` pseudo-element over the
scene's section. Spill lighting is **three** `PointLight`s created at
construction, not one per television.

**Consequences.** The look is there at 16.7 ms/frame (p95 17.2) on a desktop
GPU with bloom, fog, three lamps and seven videos running. The vignette costs one
composited gradient rather than a full-screen shader every frame, at the price of
living in `globals.css` instead of the scene — so its colour and the scene's fog
colour must be changed together, which is noted in both places. Anything added to
the chain later pays a full-screen pass; check it earns it (`optimize-3d-scene`
§7), and never add or remove a light at runtime — the count is a shader define.

---

## ADR-0019 — `body` is normal block flow, not a centred flex box

- **Status:** Accepted
- **Date:** 2026-08-02

**Context.** The starter shipped `body { display: flex; flex-direction: column;
align-items: center; justify-content: center; height: 100vh; width: 100vw }` —
sensible for an empty page, fatal for a real one. `ScrollLayout` wraps children
in two plain `div`s; as flex items with `align-items: center` they shrink-to-fit,
and a page whose content is absolutely positioned (a full-bleed canvas) gives
them nothing to measure. The whole tree collapsed to **zero width** and the first
real page rendered black.

**Decision.** `body` keeps only `background`, `color`, and `min-height: 100lvh`.
Layout belongs to the view, not the document.

**Consequences.** Views own their own centring. `100vh`/`100vw` are gone —
`100lvh` avoids the mobile URL-bar resize, and dropping `width: 100vw` removes
the scrollbar-width overflow it caused. Anything that relied on the body
centring an empty page must centre itself.

---

## ADR-0018 — The 3D scene is plain three.js, not React Three Fiber

- **Status:** Accepted
- **Date:** 2026-08-02

**Context.** The home route needed a GLB scene with a pointer-driven camera. The
default reach is `@react-three/fiber` + `drei`. Installed, it produced **24
TypeScript errors inside `src/components/animation/springs/`** — a
`#do-not-modify` folder. Cause: R3F v9 augments React's JSX namespace
(`declare module 'react' { namespace JSX { interface IntrinsicElements extends
ThreeElements } }`). `@react-spring/web` types its `animated` proxy off
`IntrinsicElements`, so `animated[tag]`, indexed by the engine's `Tags` union,
widened to a union of every element — whose props intersect to `never`. The
augmentation is unconditional and has no opt-out; the only fixes were editing the
vendored engine or dropping R3F.

**Decision.** Write the scene as a plain three.js class
(`src/lib/scene/tv-scene.ts`) with a thin React leaf owning only its lifetime.
`three` is the sole new runtime dependency; `@react-three/fiber`, `drei` and
`@react-spring/three` were removed again. Camera motion still runs on
`@react-spring/web` `SpringValue`s, read once per frame — hard rule #1 holds.

**Consequences.** The vendored engine stays untouched and typechecks. Three fewer
dependencies, and the scene matches the shape the `optimize-3d-scene` skill calls
canonical (`stride`/`mycelia`-style scene classes), so its patterns port
directly. The cost is manual wiring — resize, visibility gating, disposal — which
R3F would have provided; each is written out and documented in [[scene-3d]].
Revisit only if the engine's typings stop deriving from `IntrinsicElements`.

---

## ADR-0017 — A skill states its preconditions and its own internal conflicts

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** `optimize-3d-scene` (ADR-0016) was run for the first time on a real
scene outside this repo — a raw WebGL project, no three.js, no scroll. The fix
order held up; what cost hours was everything the skill left implicit. Ranked by
time burned:

1. **§0 could not be executed at all.** `renderer.info.render` /
   `.programs.length` exist only on `THREE.WebGLRenderer`, yet the skill's own
   title says "three.js / WebGL". The agent had to invent instrumentation before
   it could take a baseline.
2. **The measurement environment was never stated**, and all three failure modes
   fired: dev-mode numbers are invalid (eager chunk serving faked a §1 failure;
   Strict Mode's double-mount faked 2 listeners and a halved frame rate), a
   stale `next start` on the port served 500s that read as a code bug, and
   `waitUntil: "networkidle0"` never fires against `next start`.
3. **§1 actively breaks §3.** `dynamic(ssr: false)` means the scene cannot
   compile until after hydration; on Regular 3G + 4× CPU programs linked at
   5.0 s against a loader that lifted at 2.36 s. Two correct steps, silently
   contradicting each other.
4. **§3's stall list was GPU-only** — all four causes shader/texture/target —
   but the worst stall measured was a 3.9 s main-thread CPU decode. Workers
   appeared nowhere in the skill.

Plus four smaller ones: the `as="fetch"` preload credentials trap (only
`use-credentials` + `include` dedupes; the other pairings silently
double-download), §5's `1000/30` actually measuring ~26 fps because of how the
ticker throttles, §7's "cut the sparse end" having no lever on a *baked* point
buffer, and §13's `lvh` being read as applying to the layout when it is for the
canvas only.

**Decision.** Fold all of it back into the skill, and adopt two rules for how
this and every future skill is written:

- **A step states its preconditions.** §0 now ships a `getContext` hook that
  gives a raw WebGL scene the counted equivalents of `renderer.info`
  (`draws` / `verts` / `links[]` timestamps / captured `attrs`), and a
  *measurement environment* block: production build, kill the old server first,
  `waitUntil: "load"`, and — because SwiftShader is not a GPU — only counted
  quantities transfer, never absolute fps.
- **A step names where it fights another step.** §3 now carries the §1 conflict
  explicitly, with the measurement that exposes it (link timestamps vs handoff
  time) and the fix (preload the data from the HTML; gate the loader on
  scene-ready, not on a duration).

Also added: §3 gains a fifth stall cause (CPU decode → Worker, with
transfer-in-both-directions) and the preload-credentials warning; §5 states the
~26 fps reality; §7 requires a decile ordering check before truncating a baked
buffer; §13 splits canvas `lvh` from content `dvh`; §1's poster is rejustified
(crawler screenshots and the no-WebGL fallback — *not* layout stability) with
two crops for tighter-axis framing and the `headers()` → `○`→`ƒ` prerender
trade-off named.

**Consequences.** The skill now works on a scene with no three.js in it, and its
first section can be executed instead of merely read. The cost is a longer §0 —
an agent must build instrumentation and a production build before touching
anything — which is the correct tax: every number the skill asks for later is
worthless without it. Deliberately kept unchanged, because the field run
confirmed them: the cheapest-first ordering, the canonical-file table, and
"don't invent new shapes; port these" — the `device.ts` port dropped in clean
and is most of why that run went as fast as it did.

---

## ADR-0016 — Skills are registered in the vault, not just dropped in `.claude/`

- **Status:** Accepted
- **Date:** 2026-07-24

**Context.** The first Claude Code skill for this starter —
`optimize-3d-scene` — arrived as a folder under `.claude/skills/`. A skill there
is discoverable to Claude Code *at runtime*, but it is invisible to the vault:
nothing in `obsidian/` said it existed, when to reach for it, or how it relates
to the hard rules. That contradicts ADR-0006 (the vault is the single source of
truth) and leaves the invocation decision to model judgement — exactly the kind
of thing this project pins down in writing. A performance request on a
scene-carrying project would otherwise get whatever fix order the agent invented
that day, when the skill exists precisely because the order matters (audit →
bot path → tiering → prewarm → visibility gate → budgets → fill).

**Decision.** A skill is only "installed" once it is registered:

1. The skill lives at `.claude/skills/<name>/`.
2. A vault note under `workflows/` documents what it does, its trigger
   conditions, and how it maps onto this project's primitives.
3. It is linked from [[README]]'s Map of Content and from the skills table in
   [[ai-agent-guide]].
4. If invocation should be non-optional, the routing rule goes into AGENTS.md's
   hard rules — the shim every agent reads first.
5. It is logged in [[changelog]].

For `optimize-3d-scene` this became **hard rule #11**: a performance / jank /
pre-ship request **and** a three.js or WebGL scene in the project → invoke the
skill and follow its order. The vault note [[optimize-3d-scene]] additionally
maps the skill's canonical patterns (which reference an external workspace) onto
what the starter already ships — the shared ticker (ADR-0009) for its one-rAF
rule, `isBot()` (ADR-0010) for its bot path, the Lenis store for scroll, the
in-view hooks for its render gate — so following the skill does not produce a
second copy of infrastructure that exists.

**Consequences.** Skill invocation becomes a documented rule rather than a guess,
and the routing survives model, tool and session changes because it lives in
AGENTS.md and the vault, not only in the skill's own `description`. The cost is
one extra note plus two index edits per skill — the same tax every component and
hook already pays. The starter still ships **no `three` dependency**
([[tech-stack]] unchanged); rule #11 is dormant until a project adds one. A
wrong vault path inside the skill (`obsidian/Meta/…`, plus an `open-questions.md`
this vault does not have) was corrected as part of registering it — registration
is also the moment a skill gets checked against reality.

---

## ADR-0015 — Strict three-tier design-token naming convention

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0004 made tokens the styling currency but never said what a token
should be *called*. The starter shipped two tokens (`--background`,
`--foreground`) and no grammar, so every project built from it would invent its
own — defeating the point of a shared starter, since an agent moving between
projects could not predict a token name without reading `globals.css`. Reference
taken from [Mavik Labs — *Design Tokens in Tailwind v4*](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
(three tiers: primitive → semantic → component).

**Decision.** Adopt the three-tier model with an explicit grammar, documented in
[[design-system]] and codified as AGENTS.md hard rule #4:

| Tier | Grammar | Lives in |
|------|---------|----------|
| Primitive | `--raw-<category>-<name>[-<shade>]` | `:root` |
| Semantic | `--<role>[-<variant>][-<state>]` | `:root` |
| Component | `--<tw-namespace>-<component>[-<property>]` | `@theme inline` |

- Only Tier 1 holds literals; Tier 2 names purpose, never appearance; Tier 2 is
  the themeable layer (dark mode overrides there). No tier may be skipped.
- Every `@theme inline` entry is exactly `--<namespace>-<role>: var(--<role>)`.
  `inline` is load-bearing — it inlines the `var()` into each utility so Tier 2
  overrides cascade; binding a literal freezes the value and breaks theming.
- Tier 3 stays rare by design (ADR-0012 prefers a React component).

**Two deliberate deviations from the reference article**, both verified against
`tailwindcss` v4.3.3 by compiling a probe stylesheet:
1. The article names primitives `--color-blue-500`. We prefix them `--raw-*` and
   keep them out of `@theme` — under Tailwind v4 a `--color-*` entry *generates
   utilities*, so naming primitives that way would emit a `bg-blue-500` for every
   raw value and let markup bypass the semantic tier.
2. The article lists `--duration-fast` / `--duration-normal` next to `--ease-*`.
   **There is no `--duration-*` namespace in Tailwind v4** — the probe confirmed
   `duration-fast` compiles to nothing and the variable is not even emitted from
   `@theme inline`. Durations therefore stay Tier 2 only, consumed as
   `duration-[var(--duration-fast)]`. (`--ease-*` *is* a real namespace and is used.)

Retrofit is **minimal and unopinionated**: the existing background/foreground
tokens were restructured into the tiers, and the primitives/durations/`--ease-entrance`
/`--leading-display` they imply were added. **No brand palette was invented** —
the convention is the deliverable; projects add `--raw-color-brand-*` themselves.

**Consequences.** Token names are now predictable across every project from this
starter. This **amends ADR-0004**, which said only that new values go in
`globals.css` first — they must now also follow the tier grammar. `globals.css`
grew a documented tier structure but stays bounded (ADR-0012). Existing markup is
unaffected: `bg-background` / `text-foreground` still resolve, since the Tier 2
names and `@theme` bindings kept their public names.

---

## ADR-0014 — Narrow CSS-transition exception for trivial state changes

- **Status:** Accepted
- **Date:** 2026-07-17

**Context.** ADR-0002 banned CSS transitions outright to force every motion
through the spring layer. In practice the ban's cost lands hardest where its
benefit is lowest: a nav link fading its colour on hover had to become a client
component wrapping `<Hover>` with a spring config, to animate one property that
no user will ever interrupt or perceive as physical. The rule pushed teams toward
either boilerplate or quiet rule-breaking.

**Decision.** Keep hard rule #1 for all real motion; carve out one narrow,
condition-bound exception. CSS `transition-*` is allowed **only** for simple,
discrete state changes — `hover:` / `focus-visible:` / `active:` colour, opacity,
border-colour, underline, and small decorative nudges — subject to three
conditions, all required:

1. **Token-backed timing** — `duration-[var(--duration-fast)] ease-entrance`; raw
   ms/cubic-bezier values remain banned by hard rule #4.
2. **`transition-*` only** — `@keyframes` stay banned outright. Anything long
   enough to need keyframes is long enough to deserve a spring.
3. **Utilities only** — the transition lives in `className`, never in a CSS file
   (ADR-0012).

Everything scroll-driven, revealing, layout-affecting, staggered, orchestrated,
or interruptible remains spring-based; text remains [[text-engine]]. Anything
past the allowed list is `<Hover>`.

**Consequences.** A hover colour change no longer needs a client component — the
common case gets cheaper and the spring layer keeps the cases it is actually good
at. This **amends ADR-0002**, whose "CSS transitions are banned" is now "CSS
keyframes are banned; transitions are limited to the list above". The exception is
deliberately narrow and enumerated rather than a judgement call ("simple
animations") so it cannot erode into general CSS animation. `--raw-duration-*` /
`--duration-*` / `--ease-entrance` tokens exist to serve it (ADR-0015).
[[animation-system]], [[design-system]], and [[ai-agent-guide]] updated to match.

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

- **Status:** Accepted
- **Date:** 2026-06-07

**Context.** `<Inview>` only animated when an external `trigger` ref was passed.
Without one it never revealed. Root cause: `useDynamicInView` returns its target
attachment as a **callback ref** (`setNode`) in the first tuple slot, but
`in-view.tsx` destructured it as `inViewRef` and wrote `inViewRef.current = node`
in the JSX `ref` callback — assigning `.current` to a function instead of calling
it. `setNode` never ran, the observed `node` stayed `null`, and with no `trigger`
the observer had nothing to watch (`trigger?.current ?? node` → `null`). With a
`trigger` it worked only because `trigger.current` bypassed the dead `node` path.
TypeScript flagged this at build time (`Property 'current' does not exist on type
'TargetRefCallback'`), so the build was already failing.

Separately, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width`
(`useWindowWidth()`) as a `useMemo`/`useEffect` dependency to re-evaluate mobile
gating on resize, but never passed it to `isMobileDisabled()` — so the value was
genuinely unused (ESLint `react-hooks/exhaustive-deps` warning) **and** resize
re-evaluation silently did nothing; the check always read `window.innerWidth` at
call time.

**Decision.** This is the second authorized edit to the `#do-not-modify` engine
(after ADR-0009). Two corrections:
1. In `in-view.tsx`, call the callback ref — `setInViewNode(node)` — instead of
   assigning `.current`, so the component observes itself when no `trigger` is
   given.
2. Pass the React-tracked `width` into every `isMobileDisabled(value, width)`
   call across `in-view.tsx`, `spring.tsx`, and `hover.tsx`. This is the
   documented second parameter of `isMobileDisabled` and makes the `width`
   dependency meaningful, fixing resize re-evaluation and clearing the lint
   warnings.

**Consequences.** `<Inview>` now works standalone (the common case). `yarn build`
and `yarn lint` are both clean (0 errors, 0 warnings). The springs folder remains
`#do-not-modify` by default — these were explicitly signed-off bug fixes.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** ADR-0004 made design tokens the styling currency and ruled that
"new values must be added to `globals.css` first." Combined with the
design-system guidance to *"extract repeated multi-class patterns to
`@layer components`"*, the path of least resistance for any repeated visual
pattern became a named class in `globals.css`. On an animation-heavy,
multi-section marketing site that grows the file without bound — a single
global stylesheet accumulating hundreds of component-specific classes that are
never deleted when their component is. The fix is a placement rule, not a
file-splitting trick: splitting `globals.css` into many files only spreads the
same bloat.

**Decision.** Styling follows a strict placement order; `globals.css` stays
bounded by design.

- One-off styling → **Tailwind utilities** in `className`. Nothing enters CSS.
- A repeated pattern with markup/structure/props → a **React component**
  (`components/ui/`), *not* a CSS class. This is the default answer to "this
  looks repeated" — e.g. an eyebrow label with a `::before` dot is an
  `<Eyebrow>` component, not a `.label-eyebrow` class.
- A repeated pure-utility combo with no structure → a Tailwind v4 `@utility`.
- `@layer components` is reserved **strictly** for what utilities and
  components genuinely cannot express: pseudo-elements (`::before`/`::after`),
  third-party DOM overrides (`!important` on library markup), complex
  descendant/state selectors.
- `globals.css` only ever holds: `@import`, tokens (`:root` + `@theme`), base
  element resets (`@layer base`), and the narrow `@layer components`
  exceptions above. If it grows past that, something was misplaced.
- CSS Modules were considered and **rejected** — a second styling mechanism
  for the rare bespoke-CSS case is not worth the extra mental model when
  motion is spring-based (no keyframes — ADR-0002) and utilities + components
  cover everything else.

**Consequences.** `globals.css` stays a few-hundred-line file indefinitely.
"Repeated thing" pressure now pushes toward React components — which the
project wants anyway. This **amends ADR-0004**: design *tokens* still go in
`globals.css` first, but component-specific *classes* no longer do.
[[design-system]] and [[component-conventions]] updated to match.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

- **Status:** Accepted
- **Date:** 2026-05-22

**Context.** The starter had no API layer. It needs a convention for reaching
external services that keeps secret keys off the client and gives endpoints a
consistent shape.

**Decision.** External calls go through Next.js Route Handlers —
`src/app/api/<resource>/route.ts`:
- **The handler owns the work** — business logic, multiple upstream calls,
  filtering, and reading secret env vars all live in `route.ts`. No mandatory
  passthrough service layer; extract shared code only when genuinely reused.
- Secrets are safe in handlers because `route.ts` is never bundled to the
  browser. Secret env vars are **unprefixed**; `NEXT_PUBLIC_` only for
  browser-safe values.
- Every endpoint: validates input with `zod`, returns the `{ data }` /
  `{ error }` envelope via the shared `handle()` wrapper (`src/lib/api/`), runs
  on the Node runtime (not Edge).
- `src/env.ts` validates env with zod — `publicEnv` vs `getServerEnv()`.
- Client Components fetch via `apiFetch` (`src/lib/api-client.ts`), same-origin
  only. Render-time data is read in Server Components.
- Added `zod`. The example endpoint is `app/api/contact/route.ts`.
- Codified as **AGENTS.md hard rule #9**.

**Consequences.** A clear, secret-safe API convention (full note:
[[api-architecture]]). Server Actions were considered for mutations but
deferred — for now everything goes through `app/api`. The choice can be
revisited if forms need progressive enhancement. First server dependency
(`zod`) and first server-only env var (`CONTACT_ENDPOINT`) now exist.

---

## ADR-0010 — SEO & performance hardening

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A review found gaps that would hurt a production marketing site:
`metadataBase` defaulted to `null` (relative OG/canonical URLs never resolved to
absolute — broken social previews); `themeColor` sat on the deprecated metadata
field; there was no `robots.txt`, `sitemap.xml`, or structured data; the
`next.config.ts` was empty; `ScrollLayout` leaked a `requestAnimationFrame`
loop; the home view was a top-level `"use client"` (violating hard rule #6);
and the animation-heavy starter ignored `prefers-reduced-motion`.

**Decision.**
- **Site config.** `src/lib/site.ts` (`siteConfig`) is the single source of
  truth for SEO, fed by `NEXT_PUBLIC_SITE_URL` (fallback `http://localhost:3000`).
- **Metadata.** `metadataBase` is always set; `themeColor` moved to a
  `generateViewport()` / `viewport` export; dead `keywords` / `other` tags
  dropped; OG dimensions corrected to match the asset.
- **Crawlability.** Added `app/robots.ts`, `app/sitemap.ts`, and a JSON-LD
  `Organization`+`WebSite` helper rendered once in the root layout.
- **App Router files.** Added `loading.tsx` (enables streaming), `error.tsx`,
  `not-found.tsx`.
- **Rendering.** `HomeView` is a Server Component; client-only animation moved
  to the `HomeShowcase` leaf — models hard rule #6 instead of breaking it.
- **Reduced motion.** `<ReducedMotion>` calls react-spring's `useReducedMotion`,
  toggling the global `skipAnimation` — one app-root mount covers every spring
  and `spring-text-engine`. Chosen over per-component handling for its reach.
- **Build config.** `next.config.ts` now sets `removeConsole` (prod),
  AVIF/WebP, `next/image` breakpoints aligned to the adaptive-grid widths, and
  `poweredByHeader: false`. React Compiler is left as a documented opt-in (needs
  `babel-plugin-react-compiler`).
- Fixed the `ScrollLayout` Lenis rAF leak (cancel on unmount).

**Consequences.** Social/SEO metadata is correct in production once
`NEXT_PUBLIC_SITE_URL` is set. The first project env var now exists (see
[[environment-variables]]). `isBot()` stays available but is discouraged — it
opts routes out of static rendering; reduced-motion is the preferred lever (see
[[seo-metadata]]). React Compiler remains opt-in pending a dependency install.

---

## ADR-0009 — Shared animation ticker; authorized engine performance refactor

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** A performance review of the animation engine found load issues that
scale with the number of animated components on a page:
- `useLoop` started a **private `requestAnimationFrame` loop per hook instance** —
  N scroll-driven components meant N rAF loops, none of which ever stopped.
- `useWindowWidth` attached a **separate debounced `resize` listener per call** —
  one per spring component.
- `useDynamicInView` re-created its `IntersectionObserver` **on every render**
  (effect keyed on an unstable `options` object), and a dead `Proxy` branch
  created observers that were never disconnected.
- `useLoop`'s mount-only effect captured a **stale `onRender`**, so prop changes
  after mount were ignored.
All of this lives under `src/hooks/animation/` and `src/components/animation/springs/`
— `#do-not-modify` (ADR-0002).

**Decision.** With explicit user sign-off, apply a one-time performance refactor
to the protected engine, and introduce a shared, unprotected loop primitive:
- New `src/lib/animation/ticker.ts` — a single app-wide, reference-counted rAF
  loop (`subscribeToTicker`). It starts on the first subscriber, stops on the
  last, and throttles each subscriber independently. **Not** `#do-not-modify` —
  it is the supported extension point.
- `useLoop` now subscribes to the ticker and reads `onRender` / `framerate`
  through refs (fixes the stale-closure bug). Public signature unchanged.
- `useDynamicInView` rewritten without the `Proxy`: one observer, re-created only
  when the observed element or options actually change; exposes a callback ref.
- `use-window-size.ts` (not protected) now serves all three hooks from one
  debounced `resize` listener via `useSyncExternalStore`. The unused
  `debounceDelay` parameter was dropped.
- `mode="forward"` `scroll` listeners in `<Spring>` / `<Inview>` made `passive`.
- Hard rule #2 amended: the engine stays protected by default; changes require
  explicit sign-off.

**Consequences.** A page with N animated components now runs **one** rAF loop and
**one** resize listener instead of N of each, with no observer churn. Public
hook/component APIs are unchanged except `useWindowWidth`/`Height`/`Size`, which
no longer take a `debounceDelay` argument (no caller passed one). This **amends
ADR-0002's** do-not-modify scope.

A follow-up pass then cleared all 13 pre-existing ESLint problems in the engine
(also authorized): `isMobileDisabled` gained an optional `viewportWidth`
argument, missing `disableOnMobile` effect deps were added, a
`trigger.current`-in-cleanup hazard in `<Hover>` was fixed, `<Handle>`'s
transition effects were ref-stabilised, and `useProgressTrigger` now returns
`progress` as a `RefObject<number>` (no consumer affected).

---

## ADR-0008 — Adaptive scaling grid via root font-size

- **Status:** Accepted — amended by ADR-0035 (the two lower ranges are clamped,
  and scaling is no longer expected to cover shape)
- **Date:** 2026-05-21

**Context.** An adaptive scaling system was dropped into `src/components/common/`
to keep a rem-based design proportional across viewports. It shipped as a
`styled-components` implementation (`createGlobalStyle`, a `css` `media` helper,
`rm`/`em` helpers, plus `colors.ts` / `fonts.ts` / `utils.ts`). `styled-components`
is not a project dependency, and global CSS belongs in `globals.css` per ADR-0004.

**Decision.** Keep only the scaling behaviour; rebuild it to the project stack.
- **Scale down** (viewport ≤ largest breakpoint) — `vw`-based `html { font-size }`
  media queries in `globals.css`, inside `@layer base`.
- **Scale up** (viewport > largest breakpoint) — a `<AdaptiveGrid>` client
  component (`useAdaptiveGrid` hook) sets an inline `html` font-size at runtime,
  reusing the existing `useResizeLoop` render loop.
- Breakpoints live in `grid.config.ts` as typed config; the `globals.css` media
  queries mirror them and must be kept in sync (formula in both files).
- The dropped `styled-components` files were deleted, not committed.

**Consequences.** A rem-based layout now scales as one unit on every viewport.
`styled-components` stays out of the dependency tree. The breakpoint set is
duplicated across `grid.config.ts` and `globals.css` by design — the CSS-only
config rule (ADR-0004) forbids generating the media queries from JS.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** The "read the vault first, follow the relevant guide, update the docs
after every change" workflow depended on the user reminding the agent each time.
Documentation drifts the moment it relies on memory.

**Decision.** Encode the workflow as Claude Code hooks in `.claude/settings.json`
(committed, team-wide):
- `SessionStart` — injects a pointer to read the vault first.
- `UserPromptSubmit` — on every request, reminds the agent to consult the relevant
  guide and to update docs for any change made.
- `Stop` — at the end of every turn, blocks **once** to confirm the vault was
  updated. A `${TMPDIR}` marker keyed by session id guarantees it blocks at most
  once per turn (no infinite loop).

**Consequences.** The documentation workflow is enforced without user prompting.
`.claude/settings.json` is now a tracked project file. Hooks are reviewable and
disableable via `/hooks`. New hooks take effect on the next session start (or after
opening `/hooks`). See [[ai-agent-guide]].

---

## ADR-0006 — The vault is the single source of truth

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** ADR-0001 left dense spec files (`project-specs.md`, `text-engine-docs.md`)
at the repo root alongside the vault, creating duplication — the same conventions
existed both as terse specs and as expanded vault notes, which would drift.

**Decision.** The vault is the **only** documentation source.
- `project-specs.md` — deleted; its content was already decomposed into the
  `architecture/` and `frontend/` notes (and `environment-variables.md`).
- `text-engine-docs.md` — moved into the vault as [[text-engine-reference]].
- `generic-layout-prompt.md` — moved into the vault (see ADR via [[changelog]]).
- Root keeps only thin shims: `AGENTS.md` carries the breaking-change warning and
  hard rules and points into the vault; `CLAUDE.md` and `.cursorrules` both
  `@`-import `AGENTS.md`.

**Consequences.** No documentation duplication. Agents bootstrap from `AGENTS.md`
and read vault notes on demand. This **amends ADR-0001** — root files no longer
hold canonical spec content.

---

## ADR-0005 — Use standard `next/link` for navigation

- **Status:** Accepted
- **Date:** 2026-05-21

**Context.** Two conflicting conventions existed: `project-specs.md` specified
standard `next/link` / `useRouter`, while `generic-layout-prompt.md` specified
custom `<AnimLink>` / `useAnimRouter()` wrappers. The custom wrappers were never
built.

**Decision.** Use standard Next.js navigation — `<Link>` from `next/link` and
`useRouter` from `next/navigation`. The `AnimLink` / `useAnimRouter` convention is
dropped. See [[routing]].

**Consequences.** `generic-layout-prompt.md` §5 updated to match. No animated-route-
transition layer exists; if one is needed later, revisit with a new ADR.

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

- **Status:** Accepted — amended by ADR-0006
- **Date:** 2026-05-21

**Context.** Project knowledge was scattered across root markdown files
(`project-specs.md`, `text-engine-docs.md`, `AGENTS.md`). New contributors and AI
agents had no structured map of the system.

**Decision.** Introduce `obsidian/` as an Obsidian vault — a linked, navigable
second brain. Root spec files remain as machine-read sources; the vault expands on
them. See [[ai-agent-guide]].

**Consequences.** Docs must now be maintained alongside code. The vault is the
canonical place to *understand* the project; root files stay canonical for *tooling*.

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

- **Status:** Accepted (inherited from starter) — amended by ADR-0014
- **Date:** Project baseline

**Context.** Marketing sites need rich, interruptible, physically natural motion.
CSS transitions and keyframes are rigid; competing libraries add weight.

**Decision.** Use `@react-spring/web` for every animation. A custom component layer
(`src/components/animation/springs/`) wraps it. CSS keyframes and `framer-motion`
are **banned**. CSS transitions were banned outright here; **ADR-0014 narrows that
to allow `transition-*` for trivial hover/focus state changes only.**

**Consequences.** All animation goes through the [[animation-system]]. The springs
folder is `#do-not-modify`. Text animation is delegated to [[text-engine]].

---

## ADR-0003 — Routes delegate to Views

- **Status:** Accepted (inherited from starter)
- **Date:** Project baseline

**Context.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**Decision.** `app/**/page.tsx` files only import and render a component from
`src/views/`. All layout/UI logic lives in the view. See [[routing]].

**Consequences.** Every route is a 3-line file. Views are the real page components.

---

## ADR-0004 — Tailwind v4 with CSS-based config

- **Status:** Accepted (inherited from starter) — amended by ADR-0012 and ADR-0015
- **Date:** Project baseline

**Context.** Tailwind v4 removes `tailwind.config.js` in favour of CSS-native config.

**Decision.** All theme tokens live in `globals.css` under `:root` and `@theme inline`.
No JS config file. Raw values in class names are banned. See [[design-system]].

**Consequences.** Design tokens are the only styling currency. New values must be
added to `globals.css` first — and, per ADR-0015, must follow the three-tier
naming convention.
