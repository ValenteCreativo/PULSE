---
tags: [meta, changelog]
updated: 2026-10-05
---

# Changelog

Chronological log of notable changes to the project. Newest first.
This is a human-curated log — not a mirror of `git log`.

## 2026-10-06 — owner review (D-033): brand kit + full meta (optimize/pass-2)

The owner: "generate favicon and opengraph and all required meta". Nothing else
on the site changed.

- **Mark** `src/assets/brand/mark.svg`: the nav pill's own home glyphs "< >"
  (Chakra Petch SemiBold, outlined) in the nav accent mint `#dbfffe` on black.
  The page carries no wordmark, so the home link's glyphs are the logo.
- **`optimization-pipeline/tools/scaffold-brand.mjs`**: `public/icon.svg`,
  `favicon.ico` (16/32/48; the starter's `src/app/favicon.ico` deleted so
  `icon.svg` leads), 16/32 PNGs, apple 180, android 36–192, `icon-512`,
  `icon-maskable-512`, `manifest.json` ("Codescan", black, description),
  `open-graph.jpg` (1200×630 capture of the hero at rest: headline, TV room,
  intro, CTAs, HUD). `public/open-graph.png` (900×600 starter card) removed.
- **Meta**: title "Codescan — Identity, art direction and web studio" (was the
  headline); description from the hero intro + About lead; 6 keywords;
  `ogImageSize` 1200×630 + `ogImageAlt` (OG and Twitter); `icon.svg` first;
  `twitterHandle` unset (the invented `@codescan` tags are gone); JSON-LD
  Organization logo → `/icon-512.png` (512×512). `frontend/seo-metadata.md`
  updated (the 900×600 `#todo` is closed).
- Checks: tsc, lint, build clean; verify.sh 0 FAIL; Lighthouse local ×1 mobile
  92/100/100/100 (a first run under load ~27 read 74, TBT 1 s), desktop
  99/100/100/100. The bot UA gets the same head.

## 2026-10-05 — D-031 scroll round: the room drawn at most 60 times a second on desktop

