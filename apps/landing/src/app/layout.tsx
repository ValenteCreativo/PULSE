import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { siteConfig } from "@/lib/site";
import {
  generateMetadata,
  generateViewport,
} from "@/utils/seo/generate-page-metadata";
import { getSiteStructuredData } from "@/utils/seo/structured-data";

import { AdaptiveGrid } from "@/components/common/grid";
import { ReducedMotion } from "@/components/common/reduced-motion";
import { ScrollLayout } from "@/layouts/scroll-layout";

import "@/app/globals.css";

/**
 * The two faces the design is drawn in, both supplied as files.
 *
 * `next/font/local` over a CDN import for the same reason the Draco decoder is
 * served locally: a third-party round trip on the critical path is what the
 * asset budget cannot afford. It also self-hosts with `font-display: swap` and a
 * generated fallback metric, so the layout does not jump when they land.
 *
 * WOFF2 subsets of the Latin range (every OpenType feature kept) rather than
 * the full TTFs: 300 KB → 65 KB, preloaded ahead of the scripts on a phone.
 * The scene's canvas text draws with the same faces and reads them from the
 * document, so it is covered too.
 */
const chakraPetch = localFont({
  variable: "--font-chakra-petch",
  display: "swap",
  src: [
    { path: "./fonts/ChakraPetch-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ChakraPetch-SemiBold.woff2", weight: "600", style: "normal" },
  ],
});

/** The display face — an *inline* one: its strokes are drawn hollow. */
const bigShoulders = localFont({
  variable: "--font-big-shoulders",
  display: "swap",
  src: [
    {
      path: "./fonts/BigShouldersInline-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
});

/**
 * The site's metadata, and the one place the title template lives — a template
 * rewrites the titles its *descendants* declare, so a second one further down
 * would compound rather than override.
 */
export const metadata: Metadata = generateMetadata({
  titleTemplate: `%s — ${siteConfig.name}`,
});
export const viewport: Viewport = generateViewport();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang={siteConfig.language}>
      <body className={`${chakraPetch.variable} ${bigShoulders.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getSiteStructuredData()),
          }}
        />
        <ScrollLayout>
          <AdaptiveGrid />
          <ReducedMotion />
          {children}
        </ScrollLayout>
      </body>
    </html>
  );
}
