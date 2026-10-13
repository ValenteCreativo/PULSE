# PULSE

Attention intelligence for agents: deterministic Human Pulse from social-data samples, plus attributable Agent Pulse from later Monad purchase events.

## Current status

Human Pulse and its typed API work in clearly labeled fixture mode, with embedded DuckDB verification. The native-MON purchase contract is deployed on Monad testnet; no intelligence purchases have been made. See `PROGRESS.md` for source and settlement limitations.

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

## Envio Cloud publication

The Cloud deployment directory is `indexer/`. It is self-contained and contains no local environment file or dataset. Envio Cloud must be connected to an operator-authorized GitHub repository; do not upload `.env`. See `indexer/README.md` for the Cloud handoff steps.

## Data limitations

Results are historical sampled observations, never live attention. The pipeline must report sampling coverage, freshness, missing fields, and source provenance with derived metrics.