- **`frameBudget()` desktop 0 → `1000/60 − 1` ms** (`lib/scene/device.ts`). On a
  120Hz panel the room drew on every tick — two scene renders (the bokeh's depth
  pass), bloom, a 41-tap bokeh, grain and the CRT pass, twice per 60Hz frame —
  and the scroll test's desktop pass dropped 3–7 % of its frames in the room
  with the main thread idle. A 60Hz display keeps every tick (a millisecond of
  slack under the frame); a 120Hz one shows the room at 60fps. All motion is
  time-based (`smoothScrollProgress`, the mixer's delta), so nothing moves at a
  different speed. Local interleaved A/B (desktop, 3 runs per arm, shared
  machine): branch 0.86 / 1.29 % cold vs `origin/main` 4.0 / 3.8 % in the same
  round (ideal / smooth vs janky). Lighthouse unchanged: desktop 98–99,
  mobile 88–90 on both builds (local), A11y/BP/SEO 100, robot 100 / 98.
  Frames are the same frames — only fewer of them on a >60Hz panel.
- Tried and reverted: the fragment budget 3.2M → 2.0M (desktop ~1.24×) — no
  measurable change; the frame is not fill-bound at 1440×900.
- Mobile unchanged (30fps budget already). Its residual — a 50–90 ms cold
  `render` frame where the first panel arrives (y ≈ 2 750), on both builds —
  did not reproduce under a trace; lead: the parked `invisible` panels are
  rasterised on their first visible frame.
- **Pre-raster the dissolving panel's words** (`common/panels/panel-stack.tsx`):
  the team panel enters on the pixel wave and its words fade on `opacity`
  from 0 — a layer at 0 is not painted, so the fourteen ring cards were
  painted and rasterised in the frame the fade left zero. Trace at y≈2 732 on
  the phone profile: a 43 ms frame that was all GPU raster
  (`DoEndRasterCHROMIUM` 15–17 ms, main thread idle); the scroll test's
  50–90 ms cold `render` frame sits there. `will-change: opacity` on the
  content of pixel panels keeps it painted while still clear. Injected as CSS
  first (interleaved, 3 runs each): 2.48 / 0.83 / 1.96 % → 1.76 / 0.69 / 0.44 %
  dropped, max 66 → 33–68 ms. The team carousel's `--rot` was not the cause —
  it is already written only on change and only while the ring turns.

## 2026-10-03 — Mobile 90 pass (D-028): the room built a piece per task

Measured locally with the pipeline's Lighthouse profiles, A/B back to back
against two production builds (6 mobile runs each). The phone's TBT was the
room's set-up, not its frames: one ~200 ms mount task (the PMREM bake, the
composer, the dust and the signs in the scene's constructor), a ~190 ms frame
that linked every program again, and the curtain-time frames compiling as they
drew.

- **`Scene` builds itself a piece per task** (`build()` in
  `lib/scene/tv-scene.ts`, `nextTask()` = a `MessageChannel` hop): the model's
  download starts first, then the environment, composer, dust and signs each
  in their own task, one frame of the empty room (the composer's passes, the sky
  and the dust link there), then the model's set-up — clips/floor/figure,
  screens, carousel — compile, each model texture uploaded on its own
  (`texturesOf`), the warm-up frame, the dust's warm-up and the first frame.
  `markSceneReady` still waits for all of it, so the curtain lifts on the same
  finished room.
- **The model's programs are linked against the composer's own target**
  (`compileAsync` with `composer.renderTarget1` bound): the room is drawn into
  that target, whose program variants differ from the canvas's, so the warm-up
  frame used to relink everything (190 → ~70 ms at 4× CPU).
- **The PMREM bake links the room's programs first** (`compileAsync` against a
  half-float target, the bake's variant), then bakes in the next task
  (~130 → ~70–90 ms).
- **No frames under the curtain**: the loop starts when the curtain starts to
  lift (`setCurtained`, wired from `onIntroDone` in `tv-scene.tsx`); the room
  is still drawn once by its warm-up, and the screens keep playing under it, so
  they are live the moment it is uncovered.
- `experimental.inlineCss` (fleet rule): the stylesheet in the HTML, not a
  render-blocking request ahead of the banner's paint.
- **`zod` out of the client bundle**: the consent banner's `PrivacyPolicyLink`
  read `siteConfig`, whose module reads the validated env — so the env schema
  and `zod` shipped to every browser (a 314 KB chunk). The URL now lives in
  `lib/legal.ts` (`PRIVACY_POLICY_URL`, still `null`), re-exported by
  `siteConfig`. `grep -l ZodError .next/static/chunks/*.js` is empty. Mobile
  A/B 80/92/88/87/88/91 → 89/87/89/92/88/90 (steadier LCP, 2.0–2.9 s).
- `utils/math.ts` typed (`never[]` / `unknown` instead of `any`) — the
  `verify.sh` FAIL the author left; no behaviour change.
- `src/app/loading.tsx` (empty) deleted — crawlers no longer get the page in a
  `<div hidden>`.

At 4× CPU the load's blocking time (Σ long-task − 50 ms) went ~380 → ~110 ms;
no task over ~90 ms. Lighthouse mobile, A/B: 81/79/79/81/78/79 → 88/92/83/85/83/91
(TBT 430–545 → 254–342 ms). Recorded (local, 3 runs): mobile **88** (88/88/92)
/ 100 / 100 / 100, TBT 247–350 ms, LCP 2.3–2.8 s; desktop **99** / 100 / 100 /
100; robot form 100 ×4 desktop, mobile 97 / 100 / 100 / 100. Scroll mobile
ideal; desktop noisy on a shared machine, the old build alike (p99 17–32 ms in
both).

Also seen: in a headless Chrome on Metal the old build never showed the room
(lifted at the curtain's 6 s patience onto an empty sky — its frames compiling
while `compileAsync` was pending); this build shows it at ~2 s.

## 2026-08-10 (later)

- **Nothing on the page links to a page that isn't there.** The site has one
  route and was shipping links to five: `/contact` from the nav pill *and* the
  hero's primary button, `/work`, `/work/<slug>` for every case in the ring, and
  `/privacy-policy` from both consent surfaces. `href` is optional now, and each
  of those renders as a `<span>` / plain text without one — same shape, **no
  hover**, no pointer, no tab stop, because the hover is the promise. Fill the
  `href` back in (`data/mocks/home.ts`, or `siteConfig.privacyPolicyUrl`) when
  the route exists and it becomes a link again on its own. Walked with a headless
  browser, the only anchor left on the page is `/`. See [[decisions-log]]
  ADR-0037.
  - `/api/contact` stays: it is not a page, nothing links to it, and it is the
    worked example [[api-architecture]] documents.

## 2026-08-10

- **The last shot is built on one fixed television**, not on whichever case the
  ring was left turned to. The members are clones of *different* televisions, and
  everything in the shot is measured against that glass — so switching cases in
  the portfolio changed the closing shot: the picture cropped on the widescreen
  set, the television changed size, the figure landed somewhere else in the
  frame. One set now, always the same one. [[decisions-log]] ADR-0035. The set
  the shot is staged on is also exempt from the ring's own culling: `slot` is
  measured from the case the ring was turned to, so a few turns put the closing
  television past `hideBeyond` and the shot lost both it and the figure, who is a
  silhouette and needs its glass to read against.

- **The figure in the last shot holds still.** Four things were moving him: his
  placement was anchored to the lens's *live* position, and the lens pulls back
  for the whole act — so where he stood was a function of the scroll and he
  landed somewhere different every time the shot was entered; his own track had
  two different ends and a 5-radian turn between them; the pointer parallax
  swung the frame; and his animation clip was still playing a metre from the
  lens. Anchored to where the lens ends up, both track ends equal, and the clip
  stops while the shot is staged.

- **The page is responsive.** Two things were wrong and only one of them was
  layout. The scaling ladder's lower ranges were **unclamped**, so the root
  font-size hit 10px at 641px wide (the whole page at 62%, body copy at ten
  pixels) and **28px** at 640px — a 360px design at 1.8×, with a nav pill wider
  than the window. Both are clamped now: a 12px floor on the tablet range, an
  18px ceiling on the phone one, at thresholds that line up exactly with
  Tailwind's `sm:` and `lg:`. Everything else reflows at those three regimes.
  See [[decisions-log]] ADR-0035 and [[design-system]] → "The ladder".
  - The hero's **535px and 411px measures become margins** under `sm` — centred
    blocks wider than the window were running off *both* edges — and its column
    stands 72px off the foot so the buttons stop landing on the frame's clock.
  - *Previous* and *Next* **crossed over** on a phone: 240px in from each edge is
    past the middle of a 390px window. Under `lg` they pair up under the set.
  - The **studio panel is a flex column**, not four placed boxes. Same numbers,
    but it can stack its three cards on a phone and stop leaving a third of a 3:4
    tablet as a black band down the middle.
  - The **card ring's share of the window is per-regime** (0.17 / 0.30 / 0.52) —
    it was falling back to its 150px floor on every phone.
  - The frame tightens to 12/36/24 on a phone and drops `60 fps` / `REC`, which
    had nowhere to go but over the nav pill; the pill itself is the same pill at
    79%; the preloader's bar closes its gap so 64 cells still fit.
  - The closing rule's left edge is **measured** rather than the design's 60px,
    and the hover chip renders nothing on a device with no cursor.
- **The site has an identity.** `siteConfig` was still the starter's *New
  Project* / `@newproject` / `localhost`; it is Codescan now, and everything
  downstream — title template, OG and Twitter cards, canonical, `manifest.json`,
  the JSON-LD graph, the Windows tile — is generated from it. A `WebPage` node
  joins the `Organization` + `WebSite` pair, the OG image declares its real
  900×600, and `browserconfig.xml` stops pointing at three icons that were never
  in `public/`. ADR-0036, [[seo-metadata]].

## 2026-08-10

- **The last shot is built on one fixed television**, not on whichever case the
  ring was left turned to. The members are clones of *different* televisions, and
  everything in the shot is measured against that glass — so switching cases in
  the portfolio changed the closing shot: the picture cropped on the widescreen
  set, the television changed size, the figure landed somewhere else in the
  frame. One set now, always the same one. [[decisions-log]] ADR-0035. The set
  the shot is staged on is also exempt from the ring's own culling: `slot` is
  measured from the case the ring was turned to, so a few turns put the closing
  television past `hideBeyond` and the shot lost both it and the figure, who is a
  silhouette and needs its glass to read against.

- **The figure in the last shot holds still.** Four things were moving him: his
  placement was anchored to the lens's *live* position, and the lens pulls back
  for the whole act — so where he stood was a function of the scroll and he
  landed somewhere different every time the shot was entered; his own track had
  two different ends and a 5-radian turn between them; the pointer parallax
  swung the frame; and his animation clip was still playing a metre from the
  lens. Anchored to where the lens ends up, both track ends equal, and the clip
  stops while the shot is staged.

- **The closing screen read backwards after turning the ring by one.** Noise
  never showed it; a picture with words on it does. The first fix looked for a
  negative scale and did nothing — the sets that read backwards have a positive
  determinant and clean UVs — so the test is now on the **image**: project three
  of the screen's vertices and compare the triangle's winding in NDC with its
  winding in UV space. Disagree, and the still is hung mirrored back.
- **The figure in the last shot holds his place at any window shape.** His
  sideways offset is derived from the design's lens rather than authored in
  world units — he was off frame on a laptop and gone on a phone — with a bias
  that walks him to the edge on portrait windows rather than standing him in
  front of the television. His depth is set by his **own bounding box**: he
  stood a metre from the lens with the front of that box behind its near plane,
  which is what made him a black smear over the frame; he is now far enough back
  that the box clears it and near enough to still read as close. The act's
  pointer parallax dropped from a quarter of the scene's to a seventh, which is
  what "he keeps sliding left" was.

## 2026-08-09 (later)

- **The scrollbar is hidden.** One shot eight screens tall has no use for a ruler
  down its right edge, and the gutter it took back is now canvas.

- **The hero starts with the curtain, not after it.** The sheet clips from the
  bottom up, so the headline is the last thing uncovered; waiting for the lift to
  finish meant its letters only began resolving once they were already in view.
- **Three times the air between the team block and the studio's.** The panels are
  laid a window **plus 294px** apart rather than tiling exactly — 147px of
  facing margins became 441. The finale's black shows through the gap.
- **The tuning panel is hidden**, even in development. `?tune` brings it back.

- **A curtain over the first paint.** The site's mint, the count top-left, a bar
  of rounded cells across the foot; it waits for the room to report loaded,
  compiled and drawn, then is clipped away from the bottom up — and *that* is
  what starts the hero, which used to spend its headline animation behind a black
  canvas. See [[decisions-log]] ADR-0034.
- **Nothing the scroll drives eases any more.** Every act — the flight, the
  entrance, the finale, the epilogue, the panels, the hero's copy — maps its
  window linearly, and the windows were widened to carry the softness the easing
  used to fake. The flight no longer comes to a full stop in the middle of
  itself. ADR-0033.
- **The last shot got its words**: *Have an Idea? / Lets collaborate!* on the
  design's 60px margin (Figma `1463:1054`), with a hairline ruled under them that
  **stops where the television starts**. There is no z-order that puts DOM behind
  an opaque canvas, so the scene measures the set's real outline at the rule's
  own height — by casting rays at it, because a projected bounding box turns
  inside out when a corner falls behind the near plane — and the rule fades out
  over its last stretch to swallow the difference between the geometry and the
  CRT pass's curvature.
- **Hovering that television opens it toward the lens** and lifts its picture,
  both on a spring.
- **The card ring's edges fade instead of switching off**, across the last third
  of a card's travel, and the card at the front now stands inside a **static**
  mint frame that belongs to the stage rather than to the ring.

## 2026-08-09

- **The scroll is one clock now.** Lenis was running its own rAF loop while
  everything reading the scroll ran on the shared ticker, and only the scene
  low-passed the number it got — so the room eased while the panels and the hero
  copy stepped. `lenis.raf` is the ticker's first subscriber, one filter
  (`smoothScrollProgress`) serves the whole page, and Lenis itself is on a softer
  `lerp` (0.085) with a shorter wheel step. See [[decisions-log]] ADR-0032.
- **The hero's headline leaves the way it arrived.** It came in on nothing but
  its letters and left on its letters *plus* a container blur, which is two
  different animations for one heading. The blur and the fade belong to the
  bottom column; the `h1`'s only exit is the scatter.
- **Three times the room between the team and the studio.** The page is
  `840lvh` (was 700) and every window in `lib/scene/config.ts` was rescaled so each
  act keeps the page distance it had — all of the new height went to the
  hand-over between the two black panels. *Built to hold attention.* also clears
  the wall earlier.
- **The chip has two tones.** Over a case it is the accent with *Explore →* after
  the divider; over a noise set it is black with the accent on the type and **no
  arrow**, because there is nothing to explore there. The scene names what the
  pointer found and how much of an offer it is (`TvHoverHint`); what that looks
  like is the page's call. Both chips are also gated on the act they belong to —
  the pick only runs on pointer movement, so one put up over the wall and
  scrolled away from used to stay on the cursor for the rest of the page.
- **The ring says it can be dragged.** Hovering the team carousel puts *Drag to
  explore* on the cursor — the same chip, a second source for it.
- **The closing shot is a call to action.** `/assets/CTA/CTA-TV.png` is hung on
  the set the lens pulls back from, swapped in **under the black** while the
  epilogue is being staged, at an eighth of the wall's glow (a near-white still
  at the wall's setting is a white rectangle with the bloom eating the words).
  Hovering it says *Something is on next*.
- **The team is the team.** Eight photographs, and names and roles written to the
  faces rather than to a list.
- **The studio's three cards rise on a trail**, one pulling the next, and leave
  the same way.

## 2026-08-08

- **The 24 fps on a wide window was the composer**, and it is the single biggest
  fix of the project. `EffectComposer` keeps whatever pixel ratio it was
  *constructed* with, so the fragment budget added to the renderer a few days ago
  was doing nothing at all to the post chain — which is where nearly all of the
  fill is. Measured at 2560×1440, everything else identical: **42.4 ms a frame
  before, 16.65 ms after**. `optimize-3d-scene` §6 warns about exactly this.
- **The rest of the optimisation pass**, against the same skill:
  - the **bokeh is skipped** on every stretch where its blur ceiling is zero —
    a 41-tap full-screen pass that was running over most of the page for
    nothing. The dust reads the depth that pass renders, so its occlusion is now
    a **uniform** it can be told to stop trusting, rather than a define that
    would recompile mid-scroll (§7).
  - **prewarm now covers what is hidden**: `compile` walks the *visible* graph
    and half this scene starts invisible, so the carousel's clones, the flight's
    lines and the dust were linking their programs somewhere in the middle of a
    scroll. Everything is shown for the compile, the dust's own scene is compiled
    too, and one throwaway frame goes through the whole chain (§3). Programs
    after the loader: 35 → 36 of a final 37, and the one that still links does so
    at a tenth of the way down — see the open question below.
  - **one cached scroll read for the page** (`lib/animation/scroll-progress.ts`).
    Three subscribers were each reading `documentElement.scrollHeight` every
    frame — a layout read, interleaved with their own style writes (§9).
- **The hover label is a chip on the cursor now**, not a plane in the room: the
  case name types itself into a pill that trails the pointer, *Coming soon…* over
  the noise sets. Every problem the 3D one had — a different apparent size on
  every television, needing axial depth to hold one size, being buried behind
  whatever stood in front of it — was a consequence of it being in the room.
- **A full-width `fixed` nav was eating clicks.** The header bar spans the top of
  the window and had no `pointer-events-none`, so nothing along that strip could
  be clicked — the dev panel's button included.
- **The sky's gradient is smoothstepped**, which removes the hard blue band where
  the floor's far edge is supposed to disappear: a linear ramp meets its own flat
  bottom at an angle, and that kink is a line across the frame.
- **Three on the reveals:** heading exits are the entrance **inverted** (the
  letter that resolved first is the last to go); the black panels' headings start
  resolving while the panel is still arriving rather than once it has landed; and
  the flight's lines now come up **letter by letter** on the same scattered
  timing as the headings, redrawn on a quantised reveal so it costs two dozen
  canvas repaints rather than one a frame.

> [!note] `#todo` One program still links mid-scroll
> After the prewarm the count is stable from the loader to a tenth of the way
> down, then goes up by one and stays there for the rest of the page. Rendering
> the whole chain with every object visible does not catch it, so it is a variant
> that only exists under a state the scroll reaches. Not found this pass;
> `optimize-3d-scene` §14 says a stable count is the bar, and this is one short.

- **…and three more, all measured rather than guessed at.** Reported as *"the
  font sizes are all different, the animation only fires every other time, and
  case names are showing on the noise sets"*:
  - **"all different"** was two things, and neither was the font. The scale was
    derived from the **straight-line** distance where the projection divides by
    the **axial depth**, which left a label at the edge of the frame a quarter
    taller than one in the middle (39–49px across the fifteen sets); and a label
    turned fully with a set fifty degrees off the lens is foreshortened to two
    thirds of its width, which reads as a smaller font (175–283px wide for one
    string). Axial depth, and a quarter of the turn instead of all of it: now
    **38–39px** tall and within a few per cent of one width.
  - **"every other time"** was the typing being keyed on the string. Most of the
    wall says the same thing, so moving between two of those sets left the old
    label sitting there fully typed. It is keyed on the **television** now.
  - **case names on the noise sets** was the lookup taking the first mapped
    material in the traversal — and a television is mostly casing, which is
    textured too. Restricted to the `screen N` mesh, exactly the five case
    clips get names and everything else gets the placeholder.
- **…and four things wrong with it, fixed.** Reported as *"some labels can't be
  seen at all, they don't levitate like the television, the far ones are tiny
  and blurred"*:
  - **not seen at all** was two bugs wearing one coat — the wall is four rows
    deep, so a set at the back had its label buried in what stood in front of
    it, and the sets are splayed, so one turned far enough from the lens showed
    the label its *back*, which a front-sided material does not draw. The
    caption is `depthTest: false` and `DoubleSide` now: it is a caption on the
    interface, not an object in the room.
  - **the wrong kind of levitation** was `Box3.setFromObject` every frame: an
    axis-aligned box around a *turning* set grows and shrinks as it turns, so
    the label wandered on a rhythm of its own. The crown is measured once and
    carried, and the label rides the set's own position.
  - **tiny and blurred at the back** was a label sized in world units. It is
    sized in **pixels of the page** now — scaled by its own distance, so every
    label is 38px tall wherever it hangs and the canvas is read at about one
    texel per pixel. No mip chain, for the same reason.
  - and it is **Chakra Petch SemiBold at half again the size**.
- **Headings resolve out of a blur, letter by letter** —
  [[components/common|`<ScatterText>`]] on all four of them. Every letter has its
  own spring and its own speed, all started at once and in no order, which is
  precisely the shape `spring-text-engine` cannot make: its staggers are single
  numbers applied by sequential index and one config covers every letter, so what
  it produces is always a sweep. A deliberate exception to hard rule #3
  ([[decisions-log]] ADR-0031); everything else with text still goes through the
  engine.
- **The hero's words stay where they are.** They were absolute inside the tall
  section, so the scroll carried them up and out — words pulled off the page
  while the room behind them held still. `fixed` now, going out on blur and
  opacity over the first of the flight.
- **The last shot is framed like the first one.** It used to borrow two spill
  lamps, lift the figure's material off pure black and the floor's with it, and
  add a pitch of its own — a handsome studio portrait that looked like nothing
  else on the page. All of it gone: same haze, same sky, same black silhouette,
  and **the defocus comes back on** for it. The only thing the act still does to
  the framing is the tilted horizon.
- **Three smaller ones:** the About panel's cards sit on the page's usual 50px
  footing and its lead is aligned to the **second card** at any width; the last
  panel's dissolve **clears from the bottom up** rather than retreating back down
  the way it arrived (sampled off the canvas: bottom clear at 0.745, top still
  solid); and the flight's near line comes up a little earlier.
- **A hovered television says what it is.** The case name types itself in above
  whichever set is under the pointer, a character at a time with a block cursor
  running ahead of it, and it rides that set — up with the lift, round with the
  turn, level while it drifts. Light blue like the interface and **not
  tone-mapped**, which is what lets it come through the bloom as a glow: ACES
  pulls `#dbfffe` under the pass's threshold before it ever sees it. What it says
  is keyed on the **texture on that screen**, the same key the videos are matched
  on, so which set carries which case stays a decision in the model; the noise
  sets and the stills get *"Your work here"*. One plane, one canvas, reused.
- **The ring fills the window, and the pauses are gone.** Four fixes to the
  black panels, all reported from a 2000px window:
  - the carousel had a **238px cap** on its cards, so a wide window grew around
    a ring that did not — a band of empty black down each side. The cap is gone;
    the limit is now the window's *height* (26% of it), which is set by the
    ring's **sides** rather than its front, since those pass near the lens and
    render half again as tall. The perspective went from the specified `0.8vw`
    to `1.15vw` for the same reason, which also brings the front card to
    165×224 against the design's 173×235.
  - **nothing is printed on the cards** any more — a number and a handle on
    every face made the row read as a deck of tickets, and the dock already
    names the front one.
  - the **pauses between the panels are gone**: rise, hand-over and leave run
    end to end, and the dwell is inside the transitions rather than between
    them. `epilogue.hold` / `.reveal` moved to match — the pull-back now starts
    with the last dissolve instead of waiting for it.
  - the **last panel dissolves off** the same way the first arrives, so the
    closing shot is uncovered by a wave of pixels rather than a panel sliding.
  - and the flight's far line is **centred**: off to one side it ran out of the
    right edge before it could be read.
  Plus one thing nobody asked for: cards more than 96° round the ring now leave
  the compositor entirely (seven of fourteen at any moment). `backface-
  visibility` stops them being drawn but not from being layers, and on a weak
  GPU that was the difference between sixty frames and twenty.
- **The room dissolves into the team block.** The hand-over off the portfolio
  carousel is no longer a panel sliding up over it — it is a **wave of pixels**
  rising from the bottom of the window, scattered at its leading edge and solid
  behind, revealing the block as it goes. One canvas and a few hundred
  `fillRect`s per frame (the rows below the ragged band are a single rectangle),
  with a fixed random offset per cell so scrubbing the scroll replays the same
  dissolve rather than boiling it. The panels after it still slide, and the one
  that dissolves in still slides out when the next pushes it, so the stack's
  tiling is unchanged. 16.66 ms average while scrubbing the wave with the scene
  drawing behind it.
- **The team's ring, third time: a real cylinder.** Both earlier builds faked
  the arc — one separated the turn from the depth, the other did the same with
  every length in raw pixels — and neither could look like an arc, because on a
  ring those are one thing. Each card is now `rotateY(a) translateZ(-r)` on a
  ring that is itself `translateZ(push) rotateY(rot)`, where
  `push = r · (1 − arcDepth)` carries the ring forward so the front card lands at
  the viewer. Fourteen slots, the members cycling to fill them. The gesture is
  **drag, throw, snap** — 0.16° a pixel, friction 0.94, then an ease onto the
  nearest card that lands exactly so a hover cannot shiver. It is deliberately
  **not** a spring ([[decisions-log]] ADR-0030): a spring started at a target has
  no memory of the velocity that got it there.
- **An About panel** (Figma node `1444:410`) under the team, on the same black:
  heading at the left margin, a two-tone lead on a 667px measure, three `#dbfffe`
  cards with drawn marks in black tiles. Copy rewritten for the studio.
- **Both panels are a `<PanelStack>` now.** One number places the lot: `offset`
  runs from all-below through each panel covering to all-gone, and panel `k` sits
  at `(k + 1 − offset) × 100%`, so they **tile exactly** and a hand-over never
  shows a seam of the scene between them. The scene stops drawing for the whole
  stretch, not per panel.
- **The zoom into the television is gone.** The hand-over to the team block is
  that block **sliding up over the room** — opaque, up from the bottom, held
  while the scene behind it is staged, and on up and out as the closing shot is
  revealed. The finale act survives only for the framing the epilogue pulls back
  from (where the glass is, how far off it a lens would have to stand), which is
  measured rather than travelled; the noise crossfade that went with the push-in
  is deleted along with the quad, the config and the `textureFor` lookup that
  fed it.
  **Trap paid for:** Tailwind v4 compiles `translate-*` to the standalone
  `translate` property, applied *before* `transform` and not overridable by it —
  `translate-y-full` parked the panel a viewport down while its own transform
  read as identity.
- **The team row was a solid wall of cards on a wide window.** Its spacing,
  perspective and hover depth were in raw pixels while the cards were in `rem`,
  so past 1920 the cards grew with the grid and the gaps did not. All of it is in
  `rem` now, re-read whenever `innerWidth` moves. The cards are also turned the
  **other way** — outer edge forward, tangent to the arc, 9° a card — which both
  reads as an arc and works against the off-axis perspective instead of adding
  to it.
- **"The site is smooth but the videos stutter" was the frame rate.** The clips
  are 642×480; what makes them judder is that a `VideoTexture` is only uploaded
  on a frame the scene draws, and a wide window was drawing 8.3M fragments
  through bloom, a 41-tap bokeh, grain and the CRT glass — 30fps, and the video
  with it. `clampedPixelRatio` now takes a **fragment budget** (3.2M) as well as
  the tier clamp, which is invisible under grain and takes 2560×1440 from 8.3M to
  3.7M; and the scene **stops drawing altogether** while the team panel covers
  it, which also pauses all seven decoders.
- **The flight changes gear, and the two lines arrive one at a time** — they
  were coming up together and in a blink, because a single easing across the
  flight spends nearly all of its scroll among the televisions and crosses the
  empty corridor past them almost instantly: each line had ~120px of scroll to
  appear in. `scroll.flightSplit` now covers two thirds of the dolly in the first
  40% of the flight and the corridor over the other 60%, and each line carries
  its own `fadeIn` distance, so the near one is up and going past before the far
  one shows. `figureFade` moved earlier to match the first gear.
- **The team cards were built on a cylinder, and a cylinder is wrong here** — on
  a real ring the turn grows as fast as the depth, and by three cards out the
  off-axis perspective had folded the card into a **41px sliver**; the design's
  outer cards are **195px** and all but face-on. Depth is linear in cards from
  the front now, the turn is its own small number (3° a card), and the
  perspective is long (2400px). Measured back against the design: 173×235,
  186×255, 197×276 versus 173×235, 176×253, 195×272. The row also runs bright to
  the frame edge instead of dimming into the black, cards lift under the pointer,
  and the placeholders are abstract panels — a drawn-on figure reads as a bad
  photograph. **`next/image` caches optimised copies in `.next/dev/cache/images`**
  (Next 16 moved it): overwriting a file in `public/` is not enough, not even
  across a server restart.
- **A team block on the black** — Figma node `1442:352`, the first of the two
  sections the finale's black exists to carry: heading, an `[ 01 / 08 ]` counter,
  a **draggable 3D ring of cards** across the middle of the frame, and the front
  card's name and tags on the usual bottom footing. The ring is concave (the
  outer cards are the near ones, as the design shows) and endless — a card that
  falls off one side comes back on the other, at a distance where the fade has
  already taken it to nothing. Drag, click and keyboard all reach it. Portraits
  are generated placeholders under `public/assets/team/` — **PNG, not SVG,
  because `next/image` refuses SVG without `dangerouslyAllowSVG`**. The block is
  `fixed` and faded straight from the scroll: the black is a layer over a canvas
  that sticks for the whole page, so what sits on it has to be pinned to the
  window as well.
