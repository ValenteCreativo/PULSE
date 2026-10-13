# PULSE

> Human attention intelligence for autonomous AI content agents.

PULSE is an attention-intelligence API. It supplies human attention signals so autonomous AI content agents can discover what people care about, identify content opportunities, and decide what to create next. PULSE does not create content.

**We provide the intelligence. Your agents take action.**

## The product story

**Human Pulse — what humans care about.** Topic-level human attention intelligence for content discovery and decision-making. Today it runs in clearly labeled deterministic fixture mode, with embedded DuckDB verification. It is not a live social-data feed.

**Agent Pulse — what AI agents pay to understand.** Autonomous agents purchase topic intelligence on Monad. Those onchain purchases become observable economic demand signals. Agent Pulse measures purchases made in PULSE only, and is currently empty: no intelligence products have been purchased.

**Attention Gap — where human interest and agent demand diverge.** Comparing human attention with observed agent purchases can surface content opportunities humans want but agents overlook. It stays unavailable until enough verified agent-demand data exists.

## Who it's for

Builders of autonomous content agents: AI-operated YouTube channels, short-form video accounts, newsletters, and other creator-agent workflows that need to decide what to create.

## Use case

Your AI YouTube agent needs its next video idea. Instead of guessing, it queries PULSE to find topics attracting human interest, evaluates their relevance, and selects what to create.

## Architecture

Data, API, contract, indexer, and agent concerns are kept in separate modules.

- **Human Pulse data** — deterministic, fixture-mode topic metrics with provenance, coverage, confidence, and limitations; verified with embedded DuckDB.
- **Public API** — a read-only `/api/v1` surface (`health`, `status`, `topics`, `human-pulse`, `agent-pulse`, `attention-gap`, `intelligence/catalog`). Responses are JSON with `cache-control: no-store` and self-report their state (`mode`, `indexer.status`, `payments.status`).
- **Monad settlement** — an auditable native-MON contract, `PulseIntelligenceMarket`, deployed to Monad testnet (chain `10143`), contract `0x0a14814aa3d4fd9c2e17090af23a655204993bff`, block `70583679`. Monad settles intelligence purchases. It is settlement infrastructure, not a social-attention data provider.
- **Envio indexing** — an Envio HyperIndex configuration that targets the deployed contract from its deployment block to make agent demand queryable. Envio is indexing infrastructure, not a social-attention data provider. The Cloud deployment directory is `indexer/`; it is self-contained and contains no local environment file or dataset.
- **Agent** — a Nebius buyer-model boundary disabled by default and a purchase tool that produces dry-run plans unless a per-call broadcast authorization is supplied, with atomic per-product, per-purchase, daily-count, and daily-MON budget guards.
- **Web** — a production-built Next.js 16 cinematic frontend plus the public read-only `/api/v1` routes.

## Quickstart

Root scripts (verbatim) plus the `apps/web` dev passthrough:

```bash
pnpm install
pnpm check              # tsc --noEmit
pnpm test               # builds core, runs node --test
pnpm dataset:preflight
pnpm dataset:sample     # refuses unbounded remote scans by design
pnpm pulse:demo:dry     # dry-run, spends nothing

# Web app (apps/web):
pnpm --dir apps/web dev # apps/web script via --dir (NOT a root script)
pnpm web:build          # next build --webpack
pnpm web:check          # tsc --noEmit for apps/web
```

`dataset:sample` intentionally refuses to retrieve records until source accessibility and a bounded Parquet plan are confirmed; it never performs an unbounded remote scan. `contract:prepare` compiles the local deployment artifact only. `deploy:monad-testnet` is deliberately blocked unless an operator supplies all server-side credentials and the exact `PULSE_DEPLOY_CONFIRM=MONAD_TESTNET` confirmation; see `DEPLOYMENT.md`. Paid operations default to dry-run and are never invoked by tests.

## Deployment status (honest)

- **Human Pulse:** fixture mode only, deterministic, embedded DuckDB verification. No fixture is presented as an observed social insight.
- **Contract:** deployed to Monad testnet (chain `10143`), contract `0x0a14814aa3d4fd9c2e17090af23a655204993bff`, block `70583679`; no intelligence purchases executed. A non-executing first-purchase plan caps one testnet intelligence product at `0.005 MON` and its purchase fee at `0.002 MON` (`0.007 MON` maximum exposure); product configuration, fresh preflight, and separate Nebius/broadcast approvals remain mandatory. This is a capped plan, not an executed purchase.
- **Envio:** code generation and HyperSync connectivity complete; local service startup blocked by missing Docker/Podman. Envio is scaffolded but intentionally inactive, and Monad settlement is direct-contract-first on chain `10143`. Cloud dashboard authorization remains an operator action. Envio Cloud must be connected to an operator-authorized GitHub repository; do not upload `.env`. See `indexer/README.md` for the Cloud handoff steps.
- **Repository:** published on GitHub (`main`) at `https://github.com/ValenteCreativo/PULSE`; Vercel import remains an operator action.
- **Web app:** `apps/web` is a production-built Next.js app exposing safe fixture-labelled `/api/v1` routes, configured for Vercel from the repository root.
- **Payments:** not configured; paid operations default to dry-run and are never invoked by tests.

The live API self-reports the safer runtime state this README does not exceed: `indexer.status: "awaiting-cloud"`, `payments.status: "not-configured"`, `livePurchasesEnabled: false`, and Agent Pulse computed from empty inputs.

## Data limitations

- Fixtures are clearly labeled, **not** live social trends.
- No real-time TikTok, YouTube, or Reddit access.
- No virality, revenue, ROI, or autonomous-publishing claims.
- Agent Pulse measures purchases made in PULSE only; currently empty.
- Attention Gap stays unavailable until enough verified agent-demand data exists.
- Monad and Envio are infrastructure (settlement + indexing), not social-attention data providers.

## GitHub repository description

> Human attention intelligence for AI agents. Discover what humans care about, observe what agents buy, powered by Monad and Envio.

## Links

- Agent interface: [/agents](https://github.com/ValenteCreativo/PULSE)
- Public manifest: `/api/v1/manifest.json`
- Machine discovery: `/llms.txt`
- Monad contract explorer: `https://testnet.monadvision.com/address/0x0a14814aa3d4fd9c2e17090af23a655204993bff`
