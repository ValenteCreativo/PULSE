import type { DatasetBudget, DatasetPreflight } from "./types.js";

export type SamplingPlan = { files: string[]; maxRows: number; maxBytes: number };

/** Selects files deterministically without ever treating unknown-size data as safe. */
export function createSamplingPlan(preflight: DatasetPreflight, budget: DatasetBudget = preflight.budget): SamplingPlan {
  if (preflight.status !== "accessible") throw new Error(`Dataset unavailable: ${preflight.reason ?? "unknown reason"}`);
  const eligible = preflight.parquetFiles
    .filter((file) => file.sizeBytes !== null && file.sizeBytes <= budget.maxBytes)
    .sort((a, b) => a.path.localeCompare(b.path));
  if (eligible.length === 0) throw new Error("No Parquet file fits the configured byte budget; metadata-only inspection retained");

  const chosen: string[] = [];
  let bytes = 0;
  for (const file of eligible) {
    if (file.sizeBytes === null || bytes + file.sizeBytes > budget.maxBytes) continue;
    chosen.push(file.path);
    bytes += file.sizeBytes;
  }
  if (chosen.length === 0) throw new Error("No bounded Parquet sampling plan can be produced");
  return { files: chosen, maxRows: budget.maxRows, maxBytes: bytes };
}
