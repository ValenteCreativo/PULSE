# PULSE — agent guide

PULSE is an intelligence-marketplace prototype for autonomous AI creators. Its
thesis is simple: creation is increasingly abundant, while human attention is
scarce. PULSE explores how an agent can discover structured attention
intelligence, decide what to create, and purchase that intelligence through a
verifiable Monad testnet contract.

The primary user is an autonomous content-creation agent—or the operator
building one. PULSE is not a content generator, a social scheduler, or a claim
that virality can be predicted.

> Read [docs/VISION.md](docs/VISION.md) before making a major product,
> architecture, data-source, or marketplace decision.

## Fast orientation

| Area | Source of truth | What exists now |
| --- | --- | --- |
| Product surface | `apps/landing/` | Next.js 16 landing, agent routes, and browser-wallet purchase demo. |
| Public API | `apps/landing/src/lib/demo-api.ts` | Same-origin fixture-only `/api/v1/*` adapter. |
| Agent discovery | `apps/landing/src/app/llms.txt/route.ts` | `/llms.txt` and `/api/v1/manifest.json`. |
| Typed core | `src/` | Human Pulse, Agent Pulse, Attention Gap, payment, agent, and data modules. |
| Contract | `contracts/PulseIntelligenceMarket.sol` | Native-MON product configuration and replay-protected purchases. |
| Monad evidence | `DEPLOYMENT.md`, `DEMO_EVIDENCE.md` | Deployed contract and one verified testnet purchase. |
| Envio | `indexer/` | Event registration, entities, schema, and GraphQL queries. |
| Fixtures | `src/fixtures/demo-records.ts` | Deterministic synthetic development data. |
| Tests | `tests/` | Node tests for core, contract, API, data, payments, and indexing. |
| Operations | `scripts/`, `.env.example` | Guarded deployment and read-only preflight scripts. |
| Documentation | `README.md`, `docs/VISION.md`, `ARCHITECTURE.md`, `DECISIONS.md` | Public overview, strategy, and recorded decisions. |

## Conceptual model

### Human Pulse — implemented as sample intelligence

Human Pulse is the intelligence layer: structured topic signals intended to
help a creator decide what deserves attention. The public prototype currently
uses deterministic fixtures only. Do **not** describe fixture scores as live
TikTok, YouTube, Reddit, or cross-platform observations.

### Agent Pulse — implemented computation, no hosted evidence yet

Agent Pulse aggregates purchases only from wallets explicitly registered by an
operator. Its logic lives in `src/pulse/agent-pulse.ts`. A purchase event is not
automatically evidence that a buyer is an AI agent. The current public landing
returns `insufficient-data` because it has no indexed, attributable purchases.

### Attention Gap — research hypothesis with implemented guardrails

Attention Gap is the proposed comparison between Human Pulse and Agent Pulse.
`src/pulse/attention-gap.ts` intentionally returns `unavailable` until Agent
Pulse has sufficient attributable data. It is not a validated predictive model
or an opportunity score.

## Run and verify

Use the package manager declared at the repository root: pnpm `10.28.1`.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test

# Product surface
pnpm --dir apps/landing dev
# http://localhost:3000

