# Decisions

## 2026-10-12 — Source access is a hard precondition

The specified Hugging Face dataset currently returns HTTP 401 (`Invalid username or password`) for both the dataset page and API metadata endpoint from this environment. PULSE will not bypass access controls or substitute undocumented remote data. The ingestion preflight returns an explicit `inaccessible` result and prevents sampling.

## 2026-10-12 — Bounded transport before DuckDB

DuckDB is not installed in the current environment. The initial ingestion contract is independent of DuckDB and validates repository metadata, file candidates, and byte/row limits first. A later adapter may use DuckDB `httpfs` only after an accessible Parquet file and its metadata have been verified.

## 2026-10-12 — Settlement remains unimplemented

Mesh402's Hedera/Blocky402 pattern is useful for exact requirement comparison, one-shot redemption, receipt validation, and redaction. It is not copied as a Monad implementation. Monad x402/facilitator compatibility must be independently verified before settlement work begins.
