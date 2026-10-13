import { z } from "zod";
import type { NormalizedVideo } from "../data/types.js";

export const humanPulseTopicSchema = z.object({
  id: z.string(),
  label: z.string(),
  prevalence: z.number().min(0).max(1),
  meanEngagement: z.number().nonnegative(),
  momentum: z.number().min(-1).max(1).nullable(),
  saturation: z.number().min(0).max(1),
  sampleCount: z.number().int().nonnegative(),
  evidence: z.array(z.object({ sourceRecordId: z.string(), text: z.string(), publishedAt: z.string().nullable() })),
});

export const humanPulseSchema = z.object({
  kind: z.literal("human-pulse"),
  mode: z.enum(["fixture", "authorized-sample"]),
  observationWindow: z.object({ start: z.string().nullable(), end: z.string().nullable() }),
  datasetFreshness: z.string(),
  sourceCoverage: z.object({ records: z.number().int(), recordsWithPublishedAt: z.number().int(), source: z.string() }),
  confidence: z.number().min(0).max(1),
  limitations: z.array(z.string()),
  generatedNarrative: z.string(),
  provenance: z.object({ datasetRepository: z.string(), datasetRevision: z.string().nullable(), processingTimestamp: z.string() }),
  topics: z.array(humanPulseTopicSchema),
});
export type HumanPulse = z.infer<typeof humanPulseSchema>;

function engagement(record: NormalizedVideo): number {
  const values = record.engagement;
  return (values.views ?? 0) + 2 * (values.likes ?? 0) + 3 * (values.comments ?? 0) + 4 * (values.shares ?? 0);
}

function topicIds(record: NormalizedVideo): string[] {
  if (record.hashtags.length > 0) return record.hashtags.map((tag) => tag.toLowerCase());
  return [...new Set((record.text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []).slice(0, 3))];
}

function formatTopic(id: string): string {
  return id.split(/[-_]/).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

/** Deterministic snapshot metrics: momentum compares sample publication windows, never engagement velocity. */
export function computeHumanPulse(records: NormalizedVideo[], options: { mode: "fixture" | "authorized-sample"; processedAt?: Date } ): HumanPulse {
  const processedAt = options.processedAt ?? new Date();
  const dated = records.filter((record) => record.publishedAt !== null).sort((a, b) => a.publishedAt!.localeCompare(b.publishedAt!));
  const medianDate = dated.length > 1 ? dated[Math.floor(dated.length / 2)]!.publishedAt! : null;
  const topicRecords = new Map<string, NormalizedVideo[]>();
  for (const record of records) for (const topic of topicIds(record)) {
    const group = topicRecords.get(topic) ?? [];
    group.push(record);
    topicRecords.set(topic, group);
  }
  const topics = [...topicRecords.entries()].map(([id, group]) => {
    const recent = medianDate ? group.filter((record) => record.publishedAt !== null && record.publishedAt >= medianDate).length : 0;
    const prior = medianDate ? group.filter((record) => record.publishedAt !== null && record.publishedAt < medianDate).length : 0;
    const momentum = medianDate && prior > 0 ? Math.max(-1, Math.min(1, (recent - prior) / prior)) : null;
    const prevalence = records.length === 0 ? 0 : group.length / records.length;
    return {
      id, label: formatTopic(id), prevalence, meanEngagement: group.reduce((sum, record) => sum + engagement(record), 0) / group.length,
      momentum, saturation: Math.min(1, group.length / Math.max(1, records.length * 0.25)), sampleCount: group.length,
      evidence: group.slice(0, 3).map((record) => ({ sourceRecordId: record.sourceRecordId, text: record.text, publishedAt: record.publishedAt })),
    };
  }).sort((a, b) => b.prevalence - a.prevalence || b.meanEngagement - a.meanEngagement || a.id.localeCompare(b.id));
  const dates = dated.map((record) => record.publishedAt!);
  const repository = records[0]?.provenance.datasetRepository ?? "unavailable";
  const revision = records[0]?.provenance.datasetRevision ?? null;
  const confidence = Math.round(Math.min(1, records.length / 100) * (dated.length / Math.max(records.length, 1)) * 1000) / 1000;
  const limitations = [
    options.mode === "fixture" ? "Fixture data only; not a claim about live or observed TikTok attention." : "Historical sampled data; not live attention.",
    "Engagement counts are snapshots and do not establish engagement velocity.",
    dated.length < records.length ? "Some records lack publication timestamps." : "Publication windows are based on available timestamps.",
  ];
  return humanPulseSchema.parse({
    kind: "human-pulse", mode: options.mode,
    observationWindow: { start: dates[0] ?? null, end: dates.at(-1) ?? null },
    datasetFreshness: dates.at(-1) ?? "unknown", sourceCoverage: { records: records.length, recordsWithPublishedAt: dated.length, source: repository },
    confidence, limitations,
    generatedNarrative: records.length === 0 ? "Insufficient data: no records were supplied." : `Observed ${topics.length} deterministic topics across ${records.length} ${options.mode} records.`,
    provenance: { datasetRepository: repository, datasetRevision: revision, processingTimestamp: processedAt.toISOString() }, topics,
  });
}
