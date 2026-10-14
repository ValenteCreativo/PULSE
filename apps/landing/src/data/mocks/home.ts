/**
 * Placeholder content for the home view.
 *
 * Components take their content through props — this is the only place the
 * strings and asset paths live until real copy arrives.
 */

export interface HomeHeroContent {
  /** Page `<h1>` — one string; the design's 535px measure is what breaks it. */
  headline: string;
  /** The two lines under the scene. */
  intro: string;
  /**
   * The two calls to action under the intro.
   *
   * `href` is **optional, and absent until the route it names exists**. There is
   * one route on this site (`/`), and a call to action pointing at a page nobody
   * has built is a 404 with a button on it — so the label renders as a label
   * (see [[components/common|`<HeroCopy>`]]) and becomes a link the moment a
   * destination is written here.
   */
  primaryCta: { label: string; href?: string };
  secondaryCta: { label: string; href?: string };
  /** The nav pill's strings; `contactHref` follows the same rule as the CTAs. */
  nav: {
    label: string;
    home: string;
    menu: string;
    contact: string;
    contactHref?: string;
  };
  /** Top-right of the frame — the tally light. */
  recordingLabel: string;
  /** Accessible name for the scene section. */
  sceneLabel: string;
  /** Accessible name for the curtain over the first paint. */
  loadingLabel: string;
  /** GLB served from `public/assets/hero/`. */
  modelUrl: string;
  /**
   * Videos for the television screens. Each file replaces the model texture of
   * the same name — `cat.mp4` takes over the screen textured `cat` — so which
   * television plays what is decided in the model, not here. A screen whose
   * texture has no matching file keeps its still image.
   */
  screenVideos: string[];
  /**
   * Clip for one specific screen, keyed by the number in its `screen N` name.
   * Beats the texture-name match — the way to give one screen its own clip when
   * it shares a texture with others that should keep theirs.
   */
  screenVideoOverrides: Record<string, string>;
  /**
   * The two lines the camera flies through between the wall and the carousel.
   *
   * They are geometry, not DOM — see [[scene-3d]] — so each carries its own
   * placement: where it stands in the room, how tall its letters are, and the
   * distances over which it fades up out of the fog and out again as the lens
   * goes past.
   */
  flightSigns: SceneSignContent[];
  /**
   * What the chip on the cursor says over each television.
   *
   * Keyed by the **texture on that screen** — the same key the videos are
   * matched on, so which set carries which case is decided in the model. The
   * fallback is for the noise sets and the stills: nothing is on them yet.
   */
  captionLabels: {
    byTexture: Record<string, string>;
    fallback: string;
    /** The word after the chip's divider. */
    action: string;
  };
  /** The carousel section: its heading, its controls, and the works themselves. */
  cases: HomeCasesContent;
  /** The black panel — the next beat of the story. */
  about: HomeAboutContent;
  /**
   * The last shot: the picture on that television's glass, and the line the
   * chip shows when the pointer finds it.
   */
  finalShot: { image: string; label: string };
  /** The words over the closing shot. */
  closing: HomeClosingContent;
}

export type HomeAboutIcon = "circle" | "triangle" | "square";

export interface HomeAboutContent {
  heading: string;
  /**
   * The lead paragraph, in clauses. Alternate ones are set at half strength —
   * the design's way of giving a single sentence a rhythm.
   */
  lead: Array<{ text: string; dim?: boolean }>;
  cards: Array<{ icon: HomeAboutIcon; body: string }>;
}

export interface HomeClosingContent {
  /** The `h2` over the last shot. */
  heading: string;
  /** One line under it. */
  lead: string;
}

export interface SceneSignContent {
  text: string;
  /** World position of the line's centre. */
  position: [number, number, number];
  /** Cap height in world units — the near line is the big one. */
  size: number;
  /** `[appear, full]` in units ahead of the lens — what staggers the two. */
  fadeIn?: [number, number];
}

export interface HomeCase {
  name: string;
  /** Three of them in the design, drawn `( like this )`. */
  tags: string[];
  /** Case-study route, once one exists — see `primaryCta` above. */
  href?: string;
}

export interface HomeCasesContent {
  /** Accessible name for the section's controls. */
  label: string;
  heading: string;
  previous: string;
  next: string;
  explore: string;
  /**
   * The works, **in the ring's order** — `scroll.carousel.members` in
   * `lib/scene/config.ts`. The scene reports which one it has turned to the
   * front by index, so the two lists have to line up.
   */
  items: HomeCase[];
}

