import { datasetBudgetSchema, datasetPreflightSchema, type DatasetBudget, type DatasetPreflight } from "./types.js";

const HF_BASE_URL = "https://huggingface.co/api/datasets";

export const defaultBudget: DatasetBudget = {
  maxBytes: Number(process.env.PULSE_DATASET_MAX_BYTES ?? 50 * 1024 * 1024),
  maxRows: Number(process.env.PULSE_DATASET_MAX_ROWS ?? 10_000),
  timeoutMs: Number(process.env.PULSE_DATASET_TIMEOUT_MS ?? 20_000),
};

type FetchLike = typeof fetch;

type HuggingFaceSibling = { rfilename?: unknown; size?: unknown; lfs?: { size?: unknown } };
type HuggingFaceDataset = {
  siblings?: HuggingFaceSibling[];
  sha?: unknown;
  cardData?: { license?: unknown };
  lastModified?: unknown;
};

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toNullableSize(sibling: HuggingFaceSibling): number | null {
  const value = sibling.lfs?.size ?? sibling.size;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export async function inspectDataset(
  repository = process.env.PULSE_DATASET_REPO ?? "kuben-developer/tiktok-videos-4b",
  budgetInput: DatasetBudget = defaultBudget,
  fetchImpl: FetchLike = fetch,
): Promise<DatasetPreflight> {
  const budget = datasetBudgetSchema.parse(budgetInput);
  const inspectedAt = new Date().toISOString();
  let response: Response;

  try {
    const repositoryPath = repository.split("/").map(encodeURIComponent).join("/");
    response = await fetchImpl(`${HF_BASE_URL}/${repositoryPath}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(budget.timeoutMs),
    });
  } catch (error) {
    return datasetPreflightSchema.parse({
      repository, inspectedAt, status: "inaccessible", httpStatus: null,
      reason: error instanceof Error ? `Metadata request failed: ${error.message}` : "Metadata request failed",
      revision: null, license: null, lastModified: null, files: [], parquetFiles: [], budget,
    });
  }

  if (!response.ok) {
    return datasetPreflightSchema.parse({
      repository, inspectedAt, status: "inaccessible", httpStatus: response.status,
      reason: `Metadata endpoint returned HTTP ${response.status}`,
      revision: null, license: null, lastModified: null, files: [], parquetFiles: [], budget,
    });
  }

  let payload: HuggingFaceDataset;
  try {
    payload = await response.json() as HuggingFaceDataset;
  } catch {
    return datasetPreflightSchema.parse({
      repository, inspectedAt, status: "invalid-response", httpStatus: response.status,
      reason: "Metadata endpoint returned invalid JSON", revision: null, license: null,
      lastModified: null, files: [], parquetFiles: [], budget,
    });
  }

  const files = (payload.siblings ?? [])
    .filter((sibling): sibling is HuggingFaceSibling & { rfilename: string } => typeof sibling.rfilename === "string")
    .map((sibling) => ({
      path: sibling.rfilename,
      sizeBytes: toNullableSize(sibling),
      isParquet: sibling.rfilename.toLowerCase().endsWith(".parquet"),
    }));
  const parquetFiles = files.filter((file) => file.isParquet);

  return datasetPreflightSchema.parse({
    repository, inspectedAt, status: "accessible", httpStatus: response.status, reason: null,
    revision: toNullableString(payload.sha),
    license: toNullableString(payload.cardData?.license),
    lastModified: toNullableString(payload.lastModified),
    files, parquetFiles, budget,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  inspectDataset().then((report) => {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.status === "accessible" ? 0 : 2;
  });
}
