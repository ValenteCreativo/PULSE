import { createHash } from "node:crypto";
import { normalizedVideoSchema, type NormalizedVideo } from "./types.js";

type SourceRecord = Record<string, unknown>;

function firstString(record: SourceRecord, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function nullableCount(record: SourceRecord, fields: string[]): number | null {
  for (const field of fields) {
    const value = record[field];
    const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(numeric) && numeric >= 0) return Math.floor(numeric);
  }
  return null;
}

function parseIsoDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeHashtags(record: SourceRecord, text: string): string[] {
  const fromField = record.hashtags;
  const values = Array.isArray(fromField) ? fromField.filter((item): item is string => typeof item === "string") : [];
  const inText = [...text.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) => match[1]);
  return [...new Set([...values, ...inText].map((tag) => tag.replace(/^#/, "").trim().toLowerCase()).filter(Boolean))].slice(0, 100);
}

/** Drops creator identity and produces a stable, non-reversible record reference. */
export function normalizeVideo(record: SourceRecord, options: { repository: string; revision?: string | null }): NormalizedVideo {
  const text = firstString(record, ["description", "desc", "caption", "text", "video_description"]) ?? "";
  const upstreamId = firstString(record, ["id", "video_id", "aweme_id", "url"]) ?? JSON.stringify(record);
  const sourceRecordId = createHash("sha256").update(`${options.repository}:${upstreamId}`).digest("hex");

  return normalizedVideoSchema.parse({
    sourceRecordId,
    source: "tiktok-videos-4b",
    publishedAt: parseIsoDate(firstString(record, ["create_time", "created_at", "published_at", "timestamp"])),
    capturedAt: parseIsoDate(firstString(record, ["crawled_at", "captured_at", "collected_at"])),
    text: text.slice(0, 5_000),
    hashtags: normalizeHashtags(record, text),
    engagement: {
      views: nullableCount(record, ["play_count", "view_count", "views", "plays"]),
      likes: nullableCount(record, ["digg_count", "like_count", "likes"]),
      comments: nullableCount(record, ["comment_count", "comments"]),
      shares: nullableCount(record, ["share_count", "shares"]),
    },
    provenance: {
      datasetRepository: options.repository,
      datasetRevision: options.revision ?? null,
      inputColumns: Object.keys(record).sort(),
    },
  });
}
