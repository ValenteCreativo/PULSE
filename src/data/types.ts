import { z } from "zod";

export const datasetBudgetSchema = z.object({
  maxBytes: z.number().int().positive().max(500 * 1024 * 1024),
  maxRows: z.number().int().positive().max(100_000),
  timeoutMs: z.number().int().positive().max(120_000),
});

export type DatasetBudget = z.infer<typeof datasetBudgetSchema>;

export const sourceStatusSchema = z.enum(["accessible", "inaccessible", "invalid-response"]);

export const fileCandidateSchema = z.object({
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().nullable(),
  isParquet: z.boolean(),
});

export const datasetPreflightSchema = z.object({
  repository: z.string().min(1),
  inspectedAt: z.string().datetime(),
  status: sourceStatusSchema,
  httpStatus: z.number().int().nullable(),
  reason: z.string().nullable(),
  revision: z.string().nullable(),
  license: z.string().nullable(),
  lastModified: z.string().nullable(),
  files: z.array(fileCandidateSchema),
  parquetFiles: z.array(fileCandidateSchema),
  budget: datasetBudgetSchema,
});

export type DatasetPreflight = z.infer<typeof datasetPreflightSchema>;

export const normalizedVideoSchema = z.object({
  sourceRecordId: z.string().regex(/^[a-f0-9]{64}$/),
  source: z.literal("tiktok-videos-4b"),
  publishedAt: z.string().datetime().nullable(),
  capturedAt: z.string().datetime().nullable(),
  text: z.string().max(5_000),
  hashtags: z.array(z.string().max(100)).max(100),
  engagement: z.object({
    views: z.number().int().nonnegative().nullable(),
    likes: z.number().int().nonnegative().nullable(),
    comments: z.number().int().nonnegative().nullable(),
    shares: z.number().int().nonnegative().nullable(),
  }),
  provenance: z.object({
    datasetRepository: z.string(),
    datasetRevision: z.string().nullable(),
    inputColumns: z.array(z.string()),
  }),
});

export type NormalizedVideo = z.infer<typeof normalizedVideoSchema>;
