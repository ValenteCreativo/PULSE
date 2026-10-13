# PULSE progress

## Milestone 1 — foundation and feasibility audit

- Status: complete
- Evidence: Node 22.23.2, pnpm 11.25.0, and Git 2.54.0 available; DuckDB CLI absent.
- Dataset result: Hugging Face dataset API and page return HTTP 401. No source data downloaded.
- Reference review: inspected Mesh402's payment server; reusable principles documented in `DECISIONS.md`.
- Next: implement bounded dataset preflight and normalization, with tests.

## Milestone 2 — safe source-ingestion boundary

- Status: complete
- Implemented: typed Hugging Face metadata preflight, explicit inaccessible/invalid responses, deterministic byte- and row-bounded Parquet plan, and privacy-preserving source normalization.
- Test evidence: 4 automated tests pass for access failure, budgeted planning, field normalization, and missing/invalid values. Type checking passes.
- Safety: the preflight is metadata-only; it has downloaded no source records. Current live preflight reports HTTP 401 from the correctly addressed repository endpoint.
- Next: once access is available, add a DuckDB `httpfs` metadata adapter and process a bounded, reproducible real sample for Human Pulse.

## Open blockers

- `utopiar/tiktok-videos-4b` is accessible but research-use only and carries personal-data/terms-of-service limitations. Its 10 GB Parquet files exceed the current safe sampling budget. `haoxin1998/SocialComputing_TikTokDataset` remains inaccessible (HTTP 401).
- Monad x402/facilitator support for the required testnet flow remains unverified. The direct contract path is locally proven but not deployed.
- Envio needs an API token and a real approved deployment address before it can index anything.

## Milestone 3 — Human Pulse and typed intelligence API

- Status: complete
- Implemented: embedded DuckDB verification, deterministic hashtag/topic metrics, provenance, coverage, confidence, limitations, typed HTTP handlers for health, topics, Human Pulse, and a non-payable catalog.
- Data mode: `fixture` only. Every response makes that explicit; no fixture is presented as an observed social insight.
- Test evidence: API integration, metric determinism, byte-budget guards, and DuckDB runtime tests pass.

## Milestone 4 — local Monad contract and Envio event scaffold

- Status: complete locally; undeployed
- Implemented: `PulseIntelligenceMarket`, exact-price purchases, topic/product/purchase binding, replay prevention, indexable purchase event, and inactive Envio schema/handler scaffold.
- Test evidence: Solidity compiles and is exercised in an in-memory EVM. The test validates product setup, wrong-amount rejection, successful event emission, and duplicate purchase rejection.
- Safety: no wallet, RPC transaction, contract deployment, payment, Envio token, or paid inference was used.

## Next

- Obtain an approved, bounded data source or a legal/product decision to use a research-only `utopiar` sample, then build the DuckDB `httpfs` row-group sampler.
- Add server-side payment confirmation and entitlement storage before any testnet deployment.
- After an approved deployment, set the verified address/block in `indexer/config.yaml`, configure Envio credentials, and implement registered-demo-agent attribution.
