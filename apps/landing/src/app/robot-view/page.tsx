import type { Metadata } from "next";

import { HomeView, homeMetadata } from "@/views/home";

/** The home page's own metadata — the same object `app/page.tsx` exports. */
export const metadata: Metadata = homeMetadata;

/**
 * The home page as robots get it — reached only through the proxy's rewrite of
 * `/` (D-016). Inherits the root metadata, so its canonical is `/`: a crawler
 * indexing the home page reads this document under the home page's URL.
 */
export default function RobotHome() {
  return <HomeView robot />;
}
