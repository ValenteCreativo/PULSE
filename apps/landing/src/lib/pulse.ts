/**
 * PULSE integration anchor — DOCUMENTATION ONLY (no live wiring yet).
 *
 * This landing page (`apps/landing`) is the standalone product face. The real
 * PULSE backend lives in the separate `apps/web` service and is intentionally
 * NOT imported here, so the two stay isolated and the backend keeps working
 * untouched.
 *
 * TODO(pulse): when the landing is pointed at the real backend, the agent-facing
 * intelligence API is served by `apps/web` under `/api/v1/*` (e.g.
 * `/api/v1/intelligence/catalog` for discovery). Reach it via a same-origin
 * proxy or an absolute URL — the exact base is TBD and belongs in an env var
 * (e.g. `NEXT_PUBLIC_PULSE_API_URL`), never hardcoded.
 *
 * TODO(pulse): the "pay in MON on Monad testnet" step settles against the Monad
 * testnet contract `0x0a14814aa3d4fd9c2e17090af23a655204993bff` (chain id
 * 10143). The demo's copy-paste "copy ''' … ''' and pay in MON" snippet is a
 * DISPLAY-ONLY block — see the `homeHero.closing` TODO in
 * `src/data/mocks/home.ts`. Never add a code path that broadcasts a transaction
 * or spends funds from this landing page.
 */
export {};
