import { DuckDBConnection } from "@duckdb/node-api";

/** Verifies the embedded, local analytical engine without opening a remote dataset. */
export async function duckDbVersion(): Promise<string> {
  const connection = await DuckDBConnection.create();
  try {
    const result = await connection.runAndReadAll("SELECT version() AS version");
    const row = result.getRowObjectsJS()[0] as { version: string } | undefined;
    if (!row?.version) throw new Error("DuckDB did not return a version");
    return row.version;
  } finally {
    connection.closeSync();
  }
}

/**
 * A future authorized-data adapter must call this before `httpfs` reads.
 * This guard intentionally refuses files larger than the explicitly configured budget.
 */
export function assertRemoteFileWithinBudget(contentLength: number | null, maxBytes: number): void {
  if (contentLength === null) throw new Error("Remote file size is unknown; refusing unbounded read");
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > maxBytes) {
    throw new Error(`Remote file (${contentLength}) exceeds the ${maxBytes}-byte budget`);
  }
}
