import type { Metadata } from "next";

import { HomeView, homeMetadata } from "@/views/home";

/**
 * The home route's own metadata.
 *
 * Next reads `metadata` from the segment itself, so the export has to be here
 * (hard rule #5 / [[decisions-log]] ADR-0003) — but the object lives with the
 * view, because the robot form's route exports the same one.
 */
export const metadata: Metadata = homeMetadata;

export default function Home() {
  return <HomeView />;
}
