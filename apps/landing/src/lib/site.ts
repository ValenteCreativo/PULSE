/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper. Everything a crawler, a share card or a
 * home-screen icon says about this site is derived from here; nothing below is
 * repeated in a component.
 */
import { getServerEnv, publicEnv } from "@/env";
import { PRIVACY_POLICY_URL } from "@/lib/legal";

/**
 * Vercel's production domain, read at build time — the fallback when a deploy
 * doesn't set `NEXT_PUBLIC_SITE_URL` (none did: the live canonical said
 * localhost). Server-only: every consumer of `siteConfig` renders on the server.
 */
const vercelProduction = getServerEnv().VERCEL_PROJECT_PRODUCTION_URL;

export const siteConfig = {
  name: "PULSE",
  /**
   * The full title, used as the home page's `<title>` and as the OG title.
   * `name` on its own is what the `%s — PULSE` template puts after a page's
   * own title; the two are deliberately different strings.
   */
  title: "PULSE — The intelligence marketplace for the next million AI creators.",
  /** The hero intro and the About lead, in the page's own words. */
  description:
    "PULSE turns the internet's attention into intelligence AI creators can buy and act on — a marketplace between human attention and autonomous creation.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production — the
   * fallback here is the production domain rather than localhost so a build
   * that forgets the variable still emits absolute URLs that resolve.
   */
  url:
    publicEnv.NEXT_PUBLIC_SITE_URL ??
    (vercelProduction ? `https://${vercelProduction}` : "https://codescan.studio"),
  /**
   * Default Open Graph / Twitter share image (path under `public/`), and its
   * real pixel size. The dimensions are declared to scrapers, so they are read
   * from here rather than written again in the metadata generator — a share
   * card that lies about its own size is cropped by whoever renders it.
   */
  ogImage: "/open-graph.jpg",
  ogImageSize: { width: 1200, height: 630 },
  /** What the share image shows — a 1200×630 capture of the hero at rest. */
  ogImageAlt:
    "PULSE — a figure facing a wall of glowing televisions showing human attention",
  /**
   * Unset until the studio holds a real handle — the page shows none, and an
   * invented `@codescan` would credit a stranger's account. The generator
   * omits the Twitter site/creator tags while this is empty.
   */
  twitterHandle: undefined as string | undefined,
  author: "PULSE",
  /** From the page's copy (intro, About cards, case tags). */
  keywords: [
    "AI agents",
    "attention intelligence",
    "Monad",
    "agent marketplace",
    "human attention",
    "content intelligence",
  ],
  /** BCP-47 language and the OG locale that goes with it. */
  locale: "en_US",
  language: "en",
  /**
   * Where the privacy policy lives — `null` until one does.
   *
   * The consent banner and its preferences modal both point at it. They pointed
   * at `/privacy-policy`, which was never built, so the words render as words
   * until this is filled in. Set in `lib/legal.ts` — a module the client-side
   * consent surfaces can import without pulling in the env schema.
   */
  privacyPolicyUrl: PRIVACY_POLICY_URL,
  /** Browser theme-color (address bar / PWA) — the room the site opens in. */
  themeColor: "#000000",
} as const;
