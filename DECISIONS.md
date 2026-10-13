# Decisions

## 2026-10-12 — Source access is a hard precondition

The specified Hugging Face dataset currently returns HTTP 401 (`Invalid username or password`) for both the dataset page and API metadata endpoint from this environment. PULSE will not bypass access controls or substitute undocumented remote data. The ingestion preflight returns an explicit `inaccessible` result and prevents sampling.

## 2026-10-12 — Bounded transport before DuckDB

DuckDB is not installed in the current environment. The initial ingestion contract is independent of DuckDB and validates repository metadata, file candidates, and byte/row limits first. A later adapter may use DuckDB `httpfs` only after an accessible Parquet file and its metadata have been verified.

## 2026-10-12 — Settlement remains unimplemented

Mesh402's Hedera/Blocky402 pattern is useful for exact requirement comparison, one-shot redemption, receipt validation, and redaction. It is not copied as a Monad implementation. Monad x402/facilitator compatibility must be independently verified before settlement work begins.

## 2026-10-12 — Dataset alternatives are constrained research sources

`utopiar/tiktok-videos-4b` is publicly accessible and exposes 27 Parquet files. Its card declares `research-use`, says captions are personal data, and states collection was contrary to TikTok terms. It is eligible only for a clearly labeled research/demo sample after a product/legal decision; it is not treated as commercially reusable. A bounded resolver check showed `videos-00.parquet` is 10,697,285,411 bytes, so the current 50 MB budget rejects it before any read. `haoxin1998/SocialComputing_TikTokDataset` returned HTTP 401 and is not used.

## 2026-10-12 — Monad settlement is direct-contract first

Monad documents testnet as EVM-compatible with chain ID 10143 and native MON. Current documentation mentions x402 proxies on mainnet, but this audit did not verify a supported testnet facilitator/asset path. PULSE therefore implements an auditable native-MON contract locally first and leaves x402 as a separately verified adapter. No deployment or payment occurred.

## 2026-10-12 — Envio is scaffolded but intentionally inactive

The Envio HyperIndex configuration captures the contract event schema using Monad testnet chain ID 10143. Its address is an inert zero-address placeholder until an approved deployment exists. Current Envio documentation requires an API token for local HyperSync-backed workflows; no token was requested or used.

## 2026-10-12 — Entitlements verify logs, not submitted claims

The server accepts an entitlement only after a successful receipt is on the expected chain, has the configured confirmation depth, and contains a matching `IntelligencePurchased` event emitted by the configured contract. Buyer, product, topic, amount, transaction hash, and purchase ID are all compared against the receipt. The local durable store treats both transaction hash and purchase ID as unique, preventing duplicate redemption across restarts.

## 2026-10-12 — Monad testnet contract deployment recorded

`PulseIntelligenceMarket` was deployed once to Monad testnet (chain 10143) at `0x0a14814aa3d4fd9c2e17090af23a655204993bff` in block `70583679`. The transaction consumed `0.037816092 MON`, below the explicit `0.10 MON` cap. Runtime bytecode matched the locally compiled artifact after immutable-reference normalization. This records a contract deployment only; no intelligence product has been configured or purchased.
