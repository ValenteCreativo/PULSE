# PULSE

Attention intelligence for agents: deterministic Human Pulse from social-data samples, plus attributable Agent Pulse from later Monad purchase events.

## Current status

Human Pulse and its typed API work in clearly labeled fixture mode, with embedded DuckDB verification. A native-MON purchase contract is locally tested but not deployed. See `PROGRESS.md` for source and settlement limitations.

## Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm dataset:preflight
pnpm dataset:sample
pnpm pulse:demo:dry
```

`dataset:sample` intentionally refuses to retrieve records until source accessibility and a bounded Parquet plan are confirmed. None of the commands spends funds or submits transactions.

`contract:prepare` compiles the local deployment artifact only. `deploy:monad-testnet` is deliberately blocked unless an operator supplies all server-side credentials and the exact `PULSE_DEPLOY_CONFIRM=MONAD_TESTNET` confirmation; see `DEPLOYMENT.md`.

## Data limitations

Results are historical sampled observations, never live attention. The pipeline must report sampling coverage, freshness, missing fields, and source provenance with derived metrics.
