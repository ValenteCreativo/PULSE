---
tags: [frontend, scene, stable]
updated: 2026-08-06
---

# 3D Scene

The WebGL scene on the home route (`/`): a dark room lit by a wall of CRT
televisions, with an animated figure silhouetted against them, framed from behind
its shoulders. The camera drifts after the pointer and the televisions rise,
turn and hang under it.

> [!important] Plain three.js — **not** React Three Fiber
> R3F v9 augments React's JSX namespace (`IntrinsicElements extends
> ThreeElements`). That widens `animated[tag]` in the vendored spring engine to a
> union of every element, whose props intersect to `never` — 24 type errors
> inside a `#do-not-modify` folder. The scene is therefore written as a plain
> three.js class, which is also the shape the `optimize-3d-scene` skill treats as
> canonical. ADR: [[decisions-log]] ADR-0018.

## Files

| File | Role |
|------|------|
| `lib/scene/tv-scene.ts` | The scene class — renderer, camera, loader, animation mixer, frame loop, disposal |
| `lib/scene/tv-hover.ts` | Pointer picking + the rise-and-turn animation, one spring per stack |
| `lib/scene/tv-screens.ts` | Video on the screens — matches clips to screens by texture name |
| `lib/scene/tv-stacks.ts` | Splits the GLB into pickable televisions and derives which rests on which |
| `lib/scene/tv-carousel.ts` | The ring of works: slots, the turning of it, its own hover pick ([[decisions-log]] ADR-0026) |
| `lib/scene/tv-flyer.ts` | One carousel television — its entrance, its facing, its drift |
| `lib/scene/tv-dust.ts` | Dust in the air: one `Points` cloud, moved entirely in its vertex shader, drawn **outside** the composer ([[decisions-log]] ADR-0025) |
| `lib/scene/tv-crt.ts` | The glass the page is watched through — scanlines, a rolling band and a hair of fringing, as the composer's last pass |
| `lib/scene/tv-sky.ts` | The sky — a dome around the camera with the gradient in its shader ([[decisions-log]] ADR-0024) |
| `lib/scene/tv-signs.ts` | The two lines standing in the fog for the flight to pass through — canvas textures on quads ([[decisions-log]] ADR-0028) |
| `lib/scene/config.ts` | Every tuning number: camera framing, parallax amplitude & spring, hover, lighting, DPR clamp |
| `lib/scene/device.ts` | Device tiering — `isMobile`, `hasFinePointer`, `prefersReducedMotion`, `frameBudget`, `clampedPixelRatio`. The tier follows the **pointer**, not the viewport width ([[decisions-log]] ADR-0023) |
| `components/common/scene/tv-scene.tsx` | Client leaf — owns the container element and the scene's lifetime, and mounts the two overlays that talk to it |
| `components/common/scene/lazy-tv-scene.tsx` | `next/dynamic` `ssr:false` wrapper — keeps three.js out of the server render |
| `components/common/cases/case-panel.tsx` | The carousel section's interface — heading, previous / next, case name, tags and *Explore*, over the `aria-hidden` canvas |
| `components/common/panels/panel-stack.tsx` | The black panels that slide up over the room — and the signal that tells the scene to stop drawing while they do ([[components/common]]) |
| `components/common/scene/scene-controls.tsx` | Development-only tuning panel — bloom, depth of field, atmosphere, lighting; hides itself and copies its values as config |
| `components/common/scene/index.ts` | Barrel — exports **only** `LazyTvScene` (a value export of `TvScene` would undo the code split) |
| `components/common/scene/scene-controls.tsx` | The tuning panel. Development builds only, and **hidden unless the URL carries `?tune`** — its button sat in the corner of every screenshot of the page |
| `utils/scene/dispose-object.ts` | Frees geometries, materials and textures on unmount |

Mounted from [[routing|the home view]]:

```tsx
<LazyTvScene modelUrl={homeHero.modelUrl} className="absolute inset-0 …" />
```

## Assets

- **`public/assets/hero/TV.glb`** (3.8 MB) — Draco-compressed, 60 meshes,
  ~105k triangles, 10 embedded textures, no camera. Extensions:
  `KHR_draco_mesh_compression`, `KHR_materials_emissive_strength` (the screens
  glow). The layout is baked into the export; nothing is transformed at runtime
  except the camera and the hover.
  - **The 15 televisions are the roots named `"1"`…`"15"`**, each with a `screen
    N` child; the floor is `Plane`. Those names are the scene's only contract
    with the model — see the hover section.
  - **The figure** is `Sketchfab_model` → `Jeff.FBX`, four skinned meshes over a
    134-joint skeleton, with one 11.7 s clip (`Take 001`).
- **`public/assets/hero/Videoes/`** — the clips that play on the screens, one
  MP4 per screen texture (`bridge`, `cat`, `chelik`, `color noise`, `hands`,
  `magic`, `noise`) plus a still `.jpg` that the model already carries. Listed in
  `data/mocks/home.ts`; see the screens section below for how they are matched.
- **`public/draco/`** — the Draco decoder copied from
  `three/examples/jsm/libs/draco/gltf/`. Served locally, never from a CDN: a
  third-party round trip on the critical path is what the asset budget cannot
  afford. ESLint ignores the folder (vendored minified code).

> [!note] The figure is black by material, not by lighting
> Its four meshes share `Material_129`, whose `baseColorFactor` is `[0, 0, 0, 1]`
> with no texture, so it renders as a silhouette under any light. Change it in
> the source model, not in the scene code.

## Animation

The GLB's own clip is played through an `AnimationMixer` created in
`onModelLoaded` — every clip in the file, so a re-export with more of them needs
no code change.

- The mixer is stepped with the delta between rendered frames, **clamped to
  50 ms**. Returning to a backgrounded tab otherwise hands it a multi-second
  delta and the figure teleports through most of its clip.
- The frame timestamp is dropped whenever the render loop unsubscribes (offscreen
  or hidden tab), so the gap while the scene was not drawing is not time the clip
  skips through.
- Under `prefers-reduced-motion` the clip is applied once and the mixer is
  released: the figure keeps its authored pose rather than the skeleton's bind
  pose, with no looping motion.
- Disposal stops every action and `uncacheRoot`s the model.

## Atmosphere

The look is built to a reference still: a dark room where the only real light is
the screens. Every number lives in `config.ts` → `environment` / `bloom`.

| Ingredient | How |
|------------|-----|
| Room | Vertical gradient sky, flattening at `backgroundHorizon` into the fog's colour. A **dome around the camera**, not `scene.background` — a texture background is screen space, and its horizon then holds still while the room moves under it ([[decisions-log]] ADR-0024) |
| Haze | `FogExp2`, density `0.075` — depth falls away instead of ending at an edge. `environment.fog.mode` can switch it to linear `Fog` (`near`/`far`), the only variant that can be **pushed off the lens** so the foreground stays clear |
| Screens as lights | Each screen material gets `emissive` white + its own picture as `emissiveMap` at `environment.screenGlow`; that is what the bloom then catches |
| Spill | **Three** `PointLight`s (two cool, one warm low-left), fixed at construction — every real-time light multiplies fragment cost, and changing the *count* recompiles every program. They stand in the clear band **in front of** the wall (z ≈ 3.2), never among the sets: see the warning below |
| Key | One weak cool `DirectionalLight` so silhouettes stay readable |
| Floor | The model ships a white studio floor; it is cloned and darkened at load |
| Lens | `EffectComposer`: `RenderPass` → `UnrealBloomPass` → `BokehPass` → `OutputPass` → `FilmPass` → **CRT** |
| Glass | A last pass that says *cathode ray tube* without announcing itself — see below |
| Vignette | Part of the CRT pass — one falloff, and one the panel can move ([[decisions-log]] ADR-0020, revised) |

**The chain's order is the point, and it is the reverse of the obvious one.**