# Build the current landing
pnpm build
pnpm landing:check
```

With the landing running, inspect only same-origin public routes:

```bash
curl -s http://localhost:3000/llms.txt
curl -s http://localhost:3000/api/v1/manifest.json
curl -s http://localhost:3000/api/v1/status
curl -s http://localhost:3000/api/v1/human-pulse
curl -s http://localhost:3000/api/v1/agent-pulse
curl -s http://localhost:3000/api/v1/attention-gap
```

The interactive endpoints are `GET /api/purchase-demo/product`, `POST
/api/purchase-demo/prepare`, and `POST /api/purchase-demo/verify`. Preparation
does not sign; a user-controlled browser wallet must approve any transaction.

### Monad evidence

- Network: Monad Testnet, chain ID `10143`
- Contract: [`0x0a14814aa3d4fd9c2e17090af23a655204993bff`](https://testnet.monadvision.com/address/0x0a14814aa3d4fd9c2e17090af23a655204993bff)
- Deployment: [`0x681738…d3d2b`](https://testnet.monadvision.com/tx/0x6817388a430dc71f45039ceedcced17dc9e876967e9403ef72e7786a3d7d3d2b), block `70583679`
- Verified purchase: [`0x6ac180…8042d`](https://testnet.monadvision.com/tx/0x6ac1809a7cf941d4cfca94b1848596134b415bf3fd35226835fb40bc5fa8042d), block `70831680`

Read `DEMO_EVIDENCE.md` for the decoded `IntelligencePurchased` event. Run
`pnpm contract:prepare` only to compile a local artifact. `pnpm
purchase:preflight` is read-only; it needs local `.env` inputs. The deployment
script is hard-gated by `PULSE_DEPLOY_CONFIRM=MONAD_TESTNET` and must never be
run without fresh, explicit human authorization.

### Envio

`indexer/config.yaml` registers `IntelligencePurchased` on the deployed Monad
contract from block `70583679`, using RPC sync. `indexer/src/EventHandlers.ts`
writes `Purchase`, `TopicDemand`, and `BuyerDemand`; `indexer/schema.graphql`
and `indexer/queries.graphql` define their query surface.

The handler and schema are implemented. The hosted Envio endpoint has **not**
verified the real purchase: provider-side deployment permissions blocked hosted
indexing, and a read query returned no `Purchase` row. Never claim hosted
Agent Pulse analytics are operating until independently verified.

## Data research boundary

The ingestion code only performs metadata inspection and creates bounded
sampling plans. It never performs an unbounded remote scan.

- Configured research target: [`kuben-developer/tiktok-videos-4b`](https://huggingface.co/datasets/kuben-developer/tiktok-videos-4b). Repository evidence records HTTP 401 metadata access; it was not ingested.
- Evaluated alternative: [`utopiar/tiktok-videos-4b`](https://huggingface.co/datasets/utopiar/tiktok-videos-4b). Its documented research-use and personal-data constraints, plus a >50 MB Parquet file, prevented ingestion.
- Evaluated fallback: [`haoxin1998/SocialComputing_TikTokDataset`](https://huggingface.co/datasets/haoxin1998/SocialComputing_TikTokDataset). Repository evidence records HTTP 401; it was not used.

See `DECISIONS.md`, `src/data/preflight.ts`, `src/data/sampling.ts`, and
`src/data/normalize.ts`. Do not infer a license, schema, sample, or commercial
right beyond those recorded facts.

## Non-negotiable operating rules

1. Never commit secrets, private keys, API tokens, raw social data, local
   databases, screen recordings, or paid receipts.
2. Never fabricate analytics, transaction evidence, Envio results, or live
   social intelligence.
3. Never present fixtures as observed attention data or classify a wallet as an
   agent without explicit registration.
4. Never bypass a dataset access restriction or exceed the configured bandwidth
   budget.
5. Paid operations stay dry-run by default. Never invoke Nebius or broadcast an
   onchain transaction without explicit, transaction-specific authorization.
6. Preserve separation among data, API, contract, indexer, and agent modules
   unless a requested change intentionally crosses that boundary.
7. Preserve the existing `apps/landing` architecture and read its local
   `apps/landing/AGENTS.md` before touching landing code.

## References

- [Repository](https://github.com/ValenteCreativo/PULSE)
- [README](README.md)
- [Vision](docs/VISION.md)
- [Contract source](contracts/PulseIntelligenceMarket.sol)
- [Deployment checklist](DEPLOYMENT.md)
- [Envio configuration](indexer/config.yaml)

No verified public PULSE application URL or published video URL is recorded in
this repository. Do not invent one.
