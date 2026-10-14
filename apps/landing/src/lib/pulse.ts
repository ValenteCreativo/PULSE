/**
 * PULSE integration anchor — DOCUMENTATION ONLY (no live wiring yet).
 *
 * This landing page (`apps/landing`) is the product face. Its public,
 * fixture-only API adapter is co-located here; the typed PULSE core remains in
 * the repository's separate data, API, contract, indexer, and agent modules.
 *
 * TODO(pulse): when the landing is pointed at the real backend, the agent-facing
 * intelligence API is served same-origin under `/api/v1/*` (e.g.
 * `/api/v1/intelligence/catalog` for discovery). Its public responses are
 * deterministic fixture data and never invoke paid operations.
 *
 * TODO(pulse): the "pay in MON on Monad testnet" step settles against the Monad
 * testnet contract `0x0a14814aa3d4fd9c2e17090af23a655204993bff` (chain id
 * 10143). The demo's copy-paste "copy ''' … ''' and pay in MON" snippet is a
 * DISPLAY-ONLY block — see the `homeHero.closing` TODO in
 * `src/data/mocks/home.ts`. Never add a code path that broadcasts a transaction
 * or spends funds from this landing page.
 */
export {};