- **The rack focus stops at the end of the first scene** (`scroll.focusFade`).
  It is that room's effect; past it there is nothing to rack to and the defocus
  was only softening acts that want to be sharp. The pass keeps rendering — the
  dust reads its depth — so what closes is the blur ceiling, re-derived every
  frame rather than switched, which means scrolling back up brings it back.
- **The flight's first line no longer flies out over the televisions.** Both
  lines moved into the corridor past the wall (z −7.6 and −9.3) and gained a
  second gate, `signs.clearOf` — a ramp on the camera's own Z that keeps them at
  zero until the lens is clear of the last row of sets. Distance ahead of the
  lens was never enough on its own: six units ahead of the lens is still inside
  the wall.
- **The carousel's edge sets no longer twitch on a turn.** `hideBeyond` was
  `1.6` — a tenth of a slot onto the curve-away, which packs a twenty-unit run
  into one slot, so a set on it moved a quarter of a unit per frame *and* was
  being shown and hidden by a boolean while still in shot. Found by projecting
  every member to NDC across a turn: the flip was landing at x ≈ −0.35, the
  middle of the frame. At `1.5` every flip lands at x ≈ ±1.61 and the largest
  per-frame step drops from 0.27 to 0.14.
- **The second section has its interface** — Figma node `1441:247`, ported the
  same way the first was, from the node's own numbers rather than from a picture
  of it: `<CasePanel>` with the heading in the hollow display face at the same
  97px the hero's sits at, *Previous* and *Next* 240px in from each edge on the
  vertical centre, and a bottom-anchored column of case name, three tags and the
  *Explore* pair, 50px off the bottom. It replaces `<CarouselControls>`'s two
  round arrows. The televisions are cases now and each has a name — Stride,
  Halcyon, Kestrel, Meridian, Marlow — lined up with `scroll.carousel.members`
  **by index**; the scene reports which one it has turned to the front through a
  new `onCarouselIndex`, and the name and tags re-run their spring when it
  changes. Faded out, the panel drops `pointer-events` as well as focus: its
  *Explore* link lands exactly where the hero's buttons are.