> [!warning] Bloom must run **before** the defocus, not after
> The first version defocused first, reasoning that the glow should spread out of
> already-soft screens. What that actually does is hand the bloom a frame full of
> defocus discs: a small bright spot becomes a hot blob, the bloom's coarsest
> mips smear it wider, and the result is a fuzzy coloured stain that **swims
> around as the focus racks** — visible as soon as hovering started moving the
> focal plane. With bloom first, it works on a sharp frame and the defocus then
> softens the glow along with everything else, which is also what a lens does.
> Confirmed by dropping bloom strength to zero: the artefact vanished, so it was
> the bloom amplifying the bokeh, not the bokeh itself.

> [!warning] Keep the spill lamps out of the wall
> `environment.spillLights` are point lights with a `distance` falloff, and they
> used to stand *among* the televisions (x ≈ ±2.5, z ≈ −1 → 1.6). A set that
> lifted or drifted on hover then passed within centimetres of one and caught a
> blown-out patch, which the bloom — with a threshold this low — spread into a
> cyan blob hanging over the wall. It reads as a lighting bug and is one. They
> now stand in the clear band between the figure and the front row, where nothing
> ever moves close enough to blow out. Any new light in this scene wants the same
> check: *can a hovered television reach it?*

The grain runs *after* `OutputPass`, so it lands in display space the way film
grain does rather than being tone-mapped with the image. **So does the CRT pass**,
and for the same reason: scanlines are a property of the glass the page is watched
through, not of the light in the room.

### The CRT glass

`lib/scene/tv-crt.ts` is one `ShaderPass` at the very end of the chain, over
every act. Four things (`config.crt`, and the panel's "CRT glass" block for
finding the numbers):

- **Scanlines** — `scanCount` of them down the frame, `scanline` deep.
- **A vignette** — the tube's corners falling off, `vignette` deep. Elliptical
  rather than round, so it follows the frame instead of cropping a circle out of
  it, and squared so the middle is untouched and only the outer third darkens.
  **This is the only vignette now**: the CSS pseudo-element that used to do it
  ([[decisions-log]] ADR-0020, revised) is gone, because two stacked falloffs are
  hard to reason about and a gradient in a stylesheet is not something the tuning
  panel can move.
- **A rolling band** — the slow bright drift of an unsynced set, `roll` bright at
  `rollSpeed` screens per second. Wide and soft: a sharp band is a bug, a broad
  one is a memory.
- **Colour fringing** — `chroma`, and only at the edges, because a lens is sharp
  where you are looking and splits colour at its corners.

> [!warning] The lines are a **count**, not a pitch — and it took two goes
> A pitch in *device* pixels was the first attempt: two of them is under a pixel
> of the page on a dense display, so the lines flattened into a uniform dimming
> and the effect was invisible. A pitch in *page* pixels was the second, and is
> still wrong: a fixed number of pixels is a shrinking share of a growing window,
> so the lines read on a small preview pane and vanish on a full display — which
> is exactly how it was reported the second time. A **count** down the frame —
> the way a tube has a line count — keeps them the same share of the picture
> everywhere. `uResolution` survives only to cap it: the shader clamps the count
> so the pitch never falls under ~2 page pixels, which is where lines turn into
> moiré on a short window.

Two things sit outside it, both deliberately: the dust, which is drawn after the
composer ([[decisions-log]] ADR-0025), and the finale's black, which is a DOM
layer over everything. Neither wants scanlines — one is in front of the glass and
the other *is* the glass going dark.

| Pass | Why |
|------|-----|
| `UnrealBloomPass` | Threshold `0.58` — above the room and below the screens, so **only the screens bloom** — with a wide `knee` so the cut is not a hard edge, radius `1` so the glow spreads off them, `fine` at `0` so the sharpest blur levels are muted (that is the one that draws outlines), and a strength (`0.18`) that can then be a strength. |
| `BokehPass` | The figure stands ~1 unit from the camera against a wall 3–10 units back, so focusing past it (`depthOfField.focus`) is what leaves it soft-edged. **Hovering pulls focus** — see below. Costs a second scene render for depth, so it is **skipped on the mobile tier**. |
| `FilmPass` | Grain over the finished frame (`grain.intensity`). |

> [!warning] The defocus ceiling is in **pixels**, because its artefact is
> A defocused edge coming apart into ghost copies of itself was reported as *"the
> bloom is broken"* twice, and the second time it was not the bloom at all: three's
> `BokehShader` is a **fixed 41-tap ring pattern**, and its `maxblur` is in UV. A
> UV ceiling is a *wider* blur the bigger the window, so past roughly ten pixels
> of radius the taps stop overlapping and each one draws its own copy of the edge.
> That is why it showed on a full browser window and not in a small preview pane —
> the same number, two very different pixel spacings.
>
> `depthOfField.maxBlur` is therefore a ceiling in **page pixels** (`22`),
> converted to UV on every resize (`writeMaxBlur`). Reproduced and bracketed on
> one frame: at `70` the ghosting is unmistakable, at `40` it is visible, at `22`
> it is gone. The cost is an honest one — a large window now gets *less* defocus
> than it used to, which is the price of the taps staying overlapped. Buying more
> blur means a bokeh with more taps, and that is fill rate.

**Bloom strength and threshold move together**, and the threshold is the one that
decides whether this is a bloom at all.

> [!warning] A threshold near zero is a veil, not a glow — it was shipped once
> The first tuning let *everything* through (`0.08`) and compensated with a low
> strength (`0.09`) and a wide radius (`1.5`), on the reasoning that an even bleed
> across the room is what a dark room lit by screens looks like. What it actually
> does is take every pixel of the frame, blur it enormously and add it back: the
> blacks lift, the picture goes milky, and anything bright that is also **out of
> focus** — the bokeh pass runs right after — turns into a shapeless bright blob
> with no object under it. It was reported as *"the bloom is working
> incorrectly"*, and it was. Isolating it is one slider: at strength `0` the frame
> came back clean, which is how the threshold was ruled in as the cause rather
> than the depth of field.
>
> The threshold has to sit **above the room and below the screens**. In this scene
> that is `0.58` in linear space; the screens carry `screenGlow` emissive and land
> well above it, the lit walls and floor well below. Move `screenGlow` and this
> moves with it.

> [!warning] The outline is the **sharpest mip level**, and nothing else removes it
> Fixing the veil left something that still was not a bloom: a bright rim tracing
> every screen's edge, with the room beyond it untouched. Softening the threshold
> (`knee`) and widening the `radius` both help and **neither is the cause**.
>
> `UnrealBloomPass` adds five blurred copies of the bright parts, from
> half-resolution down to a thirty-second. The half-resolution one is barely
> blurred at all — it is essentially the screen's own bright rectangle, laid back
> over itself a pixel or two wide. That is the outline, and no threshold or radius
> setting can talk it out of being sharp, because `radius` only re-weights the
> levels and the level itself is the problem.
>
> `bloom.fine` mutes it: `0` sets the pass's `bloomTintColors[0]` to black and
> holds the quarter-resolution level at a floor, leaving the wide levels that
> actually look like light in a room. Verified by A/B at the same frame — at
> `fine 1` every set on the wall is outlined; at `fine 0` the outlines are gone
> and the glow stays. Confirmed as the bloom's doing first, by dropping strength
> to `0` and watching the rims disappear with it.

Earlier attempts at the other end: at `0.62` with `screenGlow: 1.5` the whole
frame bloomed into milk; at `0.78` only two or three screens glowed at all. If you
want a punchier glow, raise the strength
first.

> [!important] Fog does not touch the background — that is where the horizon
> seam comes from
> `scene.fog` colours geometry only. The floor therefore fades toward the fog
> colour while the sky behind it keeps its own, and their meeting point draws a
> hard line across the frame — exactly the seam that "just add more fog" can
> never hide. Three things close it, and all three are needed:
> 1. the sky's **bottom stop is the fog colour**, and the gradient **flattens**
>    at `backgroundHorizon` so it cannot drift away from it further down;
> 2. the floor is **scaled by `floorScale`**, pushing its far edge past the
>    distance at which the fog has gone opaque — at the shipped size that edge
>    sat where the haze was only part-way there, and a visible edge is a line;
> 3. retinting the fog in the panel **drags the sky's bottom with it**, unless
>    the same change sets the sky explicitly. Otherwise tuning the fog colour
>    re-opens the seam a minute after it was closed.

