import { normalizeVideo } from "../data/normalize.js";

/** Synthetic fixtures for local development; they never represent observed TikTok activity. */
export const demoRecords = [
  { id: "fixture-1", desc: "Learn #ai agents with a #monad tutorial", views: 1200, likes: 180, comments: 25, shares: 11, created_at: "2026-01-01T10:00:00Z" },
  { id: "fixture-2", desc: "Building #ai agents in TypeScript", views: 3400, likes: 520, comments: 67, shares: 81, created_at: "2026-01-03T10:00:00Z" },
  { id: "fixture-3", desc: "A #monad developer walkthrough", views: 900, likes: 100, comments: 9, shares: 6, created_at: "2026-01-06T10:00:00Z" },
  { id: "fixture-4", desc: "Ship a #typescript #ai demo", views: 7600, likes: 1200, comments: 140, shares: 210, created_at: "2026-01-09T10:00:00Z" },
].map((record) => normalizeVideo(record, { repository: "pulse/synthetic-fixtures", revision: "v1" }));