- **Two lines of copy in the flight** — the stretch between the wall and the
  carousel was several seconds of empty fog. Now the lens passes through
  *"Built to hold attention."* near and large and *"A signal in the noise, tuned
  only for you."* small and further back. Canvas textures on quads
  (`lib/scene/tv-signs.ts`, [[decisions-log]] ADR-0028) — no font atlas, no new
  dependency, and the near line is properly occluded by the sets it lifts out
  from behind. They fade on distance ahead of the lens, which keeps them out of
  the opening shot without a scroll window of their own. **The family cannot be
  read from `--font-display`**: Tailwind's `@theme inline` resolves it into the
  utilities and never emits the variable, so the first build silently rasterised
  the fallback grotesque. It asks the cascade now, through a throwaway element
  carrying the class.
- **Copy rewritten for a web studio**, character-for-character against what it
  replaced so the measures still break where the design breaks them: the headline
  (25) and the intro (112).
- **The headline is 40px under the nav**, measured from the top rather than from
  the centre — the nav is `fixed`, and a centre-anchored headline drifts away
  from it on any window that is not 800 tall.
- **The tuning panel opens shut.**

## 2026-08-06

- **The hero's interface, this time read from the file instead of the picture** —
  the Figma first block (node `1097:251`): the nav pill fixed at the top, a
  hairline frame with corner brackets over the whole window, `fps` / `REC` / date
  / time-on-page in its four corners, the `h1` in the hollow display face, and a
  crosshair, the intro and two buttons against the bottom edge. Two supplied faces
  replace the starter's Onest — **Chakra Petch** (→ `--font-sans`) and **Big
  Shoulders Inline** (→ `--font-display`), both `next/font/local` — plus new
  chrome tokens and `useFpsReadout` / `useElapsedReadout`, which write into refs
  off the shared ticker instead of re-rendering.

  The **first build of it was measured off an exported screenshot**, because
  `get_design_context` was timing out on every call, and it showed: a solid grey
  stadium instead of a **20% white pill with a 3px backdrop blur and a 6px
  radius**; one rounded rectangle instead of **1px rules at 50% white with 32×32
  two-pixel corner brackets**; 14px readouts instead of **Chakra Petch Regular
  16**; a hand-broken 68px headline in white instead of **Big Shoulders Inline
  72/1.0 in `#dbfffe` on a 535px measure**; a two-rule hamburger instead of three;
  8px button radii instead of 6 — and no crosshair at all. The tool answered on a
  later attempt and all of it was rebuilt from the node's own numbers, verified in
  the browser with `getBoundingClientRect`.
  **The lesson worth keeping:** when `get_design_context` times out, retry it
  before falling back to measuring pixels — a screenshot gives you geometry and
  lies about everything else.
- **…and the ghosted edges were the *defocus*, not the bloom at all** — reported
  as still-broken with screenshots from a full browser window, where every
  out-of-focus set showed a doubled contour, while the same build in a small
  preview pane looked clean. three's `BokehShader` is a fixed 41-tap ring pattern
  and its `maxblur` is in **UV**: a UV ceiling is a wider blur the bigger the
  window, so past ~10 px of radius the taps stop overlapping and each draws its
  own copy of the edge. `depthOfField.maxBlur` is a ceiling in **page pixels**
  now (`22`), converted on every resize. Bracketed on one frame: ghosting
  unmistakable at `70`, visible at `40`, gone at `22`. A large window gets less
  defocus than before — that is the price of the taps staying overlapped.
- **…and then it was an outline, and the cause was the sharpest mip** — a bright
  rim traced every screen's edge instead of light spilling off it.
  `UnrealBloomPass` adds five blurred copies of the bright parts, and the
  half-resolution one is barely blurred at all: it is the screen's own rectangle
  laid back over itself a pixel or two wide. No threshold or radius setting can
  fix that, because `radius` only re-weights the levels. New `bloom.fine` (`0`)
  mutes it through the pass's `bloomTintColors`, leaving the wide levels that
  actually look like light in a room. Two softer contributors went with it:
  `bloom.knee` (`0.45`) fades pixels in at the threshold instead of clipping —
  `smoothWidth` defaults to `0.01` — and the radius went `0.5` → `1`. Verified by
  A/B on the same frame: at `fine 1` the whole wall is outlined, at `fine 0` the
  rims are gone and the glow remains. All three are on sliders.
- **The bloom was a veil; it is a glow now** — reported as *"the bloom is working
  incorrectly"*, with screenshots of shapeless bright blobs sitting over the room
  and no object under them. The threshold was `0.08`: practically every pixel of
  the frame passed it, got blurred at radius `1.5` and added back, which lifts the
  blacks everywhere and turns anything bright *and* out of focus into a smear —
  the bokeh pass runs immediately after. Threshold `0.58` now, above the room and
  below the screens, with the radius down to `0.5` and the strength up to `0.18`
  where it can do something. Isolated the usual way: at strength `0` the frame
  came back clean, which ruled the depth of field out.
- **Three fixes to the glass and the sky it covers.**
  - **The panel can colour the sky again.** The scroll's colour drift writes the
    dome *every* frame, so anything the panel set was gone by the next one — it
    now interpolates between three **live** colours instead of two config
    constants, and those three are what the panel edits. A third picker came with
    it: "sky top (scrolled)", the colour the flight carries the sky to
    (`scroll.skyTop`), which was not reachable from the panel at all.
  - **The scanlines are a count, not a pitch.** A fixed pixel pitch is a
    shrinking share of a growing window: right on a small preview pane, invisible
    on a full display, which is how it was reported. `scanCount` (300) holds them
    to the same share of the picture everywhere, capped in the shader so the
    pitch never falls under ~2 page pixels and turns into moiré.
  - **One vignette, and it moves.** The CSS `.scene-vignette::after` is gone and
    the CRT pass's own falloff took over — deeper now (0.78) to make up for it,
    and on a slider. [[decisions-log]] ADR-0020 is revised with why: that ADR
    holds only while the scene has no pass of its own to ride on, and it has one
    now. `--raw-color-room-950` and `--scene-vignette` are deleted with it.
- **The whole page is watched through a cathode ray tube now** — new
  `lib/scene/tv-crt.ts`, one `ShaderPass` at the end of the composer and so over
  every act: hairline scanlines, the slow bright band an unsynced set drifts down
  its picture, and a hair of colour fringing that grows toward the corners. Every
  strength is deliberately under the threshold of notice (`config.crt`), with a
  "CRT glass" block in the tuning panel for finding them, and the tube's corners
  falling off into a vignette of its own (the CSS one on the section stays — that
  frames the page, this one is the glass). **The spacing is in CSS pixels, not
  device ones:** keyed to the drawing buffer, two pixels is under a pixel of the
  page on a dense display and the lines flatten into a uniform dimming. Even in
  CSS pixels the first pass at it was reported as invisible — a 2.4 px pitch at
  0.16 deep is where lines start reading as lines. Frame time unchanged —
  16.7 ms average, p95 17.3 across the scroll.
- **The last shot's blocking, as tuned in the panel** — the television now drifts
  from `[0, 0.86, -14.15]` to `[-0.35, 0.76, -13.6]` and turns −1.82 rad as the
  black lifts; the figure stands still at `[-1.57, -0.23, -11.95]` and turns
  0.62. Worth knowing for the next tuning pass: the camera's blocking hangs off
  the **television's `from`**, so moving that carries the lens with it and leaves
  the figure's world coordinates behind — which is how the figure ended up five
  metres *behind* the lens and vanished.
- **The last shot's two subjects are placed *and turned* by track, and the panel
  edits both** — `epilogue.television` and `epilogue.figure`, each with a
  `position` and a `rotation` track, each track a `from` at the start of the
  reveal and a `to` at the end (equal today: they hold still while the lens pulls
  back). The tuning panel gained a "Final shot" block of number fields for all of
  it, and `copy config` carries them out. World coordinates rather than
  camera-relative offsets, because these get found by dragging and reading back —
  and the rotations are world-axis *offsets* applied through a quaternion
  premultiply, because the television is aimed at the lens by its own screen
  normals and the figure's Eulers carry an FBX Z-up conversion: adding to its
  `rotation.y` directly would not be a turn about the room's vertical. The measured `groundDrop` that used to plant the set on the floor
  is gone — its result is the television's `y`. **The catch, and it bit once:**
  the camera's pull-back is anchored to the television's `from`, not to where the
  set currently is; read live, the lens follows the set everywhere it is dragged
  and moving it changes nothing on screen.
- **The last shot, framed to the blocking** — the horizon is thrown off level
  (`epilogue.roll`) and the pointer parallax damped to a quarter, because at full
  strength it swings the frame by a quarter of its width and walks the figure out
  of the composition. The set is planted on the floor by measurement (`groundDrop`
  — the gap between the room's floor and its own lowest point, taken once under
  black). The figure comes in far bigger and closer. The sky is taken back to the
  colour the first scene opens on, under the black, so the last shot is blue
  rather than the flight's orange. And two materials are lent a colour for this
  shot and given it back afterwards: the figure, which ships pure black and
  cannot be lit at all, and the floor, at under half a percent reflectance — a
  television has to visibly stand on something. Two of the three spill lamps are
  staged along with them: a pool on the floor and a light behind the lens.
  **Also fixed on the way:** the figure's meshes are now `frustumCulled = false`,
  because three culls a skinned mesh on its bind-pose sphere and this shot puts
  it at the edge of a frustum a metre deep — it vanished outright.
- **A fourth act: black to hold sections over, and the shot it opens onto** — the
  home section is `700lvh` now (every earlier act window rescaled by 0.6 to
  match). After the finale's black the scene does nothing for ~1.7 viewports —
  **that stretch is for two page sections laid over the black** — and then the
  black lifts as the lens *pulls back off the glass it pushed into*, into the
  closing blocking: the figure close at one edge, the television at the other,
  turned a quarter away. Nothing is built for it: the figure is the opening one,
  carried across the room and faded back up while the black is total; a spill
  lamp is borrowed to give it an edge to read against; the set is the carousel's
  front one with its aim frozen. The blocking's sideways offsets scale with the
  window's aspect, or the figure stages itself off frame on anything narrower
  than 16:9. ADR: [[decisions-log]] ADR-0027. Frame time unchanged: 16.7 ms
  average, p95 17.2 across the whole scroll.
- **The dust sits *in* the room now, not on top of it** — with no depth of its
  own it drew over everything, including the figure's silhouette, which reads as
  grain on the lens rather than dust in the air. The bokeh pass already renders
  the scene's depth for its own blur, so the dust shader samples that and fades a
  mote out as it passes behind anything. Costs nothing measurable (16.66 ms
  average, p95 17.1 across the scroll) because that depth pass was already being
  paid for. The mobile tier builds no bokeh pass, so the test compiles out there.
  See [[decisions-log]] ADR-0025, revised.