**A pure-black figure needs a lit background.** The character's material is
`baseColorFactor [0,0,0]`, so no light will ever touch it — its silhouette can
only read against what is behind it. That is why the fog and sky colours are
lifted off black (`#17242c` / `#1b2a33`) rather than being as dark as the
reference's shadows suggest.

**Tone mapping is applied once.** three skips the tone-mapping chunk when a
material renders into a render target, so `RenderPass` outputs linear and
`OutputPass` does the ACES conversion at the end. Setting
`renderer.toneMapping` is still correct with a composer in place.

> [!note] The vignette is CSS
> `.scene-vignette::after` in `globals.css` (a pseudo-element overlay, which is
> what `@layer components` is for — ADR-0012) over the scene's section. A
> composited radial gradient costs nothing per frame; a `ShaderPass` would be a
> full-screen pass every frame for the same picture. ADR: [[decisions-log]]
> ADR-0020.

Measured at 800×450 with the full five-pass chain, fog, three lamps and seven
videos running: 16.7 ms per frame, p95 17.3 — the composer did not show up in
frame time on a desktop GPU. The composer's pixel ratio is clamped from the same
`clampedPixelRatio` as the renderer; on mobile the bloom's strength and radius
are halved (`bloom.mobileScale`) and the depth-of-field pass is dropped entirely.

## Tuning panel (development only)

`<SceneControls>` renders a slider panel over the scene for the values that are
pure taste:

| Group | Controls |
|-------|----------|
| Bloom | strength, radius, threshold |
| Depth of field | focus (the **resting** plane the rack focus returns to — the slider sets it directly rather than easing, since a drag is the user driving the lens), aperture, maxBlur |
| Atmosphere | fog mode, then either density (`exp2`) or near/far (`linear`); exposure, grain, fog colour, sky top, sky bottom |
| Lighting | screen glow, environment intensity, key light |

**"Atmosphere" rather than "fog" on purpose.** `FogExp2` has exactly two knobs of
its own, and neither of them reads right alone: the haze is judged against the
sky it fades into, the exposure it is read at, and the screens' own brightness.
Tuning them in separate places means tuning them blind.

> [!warning] Fog has no shift in `exp2` mode — that is what `linear` is for
> `FogExp2` thickens from the lens outward; there is no distance at which it
> starts, so nothing can hold the foreground clear. Linear `Fog` has `near`
> (the shift) and `far`. **Switching mode swaps the fog object, and the fog type
> is a shader define — every material in the scene recompiles.** That is fine for
> a panel and unacceptable per frame, so the setter only rebuilds when the mode
> actually changed; density, near and far are written in place.

It opens **shut** — the panel is for finding values and the shot is what the page
is for, so the default is one button in the corner. The header carries **hide**
(collapses it back to that button, so the frame can be judged unobstructed) and
**copy config** — `scene.settings.snippet()`
returns the current values as a block that pastes straight into `config.ts`. The
snippet is built in the scene, not the panel, because it needs the fields the
panel never touches (the key light's position and colour, the mobile bloom scale,
the focus spring) or it would not compile where it lands. Copying tries the
selection path first and the Clipboard API second — the modern API's permission
prompt can leave its promise **pending forever** in an embedded browser, which
swallows the click entirely — and if both are refused the snippet is shown in a
textarea to select by hand.

It writes straight into the live passes through `scene.settings`, so dragging a
slider is a uniform write — rebuilding a pass instead would drop its render
targets and recompile its shader on every frame of the drag. The sky's two colour
pickers are uniform writes too, now that it is a dome rather than a repainted
canvas texture ([[decisions-log]] ADR-0024).

**"CRT glass"** is four sliders for the pass above — the whole point of it is a
strength found by eye at the threshold of notice, which is not a number anyone
guesses right in a file.

**"Final shot" is numbers rather than sliders**: `television` and `figure`, each
with a `position` and a `rotation` track, each track a `from` → `to`. Positions
are world coordinates, rotations world-axis offsets in radians. A slider needs a
range, and neither a coordinate in a room nor an offset from an unknown starting
angle has one. They are only worth touching with the scroll parked in the
epilogue, which is the only place they are visible.

> [!warning] The lens is anchored to the television's `from` — so moving that moves the shot
> The camera's whole blocking hangs off the television's starting place: the
> pull-back begins in front of *that* glass and ends at `cameraOffset` from it.
> Nudge the set's `from` and the lens follows, which is usually what you want and
> is also how the figure gets left behind — its coordinates are world, so they do
> **not** follow. A subject whose `to` ends up behind the lens simply disappears;
> that is what a `z` of −6.15 did with the camera ending at −11.15.
>
> ---
>
> The anchor is the television's `from`, not where it *is*
> The camera's pull-back is measured from the glass — and if that is read live,
> the camera follows the set everywhere it is dragged and moving it changes
> nothing on screen. The anchor is therefore the live glass with the set's own
> displacement (`current − from`) taken back out. Derived every frame rather than
> remembered: the remembered version needed a first frame to measure on, and the
> frame it picked was one where the finale had not written a glass position yet —
> the whole shot opened somewhere back in the room.

The panel is a place to *find* values, not to keep them: once a number is right,
copy it into `lib/scene/config.ts`, which is what actually ships. `copy config`
includes the final shot's four coordinates.

> [!important] It must never reach production
> The `process.env.NODE_ENV === "development"` check guards the `dynamic()` call
> itself, not just the render. A production build folds it to `null`, the
> `import()` becomes unreachable, and the panel leaves no chunk at all — verified
> by grepping `.next/` after `yarn build`. Guarding only the JSX would still emit
> a chunk (the lesson `optimize-3d-scene` records about shipping `lil-gui`
> "hidden": it is still parsed and evaluated). ADR: [[decisions-log]] ADR-0021.

## Screens — video

Each `screen N` quad plays the clip **named after the texture the model already
has on it**: `cat.mp4` replaces the texture named `cat`. The mapping therefore
lives in the model — re-assigning which television shows what is a change in
Blender, not in the code — and a screen whose texture has no matching file keeps
its still image (one screen does exactly that). The list of files is content, so
it sits in `data/mocks/home.ts` and reaches the scene as a prop.

- **One `<video>` and one `VideoTexture` per file, not per screen.** Three
  screens share the `color noise` texture; they share one decoder too.
- **A screen is either named like one or wearing a clip's texture.** The name
  rule alone was not enough: television `15`'s screen kept its exported name
  (`defaultMaterial.057`) when the rest were renamed in Blender, so it sat there
  as a still picture — and unlit — among playing neighbours. Matching on the
  texture name catches it without the model having to be renamed again.
- **`screenVideoOverrides` beats the name match**, keyed by the number in the
  `screen N` name. It exists for the case the name match cannot express: screens
  `2`, `5` and `12` share one still texture and only `12` should play. Overrides
  are content too, so they live in `data/mocks/home.ts`.