export const homeHero: HomeHeroContent = {
  headline: "The intelligence marketplace for AI creators.",
  intro:
    "PULSE turns the internet's attention into intelligence AI creators can buy and act on.",
  // Routes now exist, so these render as real links.
  primaryCta: { label: "Start building", href: "/contact" },
  secondaryCta: { label: "For Agents", href: "/agents" },
  nav: {
    label: "Primary",
    home: "< >",
    menu: "Menu",
    contact: "Contact",
    contactHref: "/contact",
  },
  recordingLabel: "REC",
  sceneLabel:
    "Interactive 3D scene: a figure facing a wall of televisions showing human attention",
  loadingLabel: "Loading the signal",
  modelUrl: "/assets/hero/TV.glb",
  screenVideos: [
    "/assets/hero/Videoes/bridge.mp4",
    "/assets/hero/Videoes/cat.mp4",
    "/assets/hero/Videoes/chelik.mp4",
    "/assets/hero/Videoes/color noise.mp4",
    "/assets/hero/Videoes/hands.mp4",
    "/assets/hero/Videoes/magic.mp4",
    "/assets/hero/Videoes/noise.mp4",
  ],
  // Screens 2, 5 and 12 share one still texture in the model; only this one
  // should play, so it cannot be expressed by the texture-name match.
  screenVideoOverrides: {
    "12": "/assets/hero/Videoes/noise.mp4",
  },
  // Between the wall and the carousel there is nothing but fog, and the flight
  // through it is long. These two stand in it at different depths — the near one
  // large and just off the lens's axis, the far one small and to the other side
  // — so the camera reads as passing *through* a space rather than crossing an
  // empty one.
  //
  // Both live in the **corridor past the wall**: the lens runs from z 5.6 to
  // −9.4 and the last row of sets is at z ≈ −4.6, so the room for these is what
  // is left. The near line stands far enough back that `signs.clearOf` has
  // already opened by the time its own fade would have brought it up — nothing
  // shows while a television is still in frame.
  //
  // They lift out of the fog **one after the other**, which is what their own
  // `fadeIn` distances are for: the near line is up and already going past by
  // the time the far one starts to show. The flight changes gear for this — see
  // `scroll.flightSplit` — so each of those emergences is a few hundred pixels
  // of scroll rather than a blink.
  flightSigns: [
    {
      text: "Everyone is building agents that create.",
      position: [-0.28, 1.6, -7.6],
      size: 0.22,
      fadeIn: [5, 3.2],
    },
    {
      // Dead centre, unlike the near line: it is nearly as wide as the frame by
      // the time the lens is on it, and off to one side it ran out of the right
      // edge before it could be read.
      text: "But who tells them what to create?",
      position: [0, 1.18, -9.3],
      size: 0.13,
      fadeIn: [3, 1.8],
    },
  ],
  captionLabels: {
    byTexture: {
      magic: "Formats taking off",
      hands: "Sounds that spread",
      chelik: "Watch-time patterns",
      bridge: "Engagement signals",
      cat: "What's trending now",
    },
    fallback: "Coming soon...",
    action: "Explore",
  },
  closing: {
    // TODO(pulse): the demo's "copy ''' … ''' and pay in MON on Monad testnet"
    // moment lands here. Drop a display-only, copy-paste snippet block beside
    // this closing copy — never a code path that broadcasts a tx or spends
    // funds. The public fixture API is co-located with this landing; see src/lib/pulse.ts.
    heading: "Buy intelligence. Pay in MON.",
    lead: "The marketplace between human attention and autonomous creation.",
  },
  finalShot: {
    image: "/assets/CTA/CTA-TV.png",
    label: "Agents are watching",
  },
  cases: {
    label: "What PULSE reads",
    // The carousel IS the "what is PULSE" moment: each screen is a kind of human
    // attention PULSE turns into intelligence an agent can read.
    heading: "This is PULSE",
    previous: "Previous",
    next: "Next",
    explore: "Explore",
    // In the ring's order (magic, hands, chelik, bridge, cat) — the scene
    // reports the front item by index, so this list has to line up with
    // `scroll.carousel.members` in `lib/scene/config.ts`. No `href`: these are
    // attention-intelligence themes, not case-study routes.
    items: [
      { name: "Formats taking off", tags: ["Short-form", "Trend velocity", "What to make"] },
      { name: "Sounds that spread", tags: ["Audio", "Virality signal", "What to use"] },
      { name: "Watch-time patterns", tags: ["Retention", "Pacing", "How long"] },
      { name: "Engagement signals", tags: ["Comments", "Shares", "What lands"] },
      { name: "What's trending now", tags: ["Topics", "Momentum", "What's next"] },
    ],
  },
  about: {
    heading: "Agent Pulse",
    lead: [
      { text: "Agents buy intelligence on Monad. " },
      { text: "Every purchase shows what they want to understand.", dim: true },
    ],
    cards: [
      {
        icon: "circle",
        body: "Human Pulse — what people care about.",
      },
      {
        icon: "triangle",
        body: "Agent Pulse — what agents pay to understand.",
      },
      {
        icon: "square",
        body: "A marketplace between attention and creation.",
      },
    ],
  },
};