- **The carousel's line is flat, and only three sets are on it** — `bulge` is now
  `0`, so every television stands at the same distance and height and differs
  only in the angle it is turned through to face the lens; the leaning arc came
  out as neighbours at visibly different sizes, which reads as a mistake rather
  than a curve. `hideBeyond` is `1.6`, so the sets further round the ring — which
  showed as small half-lost shapes *behind* the line — are not drawn at all. The
  threshold is crossed at x ≈ ±4.7, off-frame on any window.
- **The carousel became a real one: a ring, buttons, and a way out of it** — four
  changes to the second scene and a third act after it.
  - **It loops.** The members hold fixed indices on a ring and what moves is the
    rotation; a slot is the signed distance to the front, wrapped. `turn(±1)` is
    one integer and a spring, and the wrap is invisible because both ends of the
    ring meet at a single point buried in the fog. ADR: [[decisions-log]]
    ADR-0026.
  - **Previous / next**, as DOM `<button>`s over the canvas
    (`carousel-controls.tsx`), fading in on a `<Spring>` for the stretch of the
    scroll where the camera is holding still on the carousel. The flight now ends
    at 60% of the scroll rather than at the end of it, which is what makes that
    stretch exist.
  - **Bigger sets, twice the gap**: `scale` 1.6 and `spread` 3, so three are
    across the frame instead of five, and **hovering one lifts it** the way the
    wall's do — the ring runs its own raycast, since the clones are deliberately
    invisible to the wall's pick.
  - **A finale.** Past the carousel the front set squares up to the lens, its
    picture crossfades to noise (a second quad on the screen's own geometry — the
    material is shared with the wall's original and cannot be written to), the
    camera pushes in until the glass is the whole frame, and a black layer closes
    over it. The push-in distance is derived from the measured glass and the
    lens's fov and aspect, taking the **nearer** of the vertical and horizontal
    fits, so it fills the frame at any window shape. The home section is `420lvh`
    to make room. Measured across the whole scroll: 16.7 ms average, p95 17.2.
- **The sky is a dome now, so the horizon belongs to the room** — reported as
  *"the horizon seems to shift; make the fog stay in one place instead of
  following the camera"*. It was the background: three draws a plain texture
  background in **screen space**, so its horizon sat at a fixed height in the
  frame while everything else moved. New `lib/scene/tv-sky.ts` — a back-side
  sphere that mixes two colour uniforms by the latitude of the view direction,
  riding along with the camera's position and ignoring its rotation. The horizon
  now turns with the lens and holds still through the flight. Recolouring is two
  uniforms, so the scroll's sky turn-over runs every frame instead of in 48
  quantised steps and uploads nothing: the full-scroll p95 went 17.3 → 22.5 →
  **17.1 ms** across the failed equirect attempt and this. `utils/scene/gradient-texture.ts`
  is deleted. ADR: [[decisions-log]] ADR-0024, which also records why the obvious
  fix — `EquirectangularReflectionMapping` on the old texture — is a trap.
- **The dust is drawn outside the post chain** — every out-of-focus mote was
  coming out as a rosette of dots, which is `BokehPass`'s three-ring sampling
  pattern becoming legible on a two-pixel highlight. `TvDust` now owns a private
  scene and renders straight to the canvas after the composer, so a mote keeps
  the hard rim its own shader draws at any focus distance. Motes are smaller
  (`dust.size` 6.5 → 4.6) and fade out past ~13 units — outside the chain the
  scene's fog never reaches them, and undimmed specks at the far wall read as a
  starfield. ADR: [[decisions-log]] ADR-0025, including the `depthTest` trap that
  silently discarded the entire cloud.
- **The carousel keeps out of the first scene properly** — fog alone was not
  enough: 3% transmittance still ghosted a dark set against a lit sky. Each
  member now starts 20 units behind its place (over 30 from the opening camera)
  and is not drawn at all until its own `delay`, and the delays moved into the
  **second half** of the scroll, so nothing of it exists until the wall is behind
  the lens.
- **The two scenes no longer overlap: the flight goes out the far side and the
  carousel arrives out of the fog** — the second act used to end with the lens
  still among the wall's televisions, and with the carousel visible over their
  heads from the very first frame of the page. Both are gone. `scroll.dolly` runs
  to −15, which puts every set of the opening wall **behind** the camera by the
  end (`figureFade` pulled to `[0.02, 0.12]` to match — a longer flight reaches
  the figure in a smaller share of the scroll). Each carousel member now starts
  11–13 units *behind* its resting place, ~30 from the opening camera, where the
  `FogExp2` haze is ~99% opaque: invisible in the first scene with no `visible`
  toggle to pop, and arriving by coming **at** the lens out of the murk instead of
  dropping in from off-frame. Both the camera's travel and each member's own
  progress are **smoothstepped** rather than eased out, so nothing enters or
  leaves motion with speed on it — the jump a delayed member used to make the
  frame its `delay` passed is gone. The outer pair came in to ±2.45 so the window
  cuts it in half rather than missing it entirely on a 16:9. Measured while
  scrubbing the whole scroll: 16.7 ms average, p95 17.3, worst frame 17.8.
- **The hover's cyan blob was a spill lamp standing inside the wall** — the three
  `spillLights` sat among the televisions, so a set that lifted or drifted on
  hover passed close enough to catch a blown-out patch, which the bloom (at a
  threshold of `0.08`, where practically everything blooms) spread into a coloured
  stain over the wall. They now stand in the clear band between the figure and the
  front row, where nothing that moves can reach them.
- **Dust reads as dust** — many small discs with a hard rim rather than a few soft
  blobs: `9000` motes at `size 6.5`, opaque to 80% of the radius with only the
  last fifth feathered (a gaussian falloff across the whole radius is what made
  them smudges), and the box deepened along `z` so it covers the whole flight
  instead of emptying out as the camera leaves the opening shot.
- **One tiering rule was making the same build look broken in one window and fine
  in another** — reported as three separate bugs: no depth of field and low frame
  rate in the editor's preview pane, and no dust in a normal browser. Both trace
  to `isMobile()`. The skill's formula counts any viewport under 768 px as a
  phone, and the preview pane measures 741 — so it was getting the phone tier: no
  bokeh pass, half the bloom, a third of the dust and a **30 fps cap**. The tier
  now follows the **pointer** (ADR-0023); the pane runs the full scene at 60 fps.
  The missing dust was the other half: `gl_PointSize` is in pixels, so motes at a
  fixed size are obvious in a small window and invisible in a large one. Point
  size now scales with the drawing buffer's height.
- **The flight is level, the carousel is a semicircle, and the sky turns over** —
  the camera flies dead forward (`scroll.rise` is `0`) all the way through the
  wall and out the far side, because there is no level course *around* a wall that
  spans z ≈ +2.5 → −4.6. The figure standing in that corridor now **dissolves**
  (`scroll.figureFade`, with `transparent` set once at load — it is a shader
  define), and camera travel is eased in so the start of the scroll is a drift and
  the fade has room. The five televisions now stand on a **semicircle** of radius
  ≈ 4.6 around the camera, spread wide enough that the outer pair runs off both
  edges of the window. Their placement comes from the frustum's half-width
  (`0.49 d` on 16:9) rather than by eye, which had put them off-frame twice. The
  sky blends from its opening colour to the new `scroll.skyTop` (`#ff6038`),
  repainted in steps rather than every frame.
- **The scroll flies forward into a five-television carousel, and the air has
  dust** — the scroll act was reversed and widened. The camera **flies forward**
  (`scroll.dolly` negative) and **climbs** (`scroll.rise`) over the figure and
  over the wall; beyond it five televisions assemble into a carousel — one
  dropping in from above into the centre, two arriving from each wing — the seed
  of the portfolio carousel to come. Each member has its own `delay` (so the set
  assembles piece by piece off one progress value) and `arc` (so the flight reads
  as a flight), and all of it is still a pure function of progress, scrubbable
  both ways. **Worth remembering:** flying forward at eye level buries the lens
  *in* the wall — it spans z ≈ +2.5 → −4.6, so everything in front of the camera
  is inside it — and the carousel assembled among the wall's own sets until the
  camera was lifted over them. Placement is bounded by the frustum too: at the
  carousel's depth the frame is only ±2.1 units wide, so the outer pair came in
  from ±3.85 to ±2.15.
  New `lib/scene/tv-dust.ts`: one `Points` cloud, one draw call, **all motion in
  the vertex shader** off a single `uTime` (`optimize-3d-scene` §9), positions
  hashed rather than random so the cloud is the same every load, `frustumCulled`
  off because the shader moves the motes out from under three's bounding sphere,
  and a smaller count on the mobile tier. Sky top is now `#387aff` per the
  supplied config. Measured while scrubbing: 16.7 ms, p95 18.4.

## 2026-08-05

- **The scroll pulls the camera back and flies a television into frame** — the
  home section is now `260lvh` with the scene stuck to the top of it, purely to
  have a scroll to be driven by. Over it the camera dollies back by
  `scroll.dolly` and a television rises from below the frame, tilted and turning,
  into the middle of the shot, where it levitates. New `lib/scene/tv-flyer.ts`:
  a **clone** of the wall television whose screen wears `flyer.screenTexture`
  (`magic`), so it shares geometry, material and video — one extra draw call, no
  second decoder — and it lives on the scene rather than the model, out of reach
  of hover picking and stack detection. Everything is a function of progress, so
  the flight scrubs in both directions.
  Two things cost a round each and are written down in [[scene-3d]]: the clone's
  rotation has to go through **quaternions** (these nodes' Eulers carry `x`/`z`
  at π, so adding a yaw and writing the angles back lays the set on its back),
  and *which way a television faces* comes from its **screen's normals** — the
  cheaper centre-offset guess is 180° wrong, because a CRT's bulk sits behind the
  glass. Also: `VideoTexture`s are now named after their clip, or the flyer could
  not find its source once the stills had been swapped for video.
  Scroll progress is read once per frame in the loop and low-passed rather than
  sprung (`optimize-3d-scene` §9–§10). Measured while scrubbing: 16.7 ms average,
  p95 18.5.
- **Bloom artefact during a focus rack fixed; the panel hides and copies its
  config** — pulling focus dragged a fuzzy coloured stain around the frame. Cause:
  the bloom ran *after* the defocus, so it was fed bokeh discs — a small highlight
  became a blob, the bloom's coarsest mips smeared it, and it swam as the focal
  plane moved. Isolated by setting bloom strength to zero (artefact gone → bloom,
  not bokeh). **The chain is now `Render → Bloom → Bokeh → Output → Film`**: bloom
  works on a sharp frame and the defocus softens the glow with everything else,
  which is also what a lens does. ADR-0020's amendment corrected.
  Panel: a **hide** button collapses it to a single chip so the frame can be
  judged unobstructed, and **copy config** puts the live values on the clipboard
  as a block that pastes straight into `config.ts`. The snippet is built in the
  scene (`settings.snippet()`) because it needs the fields the panel never
  touches, or it would not compile where it lands. Copy tries the selection path
  before the Clipboard API — the latter's permission prompt can leave its promise
  pending forever in an embedded browser and swallow the click — and falls back
  to showing the snippet in a textarea if both are refused.
- **Rack focus on hover, a louder lift, the last still screen fixed, new panel
  values shipped** — four changes from one round of review.
  **(1)** Hovering a television now **pulls focus** onto it and lets it go on the
  way out, on `depthOfField.focusSpring`; the resting plane stays
  `depthOfField.focus`. The goal is the target's depth *along the camera's view
  axis* (what the bokeh shader actually compares against) and is re-read every
  frame, since a hovered television is rising and drifting while it is held.
  Measured: 5.25 at rest → 4.53 on a near television → 5.25 on release.
  **(2)** Lift raised `0.11 → 0.26`, turn `0.1 → 0.14`, and the idle drift
  roughly doubled (`float.amplitude 0.075`).
  **(3)** Television `15` was still a picture: its screen mesh kept the exported
  name `defaultMaterial.057` when the others were renamed, so the `screen N` rule
  never saw it. A screen is now **either named like one or wearing a texture a
  clip is named after**, which also lights it — it had no emissive either.
  **(4)** Panel values shipped: bloom `0.09 / 1.5 / 0.08`, depth of field
  `5.25 / 0.0032 / 0.03`, grain `0.3`, screen glow `0.73`, environment `0.06`,
  key light `1.09`.
- **The horizon seam is gone** — the floor's far edge cut a hard line across the
  frame where it met the sky, and no amount of fog would hide it: `scene.fog`
  colours geometry and never the background, so the floor faded to the fog colour
  against a sky that was a different one. Fixed on three fronts: the sky
  gradient's bottom stop **is** the fog colour and flattens at the new
  `environment.backgroundHorizon` (`createGradientTexture` takes a third
  argument); the floor is scaled by `environment.floorScale` so its edge sits
  past the distance the fog has gone opaque; and retinting the fog in the panel
  now drags the sky's bottom with it, so tuning cannot re-open the seam.
  Verified at exposure 1.9 — well above the shipped 0.8 — where a seam would have
  nowhere to hide.
- **Fog can be pushed off the lens, and the panel gained a Lighting group** —
  `environment.fog` now carries a `mode`: `exp2` (density, thickens from the
  camera outward, no start) or `linear` (`near`/`far`). The shift only exists in
  the linear variant — `FogExp2` has no distance at which it begins, so nothing
  can hold the foreground clear. Switching mode swaps the fog object and, because
  the fog type is a shader define, recompiles every material; the setter
  therefore rebuilds only on an actual mode change and writes density/near/far in
  place otherwise. New **Lighting** group in the panel exposes the last config
  values that shape the look: screen glow (the screens' emissive strength, which
  feeds the bloom), environment intensity and key-light intensity.
- **Panel-tuned values shipped; the panel grew an Atmosphere group** — the look
  found in the panel is now what `config.ts` carries: bloom
  `strength 0.19 / radius 1.5 / threshold 0.04` (let everything bloom, keep it
  faint — the inverse of the earlier "high threshold, strong glow" pairing) and
  depth of field `focus 5.05 / aperture 0.0025 / maxBlur 0.008`. The panel's
  **Fog** group became **Atmosphere**: fog density and colour, plus sky top, sky
  bottom, exposure and grain — `FogExp2` has only two knobs of its own and
  neither reads right without the sky behind it and the exposure it is seen at.
  Sky changes repaint the gradient texture and dispose the previous one, so a
  slider drag does not leak an upload per frame.
- **A development tuning panel, matte screens, one screen retargeted** — four
  small things. **(1)** `<SceneControls>`: sliders for bloom (strength, radius,
  threshold), depth of field (focus, aperture, maxBlur) and fog (density,
  colour), writing straight into the live passes via `scene.settings` so a drag
  is a uniform write rather than a pass rebuild. It is development-only, and the
  `NODE_ENV` check guards the `dynamic()` call itself so the production build
  emits **no chunk** for it — verified by grepping `.next/`. Values found there
  still have to be copied into `config.ts`. **(2)** Screen materials are matte
  now (`roughness 1`, `metalness 0`, `envMapIntensity 0`): being lit from inside,
  their only specular response was catching a room point light and dropping a
  white blob on the picture. **(3)** New `screenVideoOverrides` (keyed by screen
  number, beats the texture-name match) — screens `2`, `5` and `12` share one
  still texture and only `12`, the one on the right of the frame, should play;
  it now runs `noise.mp4`. **(4)** Fog is tunable at runtime, which is what
  surfaced the first three.
- **Every screen glows, the figure defocuses, grain over the frame** — three
  additions after a look at the reference side by side. **(1)** Bloom threshold
  dropped `0.78 → 0.3` so each screen gets its own soft halo instead of only the
  brightest two or three; strength eased to `0.5` with a wider `0.8` radius so
  the halo stays soft. **(2)** A `BokehPass` before the bloom leaves the figure —
  a metre from the camera, against a wall 3–10 units back — visibly soft-edged
  (`depthOfField`); it costs a second scene render for depth, so the mobile tier
  drops it. **(3)** A `FilmPass` after `OutputPass` puts grain over the finished
  frame, in display space rather than before tone mapping (`grain.intensity`).
  Also: fog and sky lifted off black (`#17242c` / `#1b2a33`) — the character's
  material is pure black and takes no light, so its silhouette can only read
  against what is behind it. Full five-pass chain still measures 16.7 ms/frame,
  p95 17.3. ADR-0020 amended.
- **Lit to the reference: a dark room, bloom off the glass, haze** — the scene
  was re-lit from a supplied still. `FogExp2` haze, a near-black gradient sky, a
  darkened floor (the model ships a white studio one), screens turned into light
  sources (`emissive` + the picture as `emissiveMap`), three coloured
  `PointLight`s standing in for the spill, a weak cool key, and an
  `EffectComposer` chain `RenderPass → UnrealBloomPass → OutputPass`. The
  vignette is a CSS pseudo-element rather than a fourth pass — new token pair
  `--raw-color-room-950` → `--scene-vignette`. ADR: [[decisions-log]] ADR-0020.
  Tuning worth remembering: the first pass at `threshold 0.62` + `screenGlow 1.5`
  bloomed the entire frame into milk; the shipped values are `0.78` / `0.6`.
  Composer DPR is clamped from the same function as the renderer and bloom is
  halved on mobile. Measured 16.7 ms/frame, p95 17.2 with everything running.
- **Raised televisions levitate** — while a television hangs it bobs, swings and
  tips on three sine waves at different rates, each one offset by its own phase
  and swinging first in its own direction (both derived from its order in the
  model, so the scene is identical on every load). The drift scales with how far
  up it is, so it fades in with the rise and is exactly zero at rest. Config:
  `hover.float`.
- **The screens play video** — seven MP4s from `public/assets/hero/Videoes/` now
  run on the television screens. Each clip is matched to a screen **by the name
  of the texture the model already has there** (`cat.mp4` → the screen textured
  `cat`), so which television shows what stays a decision in the model; a screen
  with no matching file keeps its still. New `lib/scene/tv-screens.ts`: one
  `<video>` + `VideoTexture` per file (three screens share `color noise`, and
  therefore share one decoder), a per-screen material clone so a texture never
  leaks onto the screens that shared that material in the export,
  `flipY = false` to match GLTFLoader's own textures, muted + `playsinline`
  autoplay, and playback gated on the render loop so an offscreen scene stops
  decoding. Measured 16.7 ms/frame, p95 17.2 with all seven playing — unchanged
  from before video on a desktop GPU; **untiered on mobile, flagged in
  [[scene-3d]]**. Gotcha worth remembering: GLTFLoader sanitises node names, so
  the GLB's `screen 13` arrives as `screen_13`.
- **New model, and the figure now animates** — `public/assets/hero/TV.glb` was
  re-exported: 6.7 → 3.8 MB, 119 → 60 meshes, ~175k → ~105k triangles, 27 → 10
  textures, and the televisions' screens now carry artwork with
  `KHR_materials_emissive_strength`. The televisions kept the root names
  `"1"`…`"15"` and the floor kept `Plane`, so the hover's only contract with the
  model still holds and no picking or stacking code changed. The old low-poly
  figure was replaced by a skinned character (`Sketchfab_model` → `Jeff.FBX`,
  134 joints) carrying one 11.7 s clip.
- **`AnimationMixer` wired into the scene loop** — every clip in the GLB plays;
  the mixer is stepped with the inter-frame delta **clamped to 50 ms**, and the
  timestamp is dropped whenever the loop unsubscribes (offscreen / hidden tab),
  so returning to the page resumes instead of fast-forwarding. Under
  `prefers-reduced-motion` the clip is applied once and the mixer released — the
  figure holds its authored pose without looping. Disposal stops all actions and
  `uncacheRoot`s the model. Pick cost with the skinned figure in the narrow
  phase: 16.7 ms average, p95 20.7 (was 17.4). Docs: [[scene-3d]].

## 2026-08-02

- **Hover motion smoothed, especially when switching fast between televisions** —
  the jerk was structural, not a spring setting: the lift was a 0→1 spring
  multiplied by the television's depth in the stack, so sliding the pointer up a
  column (depth 2 → depth 0) teleported it down two steps mid-flight. The spring
  now animates the height *in steps* and a depth change is just a new goal.
  Measured max change per frame across a fast switching session: 0.074 steps
  (0.008 world units) — continuous, no discontinuity. Also: separate rise and
  release configs (damping 1.06 / 1.24, neither overshoots, softer on the way
  down), and a 45 ms stagger per step so a column rises as a cascade.
- **Hover stops handing itself to a neighbour** — pointing at the top of a stack
  raised the one below it. Two feedback loops, both fixed: the pick ran again
  while the camera was still easing, and the parallax (now ≈11°) slides the wall
  out from under a stationary cursor, so the re-pick landed on whatever drifted
  in next; and the pick used the *animated* pose, so a television that rose moved
  out from under its own cursor. Picking now runs on pointer movement only and
  always against the resting pose (`pick()` writes the displaced televisions back
  to rest, rays, restores). Aiming through the camera's *settled* pose was tried
  as an alternative and rejected — it forces the user to lead a moving target.
- **Hover corrected: gaps open, neighbours stay put, every television responds** —
  three fixes to the hover shipped earlier the same day.
  **(1) The stack separates.** Each television now rises `lift × (depth + 1)`
  where depth is its hops above the hovered one, so the base of the three-high
  column lifts one step, the middle two and the top three — a visible gap at
  each joint instead of a slab.
  **(2) Neighbours no longer move together.** Stacks were connected components,
  and a television resting across two floor-standing neighbours bridged them into
  one, so hovering one lifted an unrelated one beside it. The relation is now
  directed and followed upward only: what is above the hovered one rises, what is
  below stays.
  **(3) Every visible television is reachable.** Picking was a ray against one
  AABB per television; on a wall this dense the boxes overlap so heavily that
  some televisions could never win the pick. Picking is now two-phase — boxes to
  narrow the field, a real mesh raycast to decide — with the figure in the narrow
  phase so it still occludes. Measured 16.7 ms/frame (p95 17.4) with the pointer
  moving every frame. `14` and `15` still never hover: they sit outside the
  camera's frustum entirely.
- **Televisions react to the pointer, and the camera drift got wider** — hovering
  a television lifts it (`hover.lift`, 0.11 world units) and turns it about its
  own footprint centre (≈6°), taking whatever is stacked on it along. Stacking is
  derived from world AABBs (base-meets-top + footprint overlap) in the new
  `lib/scene/tv-stacks.ts` — nothing about the model's numbering is hardcoded.
  Camera parallax raised from ≈5°/3° to **≈11° yaw / 6.6° pitch**. Both effects
  share one gate — off on touch and under reduced motion.
- **Home route ships a 3D scene** — `/` now renders a WebGL wall of CRT
  televisions with a low-poly figure seen from behind, framed to a supplied
  reference still, with the camera drifting after the pointer (≈5° yaw, ≈3°
  pitch, spring-driven, `#todo` no artwork on the screens — the GLB's screen
  material carries only a grunge map). New: `lib/scene/{tv-scene,config,device}.ts`,
  `components/common/scene/`, `utils/scene/{gradient-texture,dispose-object}.ts`,
  `data/mocks/home.ts`, assets `public/assets/hero/TV.glb` (Draco, 6.7 MB) and the
  local decoder in `public/draco/` (ESLint-ignored). Written to the
  [[optimize-3d-scene]] rules from the start — shared ticker, visibility-gated
  loop, per-tier DPR and frame budget, one key light + `RoomEnvironment` IBL,
  `compileAsync` prewarm, no pointer listener on touch or under reduced motion,
  full disposal. Not yet done: a static poster for crawlers / no-WebGL, and any
  measured baseline. Docs: [[scene-3d]].
- **New dependency `three` `^0.185.1`** (+ `@types/three`, dev). Deliberately
  **without** React Three Fiber: R3F v9's JSX augmentation widens
  `animated[tag]` in the `#do-not-modify` spring engine to `never` and produced
  24 type errors there. ADR: [[decisions-log]] ADR-0018. [[tech-stack]] updated.
- **`body` is no longer a centred flex box** — the starter's
  `display:flex; align-items:center; height:100vh; width:100vw` made the
  `ScrollLayout` wrappers shrink-to-fit, so the first page with absolutely
  positioned content collapsed them to zero width and rendered black. `body` now
  carries `background`, `color` and `min-height:100lvh` only. ADR:
  [[decisions-log]] ADR-0019.

## 2026-07-25

- **Released into the public domain (Unlicense)** — the starter now ships a root
  `LICENSE.md` carrying the [Unlicense](https://unlicense.org) and declares
  `"license": "Unlicense"` in `package.json`. Anyone may copy, modify, sell, or
  redistribute it with **no attribution requirement and no copyright retained** —
  the intent being that projects built from this starter can absorb it wholesale
  without carrying a notice. Briefly authored as MIT in the same session and
  changed before any release; the MIT attribution clause was the specific thing
  being dropped, so a recognized no-attribution licence was chosen over an
  edited MIT text. `"private": true` is unchanged, so npm publishing stays
  blocked regardless — the licence governs redistribution of the source, not
  registry availability.

## 2026-07-24

- **`optimize-3d-scene` hardened from its first field run** — the skill was run
  on a real raw-WebGL scene (no three.js, no scroll) and eight gaps came back,
  ranked by the time each cost. Fixed in `SKILL.md` and `references/patterns.md`:
  **§0** now ships a `getContext` hook so a non-three.js scene has counted
  equivalents of `renderer.info` (`draws` / `verts` / `links[]` timestamps /
  captured `attrs`) — previously §0 was unexecutable there — plus the
  *measurement environment* rules that invalidate everything if missed
  (production build only: dev's eager chunks fake a §1 failure and Strict Mode's
  double-mount fakes 2 listeners and a halved fps; kill the stale server;
  `waitUntil: "load"`, since `networkidle0` never fires against `next start`;
  SwiftShader is not a GPU, so only counted quantities transfer). **§3** now
  states that **§1 breaks it** — `dynamic(ssr: false)` pushes compilation past
  hydration, measured at 5.0 s against a loader lifting at 2.36 s — and gains a
  fifth stall cause (CPU decode/parse → **Worker**, 3.9 s measured) and the
  `as="fetch"` preload credentials trap (only `use-credentials` + `include`
  dedupes; the others silently download twice). **§5** admits `1000/30` measures
  ~26 fps given the ticker's `<=` throttle. **§7** requires a decile ordering
  check before truncating a baked point buffer (one was spatially sorted —
  truncating would have deleted half the subject). **§13** splits canvas `lvh`
  from content `dvh`. **§1**'s poster is rejustified — crawler screenshots and
  the no-WebGL fallback, not layout stability — with two crops and the
  `headers()` → static-prerender (`○`→`ƒ`) trade-off named. Unchanged on
  purpose: the cheapest-first order, the canonical-file table, and "port, don't
  invent". ADR: [[decisions-log]] ADR-0017.
- **`optimize-3d-scene` skill registered in the vault** — the new skill at
  `.claude/skills/optimize-3d-scene/` is now a first-class part of the workflow
  set, documented in [[optimize-3d-scene]] and linked from the
  [[README|Map of Content]] and [[ai-agent-guide]].
  **Routing rule (AGENTS.md hard rule #11):**
  a performance / jank / pre-ship request on a project that renders a three.js
  or WebGL scene must invoke the skill and follow its fourteen-step order — no
  improvised fix list. The vault note also maps the skill's canonical patterns
  onto primitives the starter *already* ships, so nothing gets duplicated:
  `subscribeToTicker` (`src/lib/animation/ticker.ts`, ADR-0009) is the one
  app-wide rAF loop the skill's §4/§5 ask for, `isBot()` (`src/utils/is-bot.ts`,
  ADR-0010) is the §1 bot path, the Lenis scroll store is the §9/§10 scroll
  source, `useDynamicInView` is the §4 visibility gate, and `lvh.ts` covers §13
  sizing. Only device tiering (§2) has no local equivalent. The starter itself
  carries **no `three` dependency** ([[tech-stack]] unchanged) — this applies to
  projects built from it. ADR: [[decisions-log]] ADR-0016.
- **Fixed a broken path inside the skill** — its closing "write it down" step
  pointed at `obsidian/Meta/changelog.md` / `decisions-log.md` (capital `M`, and
  an `open-questions.md` that does not exist here), so an agent following it
  would have written to a non-existent folder. Rewritten against this vault's
  actual `obsidian/meta/` layout.
- **`ai-agent-guide` gained a Skills section** — how skills are registered
  (drop in `.claude/skills/<name>/`, add a `workflows/` note, link from the MoC
  and the skills table, log in the changelog), so the next skill follows the
  same path.

## 2026-07-17

- **README — one-prompt quick start** — added a copy-paste **⚡ Start in one
  prompt** block at the top of the README: a single prompt that has Claude Code
  (or Cursor) clone the starter, detach it from this repo's git history, read the
  vault first, and run the default install. The manual [Getting started](../../README.md#getting-started)
  path stays below for anyone who prefers it.
- **Fixed: `cp .env.example .env` broke `/api/contact`** — surfaced by writing
  that step into the quick-start prompt. Copying the example leaves
  `CONTACT_ENDPOINT=` (blank), which reaches zod as `""`, and `""` is not
  `undefined` — so `z.url().optional()` rejected it. The route returned **HTTP
  400 `{"path":"CONTACT_ENDPOINT","message":"Invalid URL"}`**, misreporting a
  *server misconfiguration* as the caller's bad input. `src/env.ts` now routes
  optional URLs through an `optionalUrl()` helper that preprocesses `""` →
  `undefined`. Verified end-to-end: a valid POST now returns 200, and genuinely
  invalid payloads still return 400. Any new **optional** variable must use the
  same helper — see [[environment-variables]].
- **README — corrected clone URL & Node requirement** — step 1 pointed at
  `github.com/textura/next16-claude-starter` (wrong org — the repo is
  `textura-agency/…`), so the documented clone would 404. Also added the Node
  floor (**22.13+**; 20.19+ works, 24 LTS recommended) — below it `yarn install`
  fails outright on `eslint-visitor-keys` — and the missing
  `cp .env.example .env` step.
- **TextEngine alignment & clipping rules documented** — two failure modes that
  bite every TextEngine block, now written into [[text-engine]] (new *Alignment &
  line-height* section), [[text-engine-reference]], and AGENTS.md hard rule #3.
  **(1)** The container renders `display: flex; flex-wrap: wrap`, so words are
  flex items and `text-align` cannot position them — a lone `text-center`
  silently does nothing. Always pair `text-*` with `justify-*` on the tag
  (`justify-between` is a trap: it spreads *words*, not lines). **(2)** `overflow`
  sets `overflow: hidden` on `inline-block` wrap layers whose height comes from
  `line-height`, so tight leading shaves descenders and accented caps — keep
  leading ≥ 1.1 via the new `leading-display` token, never `leading-none` with
  `overflow`, and watch for `text-5xl`+ which ship `line-height: 1`. Both fixes
  are **classes on the `TextEngine` tag** — no wrapper component, no helper to
  import. Verified against the `spring-text-engine@0.1.5` dist source.
- **Strict three-tier token naming convention** — tokens now follow a fixed,
  portable grammar so names are predictable across every project built from this
  starter: `--raw-<category>-<name>` primitives → `--<role>` semantic →
  `--<tw-namespace>-<role>: var(--<role>)` bindings in `@theme inline`. Only
  Tier 1 holds literals; Tier 2 names purpose and is the themeable layer.
  `globals.css` restructured accordingly — **no brand palette invented**, the
  convention is the deliverable. Two deviations from the reference article,
  verified by compiling a probe against `tailwindcss` v4.3.3: primitives are
  `--raw-*` and stay out of `@theme` (a `--color-*` entry would generate
  utilities and let markup skip the semantic tier), and **`--duration-*` is not a
  Tailwind v4 namespace** — `duration-fast` compiles to nothing, so durations
  stay Tier 2 and are used as `duration-[var(--duration-fast)]`. See
  [[decisions-log]] ADR-0015 and [[design-system]].
- **Narrow CSS-transition exception** — hard rule #1 no longer bans CSS
  transitions outright. CSS `transition-*` is allowed for simple discrete state
  changes only (hover/focus colour, opacity, border, small nudges), requiring
  token-backed timing (`duration-[var(--duration-fast)] ease-entrance`),
  `transition-*` only (`@keyframes` still banned), and utilities only. Everything
  scroll-driven, revealing, staggered, or layout-affecting stays spring-based.
  A hover colour fade no longer needs a client component wrapping `<Hover>`. See
  [[decisions-log]] ADR-0014, [[animation-system]], [[design-system]].
- **New tokens** — `--raw-color-white` / `--raw-color-neutral-100/900/950`,
  `--raw-duration-fast/normal`, `--duration-fast/normal`, `--leading-display`
  (1.1 — the TextEngine clip floor), `--ease-entrance`.
- **Build & lint verified clean** — `yarn lint` and `yarn build` both pass with 0
  errors and 0 warnings; no lint fixes were needed. Note: `yarn install` **fails
  on Node 20.17** (`eslint-visitor-keys` requires `^20.19 || ^22.13 || >=24`) —
  use Node ≥ 20.19; this repo was verified on 24.16.

## 2026-06-07

- **Fixed `<Inview>` standalone reveal + spring resize gating** — `<Inview>`
  never animated unless an external `trigger` ref was passed. The JSX `ref`
  callback wrote `inViewRef.current = node`, but that tuple slot is a *callback
  ref* (`setNode`), so the element was never observed and the `node` stayed
  `null`. Now calls `setInViewNode(node)`. This was also a build-breaking type
  error. Additionally, `<Inview>`, `<Spring>`, and `<Hover>` tracked `width` as a
  hook dependency but never passed it to `isMobileDisabled` — fixed by passing the
  tracked `width`, restoring resize re-evaluation and clearing the
  `react-hooks/exhaustive-deps` warnings. `yarn build` and `yarn lint` are now
  clean. See [[decisions-log]] ADR-0013 and [[components/animation-springs]].

## 2026-06-05

- **Home view emptied** — removed the animation showcase (`src/views/home-showcase.tsx`
  deleted) and reduced `HomeView` to an empty `<main>`. The home view is now the
  blank starting point for new work. Documented the convention — *if the project
  is empty and no other instructions are provided, start developing in the home
  view on route `/`* — in [[ai-agent-guide]] and [[new-page]].

## 2026-05-23

- **README — setup + Vercel deploy steps added** — *Getting started* expanded
  into a four-step flow (clone the template → delete bundled `.git` →
  initialise your own GitHub repo → install & run), with a macOS hint for
  revealing the hidden `.git` folder (`⇧ + ⌘ + .`). Added a *🚀 Deploy to
  Vercel* section covering the CLI flow (`vercel` / `vercel --prod`) and the
  dashboard import path, plus an `env pull` pointer to
  [[environment-variables]].
- **README rewritten to lead with the AI workflow** — root `README.md`
  reorganised so the AI usage guide is the first section: how the three
  `.claude/settings.json` hooks (`SessionStart`, `UserPromptSubmit`, `Stop`)
  enforce the vault workflow automatically, how to write a good request
  against this convention layer, and a cost-expectations note recommending
  **Claude Max (5×)** as the minimum plan (the vault-fan-out + hook
  re-injection on every turn is token-intensive by design). Technical
  *Getting started* and the existing AI-agents entry-point pointer stay
  below.

## 2026-05-22

- **Styling-placement convention added** — to stop `globals.css` accumulating
  hundreds of component-specific classes, styling now follows a strict
  placement order: one-offs are Tailwind utilities, repeated patterns become
  **React components** (not `@layer components` classes), and `@layer
  components` is reserved strictly for pseudo-elements and third-party
  overrides. `globals.css` stays bounded — `@import`, tokens, base resets only.
  No CSS Modules. Codified in [[decisions-log]] ADR-0012; [[design-system]]
  (new *Where a style goes* section) and [[component-conventions]] updated.
- **Semantic-HTML / SEO-markup convention added** — new [[html-semantics]]
  rulebook: landmarks, one `<h1>` + heading outline, native elements over
  `div`s, forms/images/ARIA, JSON-LD over microdata, a `data-*` convention, and
  passing a semantic `tag` to animation components. Codified as AGENTS.md hard
  rule #10; cross-linked from [[component-conventions]] and [[new-page]]. Fixed
  the demo (`home-showcase.tsx`) to a single `<h1>` to follow it.
- **API layer added** — a convention for reaching external services.
  `app/api/<resource>/route.ts` Route Handlers own their logic and read secret
  env vars directly (safe — route files never reach the browser). New: `zod`
  dependency; `src/env.ts` (validated env, public/server split); `src/lib/api/`
  (`handle` wrapper + `ApiError` + `{ data }`/`{ error }` envelope);
  `src/lib/api-client.ts` (typed same-origin fetch); example
  `app/api/contact/route.ts`. Codified as AGENTS.md hard rule #9. See
  [[decisions-log]] ADR-0011 and [[api-architecture]].

## 2026-05-21

- **Asset convention added** — site content assets (images, videos) now live
  under `public/assets/<section>/`, one folder per section; meta/PWA/SEO assets
  stay at the `public/` root. Documented in [[folder-structure]],
  [[component-conventions]], and the [[new-page]] playbook; `public/assets/`
  created with a `.gitkeep`.
- **SEO & performance hardening** — a broad pass on the starter. **SEO:** new
  `src/lib/site.ts` config (single source of truth, fed by `NEXT_PUBLIC_SITE_URL`);
  `metadataBase` is now always set (relative OG/canonical URLs resolve);
  `themeColor` moved to a `viewport` export; added `app/robots.ts`,
  `app/sitemap.ts`, and an `Organization`+`WebSite` JSON-LD helper; OG image
  dimensions corrected to match the asset; dead `keywords`/`other` tags dropped.
  **Performance:** populated `next.config.ts` (`removeConsole` in prod,
  AVIF/WebP, `next/image` breakpoints aligned to the grid, `poweredByHeader:
  false`); fixed a `requestAnimationFrame` leak in `ScrollLayout` (Lenis loop
  never cancelled on unmount); `HomeView` is now a Server Component with the
  animation demo split into the `HomeShowcase` client leaf; added
  `<ReducedMotion>` (honours `prefers-reduced-motion` via react-spring's global
  `skipAnimation`); removed a per-frame `console.log` from the demo; added
  `app/loading.tsx` / `error.tsx` / `not-found.tsx`. See [[decisions-log]]
  ADR-0010, [[seo-metadata]], and [[environment-variables]].
- **Animation engine — lint pass** — cleared all 13 pre-existing ESLint problems
  in the engine (2 errors + 11 warnings), an authorized engine edit (ADR-0009).
  `isMobileDisabled` now takes an optional `viewportWidth` argument, so the
  `active` memos in `<Spring>` / `<Hover>` / `<Inview>` / the trigger hooks
  depend on it genuinely. Added missing `disableOnMobile` effect deps; fixed a
  `trigger.current`-in-cleanup hazard in `<Hover>`; ref-stabilised `<Handle>`'s
  transition effects. **API change:** `useProgressTrigger` now returns `progress`
  as a `RefObject<number>` (read `.current`) instead of a render-time ref read —
  no consumer was affected (`<ProgressTrigger>` discards the return).
- **Animation engine — performance refactor** — fixed load issues that scaled
  with the number of animated components. Added `src/lib/animation/ticker.ts`, a
  single reference-counted `requestAnimationFrame` loop; `useLoop` (and all loop
  hooks) now subscribe to it instead of each starting its own rAF. `useWindowWidth`
  / `Height` / `Size` now share one debounced `resize` listener via a
  `useSyncExternalStore` store (the `debounceDelay` param was dropped — unused).
  `useDynamicInView` rewritten without the per-render `Proxy`/observer churn.
  Fixed a stale-closure bug in `useLoop`. `mode="forward"` scroll listeners made
  `passive`. This was an **authorized edit to `#do-not-modify` engine files** —
  hard rule #2 amended. See [[decisions-log]] ADR-0009 and [[animation-system]].
- **`spring-text-engine` updated** — bumped `^0.1.3` → `^0.1.5` (latest). The
  public API, types, and dependencies are unchanged between these versions
  (verified) — an internal-only patch bump, no code changes required.
- **Adaptive scaling grid added** — a root-font-size scaling system landed in
  `src/components/common/grid/` (`<AdaptiveGrid>` + `useAdaptiveGrid` hook +
  `grid.config.ts`), with `vw` media queries in `globals.css` for scale-down.
  It was dropped into `common/` as a `styled-components` system; ported to the
  project stack — config-driven TS + CSS-only Tailwind, no `styled-components`.
  The unused dropped files (`colors.ts`, `fonts.ts`, `utils.ts`, `index.ts`,
  the `styled-components` `grid.tsx`) were removed. Mounted via `<AdaptiveGrid>`
  in the root layout. See [[components/common]] and [[decisions-log]] ADR-0008.
- **Vault created** — `obsidian/` Obsidian vault initialised as the project's
  second brain. Architecture, frontend, and workflow docs populated. See [[decisions-log]] ADR-0001.
- **Root README rewritten** — replaced `create-next-app` boilerplate with a real
  project README that points into this vault.
- **`generic-layout-prompt.md` moved** — relocated from repo root to
  `obsidian/workflows/` as [[generic-layout-prompt]].
- **Navigation convention resolved** — standard `next/link` confirmed; the unbuilt
  `<AnimLink>` / `useAnimRouter()` convention dropped. See [[decisions-log]] ADR-0005.
- **Docs consolidated into the vault** — `project-specs.md` deleted (decomposed into
  vault notes + new [[environment-variables]]); `text-engine-docs.md` moved in as
  [[text-engine-reference]]. `AGENTS.md` rewritten as a thin shim; `.cursorrules`
  repointed to `@AGENTS.md`. The vault is now the single source of truth.
  See [[decisions-log]] ADR-0006.
- **Vault renamed & restructured** — vault folder `getlayers.io/` → `obsidian/`;
  number prefixes dropped from section folders (`00-meta` → `meta`, etc.). Project
  name standardised to **`next16-claude-starter`** across docs and `package.json`.
- **Components linked to docs** — every file in `src/components/` now carries a
  `// 📖 Docs:` pointer comment to its catalog note, so agents can jump from code
  to docs and back.
- **Vault workflow automated** — added `.claude/settings.json` with `SessionStart`,
  `UserPromptSubmit`, and `Stop` hooks that make agents read the vault first,
  follow the relevant guide, and update docs after every change — with no manual
  reminder. See [[decisions-log]] ADR-0007 and [[ai-agent-guide]].
- **Cookie component replaced** — the `react-cookie-consent`-based `cookie.tsx`
  was replaced by an in-house `Cookie/` component (banner + category preferences
  modal + Zustand store). `react-cookie-consent` removed from dependencies. The
  component shipped using `styled-components` + an external design system; it was
  ported to the project stack — Tailwind v4 tokens and `@react-spring/web` motion.
  Mounted via `<LazyCookie>`. See [[components/common]].
- **Fixed TextEngine spring type mismatch** — the `mode="once"` heading in
  `views/home.tsx` mixed `lineIn={{ y: 0 }}` (number) with `lineOut={{ y: "100%" }}`
  (string), throwing *"Cannot animate between _AnimatedString and _AnimatedValue"*.
  Changed to `y: "0%"`. The buggy pattern in [[text-engine]] / [[text-engine-reference]]
  examples was corrected and a type-matching gotcha note added.

## Project baseline (git history)

| Commit | Description |
|--------|-------------|
| `94b0870` | feat: update starter |
| `5280ef2` | fix: linter errors & build |
| `b2b84e6` | initial — `next16-claude-starter` scaffold |

> [!note]
> The starter shipped with: Next.js 16.2, React 19.2, Tailwind v4, `@react-spring/web`,
> `spring-text-engine`, Lenis, and Zustand. See [[tech-stack]] for the current state.