- **Each `VideoTexture` is named after its clip.** The still it replaces carried
  that name, and anything identifying a screen by what it is showing — the
  [[#Scroll — the camera flies over the wall and a carousel assembles|carousel]]
  picks its source that way — would lose the thread the moment the video is
  swapped in.
- **Screen materials are matte** (`roughness 1`, `metalness 0`,
  `envMapIntensity 0`). They are lit from inside, so a specular response is pure
  liability: it catches the room's point lights and drops a hard white blob on
  the picture, which reads as a bug rather than as reflection.
- **A screen that gets a clip gets its own clone of the material**, because the
  export shares eight materials across fourteen screens — writing the texture to
  the shared material would change every screen using it.
- **`texture.flipY = false`**, matching what GLTFLoader does to the model's own
  textures; a `VideoTexture` defaults the other way and plays upside down here.
- **`muted` + `playsinline`** — muted is what makes autoplay legal, `playsinline`
  stops iOS Safari going fullscreen on play.
- **Playback follows the render gate**: offscreen or hidden tab pauses every
  decoder, not just the drawing. Disposal releases them (`src` removed +
  `load()`), not merely pauses.
- Spaces in filenames are encoded on the way into `video.src`.

> [!warning] Node names are sanitised on load
> The GLB calls the quads `screen 13`; GLTFLoader rewrites that to `screen_13`,
> so the matcher accepts both (`/^screen[\s_]*\d+$/i`). Anything matching GLB
> names against the scene graph has to allow for this.

Measured at 800×450 with all seven clips playing: 16.7 ms per frame, p95 17.2 —
unchanged from the scene without video on a desktop GPU.

> [!note] `#todo` Seven decoders is a mobile risk
> Nothing tiers this yet: a phone gets the same seven video streams as a
> workstation. Before shipping, cap the number of clips on the mobile tier (see
> [[optimize-3d-scene]] §7) and re-measure on a real device.

## Scroll — four acts

The home section is `840lvh` tall and the scene sticks to the top of it: the extra
height exists only to give the scroll something to be measured against, and the
canvas never leaves the frame. **Four acts share it**, each with its own window
of that progress, each cut out with the same `phase(value, [from, to])` helper so
it can think in its own `0`–`1`:

| Act | Window | What happens |
|-----|--------|--------------|
| Flight | `scroll.flight` | The camera flies dead level, straight forward through the wall and out the far side; the figure dissolves; the sky turns over |
| Carousel | `scroll.carousel.entrance`, then still | Five televisions come at the lens out of the fog and settle onto a ring. The camera holds; the ring's buttons are on screen and can be turned |
| Hand-over | `scroll.finale.range` | The front set squares up and stills; the room **dissolves into the team panel** under a wave of pixels rising up the window. The lens does not move |
| Covered, then the last shot | `scroll.epilogue.hold`, then `.reveal` | The scene stops drawing while the panels carry the page's sections past. Then the **last panel dissolves off** as the lens pulls back off the glass into the closing blocking: the figure at one edge, the set at the other |

> [!important] Every one of these windows is mapped **linearly**
> `phase(value, [from, to])` and nothing else — the acts used to run through a
> smoothstep each, which put a crawl at both ends of every transition and, where
> the flight's two legs met, a complete stop in the middle of the flight. The
> windows are wide rather than eased. See [[decisions-log]] ADR-0033.

The flight **ends well before the scroll does**, and that is the point: a
carousel with buttons needs a stretch where the camera is not moving, the panel
needs room to rise, and it has to stay up long enough to scroll two sections
past.

> [!important] The act windows are shares of the whole page, so the height and
> the windows move together
> Every window in `scroll` is a fraction of the section's scroll, not a distance.
> Change `h-[840lvh]` in [[routing|the home view]] and every act stretches with
> it — which is right — but the *relative* lengths only stay right if the
> fractions are rescaled too. That is what happened when the epilogue was added
> (420 → 700 lvh, every earlier window multiplied by 0.6), and again when the
> hand-over between the two black panels was asked to be three times longer
> (700 → 840 lvh: every act was rewritten to keep the page distance it had, and
> **all** the new height went into `epilogue.hold`, which went from 560 to 1680
> page pixels at that height).

Within the flight:

- the camera **flies dead level, straight forward** (`scroll.dolly`, negative;
  `scroll.rise` is `0`), through the wall and out the far side of it;
- the **figure dissolves** on the way (`scroll.figureFade`), because a level
  course runs straight through it;
- the **sky turns over** from `environment.backgroundGradient`'s top colour to
  `scroll.skyTop`, and back again under the panels, so the last shot opens on the
  colour the first one had;
- and **two lines of copy stand in the fog** for the lens to pass through — one
  large and near, one small and further back, at different depths so the near one
  sweeps by while the far one is still ahead. That parallax is the effect; a DOM
  overlay has one depth and cannot do it. They are canvas textures on quads
  (`lib/scene/tv-signs.ts`, [[decisions-log]] ADR-0028), so they take the fog, the
  defocus and the grain like everything else, and the near one is properly
  occluded by the sets it lifts out from behind.

  The strings and their placement are **content** (`flightSigns` in
  `data/mocks/home.ts`); only the look of them — colour, fade distances, opacity
  ceiling — is in `config.signs`. They fade on **how far ahead of the lens they
  still are**, not on scroll: passing is what the fade belongs to.

  Each line has **its own `fadeIn`**, because the two must not arrive together:
  the near one is up and already going past by the time the far one starts to
  show. That is what makes the pair read as depth rather than as a caption.

  > [!warning] Distance alone put words across a frame full of televisions
  > A line lifts out of the fog six units ahead of the lens, and six units ahead
  > of the lens is still *inside the wall* for most of the first act. Both lines
  > therefore stand in the **corridor past the wall** (z −7.6 and −9.3, with the
  > last row of sets at −4.6), and a second factor — `signs.clearOf`, a ramp on
  > the camera's own Z — holds everything at zero until the lens is clear of that
  > row. A ramp rather than a threshold, so the gate opens without a pop.

Camera travel is **smoothstepped** (`3t² − 2t³`): still at both ends, so the
opening of the scroll is a drift rather than a launch — which is also the room
the figure's fade needs — and the end of the section is an arrival rather than a
lens that was still travelling at speed when the scrollbar ran out. `progress²`
was the first attempt and fails on the second half of that.

**And the flight changes gear half way** (`scroll.flightSplit`): two thirds of
the dolly — as far as the wall's last row — in the first 40% of the flight's
scroll, and the five units of empty corridor past it over the other 60%. One
curve across the whole thing spends nearly all of the scroll among the
televisions and crosses the corridor in a blink, which is why the lines standing
in that corridor *appeared* instead of lifting out of the fog: each emergence had
about 120px of scroll. It has three times that now. Both halves are
smoothstepped, so the join is a change of pace and not a change of speed.

The corridor could not simply be made longer instead: the ring is placed off the
end of the dolly and the last shot is blocked against it in **world**
coordinates, so lengthening the flight moves both — and the dust box and the
floor with them. Spending the scroll differently costs one function.

> [!note] `figureFade` follows the first gear
> The lens reaches the figure sooner now — about a fortieth of the way into the
> scroll rather than a fourteenth — so the fade window moved with it. Anything
> that changes `flightSplit.at` has to check that one.

> [!warning] There is no level course *around* the wall — only through it
> Flying forward at eye level puts the lens inside the wall: it spans
> z ≈ +2.5 → −4.6, so everywhere in front of the camera is among the sets. Two
> answers were tried. Climbing over them (`rise`) works and was rejected — the
> shot wanted a level flight. Flying far enough forward to come out the **far
> side** is what shipped: the corridor at x ≈ 0 is clear (the nearest set's edge
> is ~0.75 away), so the only thing in the way is the figure, and the figure can
> be faded. `dolly` has to be long enough to clear z ≈ −4.6 with room for the
> carousel beyond it — and then some: a flight that stops just past the last row
> leaves the opening scene's sets in frame *behind* the carousel, which reads as
> two rooms overlaid rather than one journey. It now ends at z ≈ −9.4, with every
> television of the wall behind the lens.
>
> Lengthening `dolly` moves `figureFade` too: a longer flight covers the metre to
> the figure in a **smaller** share of the scroll, so the fade window has to be
> pulled earlier to still finish before the lens gets there.

> [!note] The fade flips `transparent` once, at load
> `transparent` is a shader define; turning it on mid-flight recompiles the
> material at the moment the camera is closest to it. The four figure meshes
> share one material, so one opacity covers all of them.

Everything is a pure function of progress, so the flight scrubs both ways —
there is no "played already" state to get out of sync with the scrollbar. Each
member waits out its own `delay` share of the scroll before it starts, which is
what makes the carousel assemble piece by piece rather than snap into place, and
swings through an `arc` on the way so the flight reads as a flight.

**Each member's own progress is smoothstepped too, and for the `delay`'s sake.**
An ease-out leaves the mark at full speed, so a set whose share of the scroll
opens a third of the way down the page visibly *jumped* into motion the frame its
delay passed. Zero velocity at both ends is what makes five entrances on five
different delays read as one continuous move.

**They start deep in the fog, not off-frame.** Each `fromOffset` puts its set
**20 units** *behind* its resting place — over 30 from the opening camera, where
`FogExp2` at `density 0.075` leaves ~0.06% of it showing. That decides the
entrance: every set arrives by coming **toward** the lens out of the murk, which
is the one direction that reads as depth rather than as objects being placed.

**And they are not drawn at all before their `delay`.** Distance and haze were
tried alone, and 3% of transmittance was enough for a dark set against a lit sky
to ghost through — visible in the first scene, which is exactly what it was there
to prevent. `visible` now follows the member's own progress. The toggle is safe
because it happens while the set is twenty-odd units deep in the fog, and safe
for the shader cache because the material belongs to the wall original, which is
still being drawn. The `delay`s themselves were pushed back to the **second half**
of the scroll for the same reason: nothing of the carousel exists until the wall
is behind the lens.

**Each member is a clone of a television already in the wall**, chosen by the
texture its screen wears (`screenTexture` — `magic`, `cat`, `bridge`, `hands`,
`chelik`; the noise loops are deliberately not used). Cloning shares geometry and
material, video texture included: one extra draw call each, no second decoder,
and they play in step with the originals. They are added to the scene rather than
the model, so hover picking and stack detection never see them.

### The carousel is a ring

`TvCarousel` owns the members and one number: how far the ring is turned. A
member's **slot** is the signed distance from its fixed index to the front,
wrapped into `±count/2` — so `turn(±1)` is `target += step` and nothing else.
There is no list of "which set is where", no re-ordering, and looping is not a
special case: it falls out of the wrap. ADR: [[decisions-log]] ADR-0026.

The slot is *continuous*, so the rotation sits on a spring (`rotateSpring`) and
every member slides to its new place together.

**Where a slot stands** (`positionOf`) is a line across the front, `spread`
apart, that peels away past a slot distance of 1.5 and runs back to a single
point `fogDepth` behind the ring. *Both ends of the ring meet at that point*,
which is the whole trick: the wrap is continuous **and** invisible.

**The line is flat** — `bulge` is `0`, so every set stands at the same distance
and the same height, and the only thing that differs between them is the angle
each is turned through to face the lens. An arc that leaned the edges toward the
camera was tried first and reads as a jumble: the neighbours came out at
visibly different sizes, which the eye takes for a mistake rather than a curve.

**Only three sets are ever drawn.** `hideBeyond` is `1.5`, so the front one and
its two neighbours exist and nothing else does — a set further round the ring
would otherwise sit *behind* the line, small and half-lost in the haze, and read
as clutter behind the work rather than as more of it. A member crossing that
threshold does so at x ≈ ±4.5, off the side of the window on anything narrower
than about 21:9, so the toggle is never seen.

> [!warning] `hideBeyond` must not reach past the start of the curve-away
> It was `1.6`, a tenth of a slot onto the curve, and that tenth was enough to
> make the edges twitch on every turn — the curve packs a twenty-unit run into
> one slot, so a set on it covers **a quarter of a unit per frame**, and the
> boolean that hides it was flipping while it was still in shot. Measured by
> projecting each member to NDC across a turn: the flip was landing at
> x ≈ −0.35, the middle of the frame. At `1.5` the same measurement puts every
> flip at x ≈ ±1.61 — well outside the window — and the largest per-frame step
> drops from 0.27 world units to 0.14, which is just the slide.

`spread` is wide (3 units) and `scale` is 1.6, so the front set carries the shot
and the neighbours are cut by the window on either side, reading as a strip that
continues past both edges.

**Hovering a member lifts it**, the same gesture as the wall's, on its own spring
per member (`carousel.hover`). The ring runs its **own** raycast rather than
[[#Hover — a television rises when you point at it|the wall's]]: these clones live
outside the model, deliberately invisible to that pick, and a ring has no stacks
to resolve — one set is one set. The wall answers first; the ring only picks when
the wall found nothing, which by then is always, because the wall is behind the
lens.

**Previous / next are DOM**, not geometry — `<CasePanel>`, real `<button>`s that
take focus and answer to a keyboard, as siblings of the `aria-hidden` canvas
([[components/common]]). The scene reports when they are worth showing: from just
before the ring finishes assembling until the finale takes the scroll over. It
also reports **which work is at the front** (`onCarouselIndex`, fired from
`turnCarousel`), so the panel can name it: the ring wraps, and one owner of that
arithmetic is enough. The names line up with `scroll.carousel.members` **by
index** — the two lists are a contract.

**The sky turns over as the flight goes**, blended from the opening colour to
`scroll.skyTop`, **every frame**. It is two uniforms on the dome's shader — see
[[decisions-log]] ADR-0024 for why it used to be quantised into 48 steps, and why
that was the cheaper of the two things a canvas-texture sky forced.

> [!warning] Two traps in aiming the clone, both already paid for
> **Rotation must go through quaternions.** These nodes' Eulers carry `x` and `z`
> at π rather than being a plain turn about Y, so adding a yaw to `rotation.y`
> and writing all three angles back lands the set on its back. The flyer keeps a
> quaternion and pre-multiplies the flight's tilt in world axes.
>
> **Which way a television faces comes from its screen's normals.** The first
> attempt used the offset from the set's centre to the screen's, which is 180°
> wrong: a CRT's bulk sits behind the glass and drags the centre back with it.

Scroll progress is read **once per frame inside the render loop** and low-passed
(`scroll.smoothing`), with a jump past `scroll.snapAbove` taken whole so an
anchor or a restored position does not crawl. This is the one value in the scene
that is not spring-driven: a spring lags the thumb and overshoots a flick, which
reads as the scene arguing with the user. ADR: [[decisions-log]] ADR-0022, and
`optimize-3d-scene` §9–§10.

### The finale — the room is covered, not entered

**The zoom is gone.** This act used to drive the lens into the front television
until the glass was the whole frame, with the picture crossfading to noise under
it; the hand-over to the team block is now a **pixel dissolve** up the window
([[components/common]]), and a push-in behind something opaque is motion nobody
sees. What the act still does:

- the front set **squares up to the lens** — the entrance's rotation offsets and
  the whole levitation are scaled to zero, so nothing is drifting when the panel
  passes over it;
- the **pointer parallax lets go** (`steer = 1 - finale`);
- **black closes under the panel** — a DOM layer rather than a pass, a flat fill
  over the finished frame where a fullscreen quad through the composer would cost
  a render target to do what one `div` does for nothing. It is a guarantee rather
  than a transition now: the panel is opaque, and this only makes sure nothing of
  the staging behind it can leak at an aspect the panel does not quite fill. The
  scene writes its opacity straight to the element through a callback and a ref;
- and it **works out the framing the epilogue pulls back from**, which is the
  reason the act survives at all: where the glass is, and how far off it a lens
  would have to stand for the glass to be the frame — half the glass over
  `tan(fov/2)` vertically, over `tan(fov/2) · aspect` horizontally, **the nearer
  of the two**, all divided by `fill`. Measured, not travelled.

### The epilogue — the shot the black opens onto

The panels hold over `scroll.epilogue.hold` with the scene doing nothing at all —
in fact **not drawing at all**, since nothing of it can be seen — and that
stretch exists to be scrolled through with **page sections over it**. The staging
has to be finished by the end of it: what comes next uncovers this shot rather
than fading up onto it. Then `scroll.epilogue.reveal` **starts with the last
panel's dissolve**, so the pixels clearing and the lens drawing back are one
move rather than two, and what is behind is not a cut:
the lens **pulls back off the front set's glass**, drawing away and to one side
until the set is at one edge of the frame, turned a quarter away, with the figure
close at the other.

**Nothing is built for this shot; it is staged out of what is already there**,
while the panels are over it and no one can see it happen — see
[[decisions-log]] ADR-0027.

> [!important] It is framed like the **first** shot, not lit like a portrait
> This act used to borrow two of the room's spill lamps, lift the figure's
> material off pure black and lift the floor's with it, and add a pitch of its
> own. It made a handsome studio portrait that looked nothing like the rest of
> the page. All of that is gone: the same haze, the same sky, the same pure-black
> silhouette against whatever is brighter — here the glass beside it — and **the
> defocus comes back on** for it (`focusFade` reopens over the reveal), because
> the soft foreground is half of what the opening shot looks like. The one thing
> the act still does to the framing is `roll`: the horizon off level.

- **The screen is the call to action.** `/assets/CTA/CTA-TV.png` is hung on the
  set the lens pulls back from while the staging runs — i.e. **under the black**,
  the same cover the figure is walked across the room under, so no crossfade is
  needed or wanted. The clone shares its materials with the television it came
  from, so the first swap clones the material rather than writing to the shared
  one; otherwise the set in the wall carries the call to action too, which is the
  kind of thing you only see after scrolling back up. It is lit at **an eighth**
  of the wall's glow: the videos are mostly dark and this still is nearly white,
  and at the wall's setting the bloom ate the words printed on it. Hovering it
  puts *Something is on next* on the cursor, on a pick of its own —
  `TvCarousel.pickFront` answers the question **without lifting the set**, which
  the ring's ordinary pick would, undoing the blocking.
- **The hover opens the set toward the lens.** Its `to` rotation has it a quarter
  turned away; a pointer on it takes `CLOSING_TURN` of that back and lifts the
  picture's glow with it, both on one spring. The set is picked on its own
  (`TvCarousel.pickFront`) — the ring's ordinary pick lifts what it finds, which
  would undo the blocking.
- **The page is told where the set is.** `onClosingShot` fires every frame of the
  act with the reveal and an `edgeAt(y)` — where the television's left side falls
  at a given height on screen, found by casting rays at the set and cached until
  the scroll or the hover moves. That is what the rule under the closing words is
  cut to; see [[components/common|`<ClosingCopy>`]] for why it cannot be a
  z-index. It is reported **after** the carousel has been placed for the frame:
  a frame earlier in the loop the set is still wherever the last one left it.
> [!important] The last shot is built on **one fixed television**
> `carousel.closingIndex` names it, `TvCarousel.closing` returns it, and the
> epilogue dresses, places, picks and measures *that* set — never
> `carousel.front`. The members are clones of different televisions: a deep 4:3
> CRT, a flat widescreen one, glass of different sizes, some mirrored. Since
> `finaleDistance`, the lens's anchor and therefore the figure's place are all
> measured against that glass, staging the shot on whichever case the visitor
> stopped on gave a different shot every time — the picture cropped on the
> widescreen set, the television a different size, the figure somewhere else in
> the frame. See [[decisions-log]] ADR-0035.
>
> One thing that comes with fixing it: **the staged set is never hidden by its
> slot**. `slot` is measured from whichever case the ring was turned to, and
> anything past `hideBeyond` is dropped from the draw — so a few turns put the
> closing television round the back of the ring and the last shot lost it
> entirely, and with it the only thing the figure reads as a silhouette against.
> Its slot means nothing once it has been *placed*.

> [!warning] Some sets show their picture **reversed**, and the test for it is
> about the image, not the transform
> Turn the ring by one and the closing screen read `tɔejorꟼ a tratꙄ`. Noise and
> abstract footage never showed it; a picture with words on it does.
>
> The first fix looked for a negative scale — the usual cause — and did nothing,
> because that is not what this model does: the sets that read backwards have a
> perfectly ordinary **positive** determinant (measured: `3661.9984`, uniform
> world scale, UVs a clean `0…1`). Whatever the modelling reason (a quad wound
> the other way, a mirrored UV island, a set presenting the back of its glass),
> no matrix test can see it.
>
> `TvFlyer.screenReadsMirrored(camera)` asks the question that actually matters:
> take three of the screen's own vertices, project them, and compare the winding
> of that triangle in NDC with the winding of the same three points in UV space.
> Disagreeing windings mean the picture arrives reversed, whatever put it that
> way. `setScreenStill` then hangs a `repeat.x = −1` **clone** on those sets —
> clones share the image, so it costs no second upload — and the answer is
> re-asked each frame the shot is up, because when the set is first dressed it is
> still being carried into place under the black.

> [!important] The figure's sideways place is **derived**, and derived from
> things that do not move
> He stands under a metre from the lens, which makes him the most
> shape-sensitive thing in the shot: the frame's width changes with the window
> and a world offset does not, so the numbers that put him at the left edge on
> the design's window put him off a laptop's and clean off a phone's. His offset
> is measured from where the lens would stand on the **design's** window — the
> live lens already carries the aspect, and anchoring to it scaled the scaling
> twice and walked him into the television on 21:9 — and then scaled by
> `figureFollowsFrame`. `figurePortraitBias` can walk him toward the edge on
> shapes narrower than the design's; at the current blocking it is measured at
> **zero**, because a phone already keeps both him and the screen.
>
> Everything in that sum is a function of the **window shape alone**. It is
> anchored to `stageTarget` — where the lens *ends up* — and not to where the
> lens is this frame, because the lens is mid-pull-back for the whole act: with
> the live one, his world place was a function of the scroll, so he landed
> somewhere slightly different every time the shot was entered and drifted under
> you while you were in it. His track's two ends are **equal** for the same
> reason: he holds still and the lens pulls back past him, which is what the act
> is.
>
> Two more things that were moving him: the pointer parallax here is **a
> seventh** of the scene's, not a quarter (the full drift swings the frame by a
> quarter of its width), and **the animation clip stops** once the shot is staged
> — a walking silhouette this close to the lens changes shape and place on every
> frame, which reads as the scene moving rather than as the shot. It starts again
> the moment the scroll leaves the act, so coming back up finds the room alive.

- **The figure is carried.** It is the same object from the opening, walked
  across the room to stand a metre from the lens, and faded back up by the same
  `opacity` that dissolved it (`Math.max(1 - flightFade, epilogue)`). No second
  skinned mesh, no second animation — and its clip has been running the whole
  time. It goes home again the moment the epilogue's progress hits zero, which is
  what scrolling *up* out of the last act needs: without that the room comes back
  with nobody in it.
- **A spill lamp is borrowed.** The figure's material is pure black, so it only
  reads against something brighter — and here there is nothing behind it but a
  dark sky. One of the room's three `PointLight`s is *moved* to just in front of
  the glass, which is where that set would be throwing light anyway. Moved and
  not added: changing the light **count** recompiles every material in the scene.
- **The set stops following the lens.** The carousel normally turns each member
  to face the camera; for this the aim is frozen at the finale's viewpoint
  (`aim` on `TvCarousel.update`), so drawing back to the left shows the set from
  a quarter on instead of head-on. The rest of the ring is not drawn at all
  (`frontOnly`).
- **Focus rides onto the glass**, so the figure a metre from the lens goes soft
  the way it does in the opening shot.
- **The blocking scales with the window.** A frame's height is fixed by the field
  of view but its width is not, so every sideways offset is multiplied by
  `camera.aspect / epilogue.referenceAspect` (clamped). Numbers that read as "at
  the left edge" on 16:9 read as "off frame" on anything narrower — which is
  exactly what happened first, with the figure staged outside the frame entirely.
- **The horizon is deliberately off level** (`epilogue.roll`, applied as the
  camera's `z` — rotation order is `YXZ`, so it is the innermost turn and rolls
  about the lens's own axis). And the **parallax is damped to a quarter**: at full
  strength the pointer swings the frame by a quarter of its width, which walks
  the figure out of a shot that is a specific blocking.
- **Both subjects are placed and turned by track** — `position` and `rotation`,
  each a `from` at the start of the reveal and a `to` at the end
  (`epilogue.television`, `epilogue.figure`). Equal ends mean the subject holds
  still while the lens pulls back, which is what the figure does; the television
  ships with different ones, so it drifts and turns as the black lifts. Positions
  are **world**
  coordinates, not relative to the camera, because a blocking is found by dragging
  numbers and reading them back out, and an offset from a frame that is itself
  moving is not a coordinate anyone can reason about. The television's `y` is
  *measured*: it is where the set's own lowest point rests on the floor.
  **The panel edits all eight** — see below.
- **Rotations are offsets in world axes**, radians, applied on top of whatever
  the subject is already doing. That matters for both of them: the television is
  aimed at the lens by its own screen normals, and the figure's Eulers carry an
  FBX Z-up conversion (`x` at −π/2), so adding to *its* `rotation.y` would not be
  a turn about the room's vertical at all. Both go through a quaternion
  `premultiply`, so `y` always means "turn about the room's vertical".
- **Nothing is relit and nothing is recoloured.** There used to be two lamps
  borrowed from the room, a colour lent to the figure's pure-black material and
  another to the floor's — all of it to keep a silhouette from being a hole in
  a frame with nothing behind it. Gone with the rest of the portrait lighting:
  the sky is back to the colour the opening shot has by then, which is what the
  silhouette reads against, exactly as it does in the first shot.

> [!warning] The figure's meshes are `frustumCulled = false`
> three culls a `SkinnedMesh` on its geometry's **bind-pose** bounding sphere,
> which is not where the animated body is. Harmless in the opening, where the
> figure sits in the middle of the frame; in this shot it stands at the very edge
> of a frustum a metre deep and was culled outright. Note also that
> `Box3.setFromObject` on that figure reports the bind-pose box — a metre and a
> half wide, when the body is nearer half of that — so **do not frame from it**;
> frame from what is on screen.

Measured while scrubbing the whole scroll continuously — flight, five-set
carousel, 9 000-mote dust, the finale and the epilogue: 16.7 ms average, p95
17.2, worst frame 17.6 — a locked 60.

## Dust

`TvDust` is one `Points` object — a single draw call — and **all of its motion
lives in the vertex shader**: every mote carries its home position and a seed, and
wanders around that home from one `uTime` uniform. Moving them on the CPU would
mean rewriting and re-uploading a buffer of thousands of positions every frame,
which is the per-frame allocation `optimize-3d-scene` §9 exists to prevent.

**It is drawn after the composer, from a scene of its own** — see
[[decisions-log]] ADR-0025. `BokehPass` blurs on three concentric rings, and a
bright dot two pixels wide is the one input that makes that pattern legible: out
of focus, every mote came out as a *rosette of dots*. Three consequences, all of
them handled in `tv-dust.ts` and all of them easy to reintroduce:

- **`depthTest: false` is mandatory.** The canvas depth buffer holds the
  composer's fullscreen quad, not the room. Tested against, the whole cloud
  disappears — which is what happened first, and looks exactly like the pass not
  running at all. (Diagnosed by wrapping `gl.drawArrays`: the draw *was* being
  issued, 9 000 points a frame, and discarding every fragment.)
- **Depth comes from the bokeh pass instead.** With no depth of its own the cloud
  floated over everything — motes sitting on the figure's silhouette, which reads
  as grain on the lens rather than dust in the air. `BokehPass` already renders
  the scene's depth for its own blur, so the fragment shader samples it (`tDepth`
  off the pass's uniforms, unpacked with three's `packing` chunk) and **fades** a
  mote out over 0.3 units as it sinks behind whatever is in front of it. Faded,
  not clipped: a hard boundary flickers as either one moves. It costs nothing —
  that depth pass was already being rendered.
  - The **mobile tier builds no bokeh pass**, so there is no depth texture and
    the shader compiles without the test (`USE_SCENE_DEPTH` is a define — an
    unbound sampler is undefined behaviour, not a no-op). The cloud floats there,
    and the fix would be a depth pass that tier exists to avoid.
- **No fog** — hence the far fade below.

- Positions and seeds are **derived, not random** (`sin(i * k)` hashes), so the
  cloud is identical on every load and a screenshot comparison stays meaningful.
- `frustumCulled = false`: the shader moves the motes, so the bounding sphere
  three computes from the buffer is a lie and the cloud would blink out.
- Additive, and motes very close to the lens fade out — one a few centimetres
  away would otherwise cover a quarter of the screen.
- **They fade out with distance too**, past ~13 units. The scene's fog never
  reaches the cloud, and undimmed specks at the far wall read as a starfield
  hanging behind the room rather than as dust inside it.
- **A mote is a disc with a hard rim, not a soft blob.** The fragment shader is
  opaque out to 80% of the radius and feathers only the last fifth
  (`1 - smoothstep(0.4, 0.5, d)`), with anything under 1% alpha discarded. A
  gaussian falloff across the whole radius — the obvious first shader — reads as
  smudges rather than as dust, and the feather that remains is only there to stop
  the rim aliasing.
- **The look is many small motes, not few large ones.** Count is in the
  thousands and `dust.size` small; a lower count at a larger size costs the same
  fill and reads as bokeh.
- **The box spans the whole flight** (`dust.area`, deep along `z`). Sized to the
  opening shot alone it empties out as the camera scrolls out of it.
- **Point size scales with the drawing buffer's height.** `gl_PointSize` is in
  pixels, so a fixed value is plainly visible in a small window and invisible in
  a large one — which is exactly how the dust came to look absent on a full-size
  screen while showing up in the preview pane.
- The mobile tier gets `dust.mobileShare` of the count.

## Camera & pointer parallax

The camera sits behind the figure's shoulders looking down −Z, with a small base
pitch. Pointer motion adds yaw and pitch **to the camera itself**, so the framing
is never re-composed — only turned:

- pointer right/left → yaw right/left; pointer up/down → pitch up/down;
- `rotation.order = "YXZ"`, because the default XYZ order leaks visible roll once
  both axes are non-zero;
- amplitude ≈ 11° yaw / 6.6° pitch (`parallax.maxYaw` / `maxPitch`).

Motion comes from two `SpringValue`s (`@react-spring/web`), read once per frame —
spring physics, like the rest of the app (hard rule #1). The listener is **not
attached** on touch devices (an unmoved cursor rests dead centre) or under
`prefers-reduced-motion`, where react-spring's global `skipAnimation` would
teleport the camera on every move instead of easing it.

## Hover — a television rises and turns, with its stack

Pointing at a television lifts it (`hover.lift`) and turns it about its own
footprint centre (`hover.yaw`), on a spring that is snappier than the camera
drift. Turning about the footprint centre rather than the node origin matters:
the GLB's origins sit far outside the meshes, so rotating the node directly
swings the television around a corner instead of spinning it in place.

**Stacking is derived, never hardcoded.** `tv-stacks.ts` reads the world AABB of
every numbered root and records B as resting on A when B's base meets A's top
(`stack.gap`) and their footprints overlap by at least `stack.overlap`.

The relation is **directed and followed upward only**: the hovered television
rises, so does everything stacked on it, and nothing below it moves. Each one
rises `lift × (depth + 1)`, where depth is its hops above the hovered one — so
they **separate instead of moving as a slab**. Hovering the base of the
three-high column raises it by one step, the middle by two and the top by three,
opening a gap at each joint. Each step up the stack also starts `hover.stagger`
later, so a column rises as a cascade.

> [!important] The step count is the spring's goal, not a multiplier on it
> Sliding the pointer up a stack changes a television's depth — "two above the
> hovered one" becomes "the hovered one". With the count applied *outside* a
> 0→1 spring, that switch teleported it down two steps mid-flight, which is what
> made fast switching feel jerky. The spring animates the height in steps
> directly, so a depth change is just a new goal it eases toward. Rising and
> settling back use separate configs (damping 1.06 and 1.24, neither
> overshoots); the turn is done by the first step and holds, so a television
> three steps up is not three times more turned.

**Hovering pulls focus onto the television.** The lens racks from
`depthOfField.focus` (its resting plane) to the depth of whatever is under the
pointer, and back when the pointer leaves, on `depthOfField.focusSpring`. Two
details worth keeping:

- the goal is the target's depth **along the camera's view axis**, not the
  straight-line distance — that is what the bokeh shader compares its depth
  buffer against, so a television off to one side would otherwise pull focus to
  a plane it does not sit on;
- the goal is re-read every frame rather than set once on hover, because a
  hovered television is rising and drifting the whole time it is held.

**And it leaves with the room.** The rack focus is the *opening shot's* effect —
the answer to a cursor on a wall of screens. Once the flight is under way there
is nothing to rack to, and a defocus still running only softens the acts that
want to be sharp, so `scroll.focusFade` closes the blur ceiling to zero over the
first sixth of the scroll. The **pass keeps rendering** — [[#Dust]] reads the
depth texture it writes — and the ceiling is re-derived every frame rather than
switched at a threshold, so scrolling back up brings the effect back.

**And it says what it is.** Hovering a set puts a chip on the cursor with that
case's name typing itself into it — DOM, not a plane in the room, and the whole
story of why is in [[components/common|`<HoverChip>`]]. The scene's part is one
callback (`onHoverHint`) and the lookup behind it: the label is keyed on the
**texture the screen is wearing**, the same key the videos are matched on, so
which set carries which case is decided in the model. The two noise clips and
the stills fall through to *Coming soon…* — and the hint carries **which of the
two it was** (`kind: "case" | "unknown" | "closing"`), because a set with no work
on it must not be offered with an arrow.

> [!warning] Read the **screen's** texture, not the first one you find
> A television is mostly casing and the casing is textured too, so taking the
> first mapped material in the traversal handed out case names by the shape of
> the model rather than by what was playing — sets showing noise came up named
> after work. The lookup is restricted to the `screen N` mesh.

**A raised television levitates.** While it hangs it keeps bobbing, swinging and
tipping (`hover.float`) — three sine waves at different rates so the motion never
reads as a loop, each television offset by its own phase and swinging first in
its own direction (both derived from its order in the model, not from
`Math.random`, so the scene looks the same on every load). The whole drift is
scaled by how far up the television is, so it fades in with the rise and is
exactly zero at rest — nothing twitches on a wall nobody is touching.

> [!warning] Connected components were wrong here
> The first version grouped televisions into stacks with union-find. One
> television resting across two floor-standing neighbours bridged them into a
> single component, so hovering one floor television lifted an unrelated one
> beside it. Upward traversal from the hovered node fixes it: a television
> straddling two others still rises with either, but the two never drag each
> other.

Picking is **two-phase**: the ray is tested against one AABB per television
(fifteen box tests), then against the actual meshes of only the survivors. Boxes
alone were not enough — on a wall this dense they overlap heavily, so a
television standing behind a neighbour's box could never win the pick and simply
never responded. The narrow phase also includes the figure, which therefore
occludes: televisions behind a solid body do not light up through it.

**Picking happens on pointer movement only**, and against the wall **at rest**.
Both rules exist to stop the hover handing itself to a neighbour:

- *Never re-pick while the camera eases.* The parallax keeps turning after the
  cursor stops, sliding the wall out from under a stationary pointer; a re-pick
  mid-drift lands on whatever arrives next. Aiming at the television the drift is
  heading for was tried instead and is worse — it makes the user lead the target.
  What was under the cursor when they aimed stays hovered until they move again.
- *Never pick the animated pose.* A raised television moves out from under its
  own cursor, so picking its lifted position feeds back: hover, rise, lose, drop.
  `pick()` writes the displaced televisions back to rest, rays, then restores
  them.

Even with the pointer moving on every single frame the loop held 16.7 ms
(p95 20.7 with the skinned figure in the narrow phase, 17.4 before it), so the
narrow phase is not the reason picking is throttled — correctness is. The
container's cursor becomes `pointer` while a television is under the ray.

Gated by the same `pointerEnabled` flag as the camera drift — no picking, no
listener and no cursor change on touch devices or under reduced motion.

## Performance

Built on the [[optimize-3d-scene]] rules from the start:

| Rule | How |
|------|-----|
| One rAF for the page | `subscribeToTicker` (`lib/animation/ticker.ts`) — no private loop |
| Render only when visible | `IntersectionObserver` (`rootMargin: 100%`) + `visibilitychange` + **`setCovered`**; the ticker subscription is dropped, not merely skipped |
| Frame budget per tier | `1000/30` on mobile, every tick on desktop |
| DPR clamp | `[1, 1.5]` desktop, hard `1` on mobile, a **fragment budget** on top — **and the composer set from the same number** |
| Prewarm | `compileAsync` with **everything visible**, the dust's own scene, and one throwaway frame through the whole chain |
| Passes that contribute nothing | the bokeh is `enabled = false` wherever its blur ceiling is zero |
| Scroll progress | one cached read for the page — `lib/animation/scroll-progress.ts` |
| Lighting | one directional key + a PMREM'd `RoomEnvironment` IBL — no fill lights |
| Prewarm | `renderer.compileAsync` before the first visible frame |
| No pointer cost on touch | listener never attached |
| Resize | desktop only, coalesced into the frame loop (iOS fires `resize` on every URL-bar collapse) |
| Disposal | geometries, materials, textures, render target, renderer, canvas |
| Bot / server path | `dynamic(ssr:false)` — three.js never reaches the server render |

> [!warning] "The site is smooth but the videos stutter" is a frame-rate report
> The clips are only 642×480 and there are seven of them — nothing. What makes
> them judder is the **render loop**, because a `VideoTexture` is only uploaded
> on a frame the scene draws: at 30fps a 30fps clip beats against the loop and
> comes apart. And 30fps is what a wide window gets, because the frame goes
> through bloom's five mips, a **41-tap** bokeh, grain and the CRT glass — close
> to linear in pixels with a large constant. A 2560×1440 window at 1.5× is 8.3M
> fragments, three times the design size.
>
> Two answers, both in place: `clampedPixelRatio` takes a **fragment budget**
> (3.2M) as well as the tier clamp, so a wide window renders at a lower ratio
> instead of dropping frames — invisible under grain and defocus, and it takes
> 2560×1440 from 8.3M to 3.7M; and the scene **stops drawing entirely** while the
> team panel covers it, which is also where the seven decoders get paused.
>
> **And then that saving was thrown away again, silently.** `EffectComposer`
> keeps whatever pixel ratio it was **constructed** with — clamping the renderer
> afterwards does nothing to the post chain, which is where nearly all of the
> fill is (`optimize-3d-scene` §6). Measured at 2560×1440 with everything else
> identical: composer left at 1.5 → **42.4 ms** a frame (24 fps); composer set
> from the same number as the renderer → **16.65 ms** (60 fps). Set both, always,
> from one call.

> [!note] Two televisions are out of frame
> `14` and `15` sit at x ≈ 2.7, past the right edge of a 40° frustum from the
> composed camera position — they are in the model but never visible, so they
> never hover. Not a picking bug; widen the fov or move the rig if they are
> wanted in shot.

> [!note] `#todo` Not yet done
> No static poster for crawlers or the no-WebGL fallback (skill §1), and no
> measured baseline (`renderer.info`) — the scene has not been profiled on a
> phone or a production build.

## Related

[[animation-system]] · [[optimize-3d-scene]] · [[tech-stack]] · [[folder-structure]] · [[components/common]]
