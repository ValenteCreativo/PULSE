# PULSE

Attention intelligence for agents: deterministic Human Pulse from social-data samples, plus attributable Agent Pulse from later Monad purchase events.

## Current status

Milestone 1 provides a strict TypeScript foundation. Milestone 2 implements safe dataset preflight and normalization contracts. The specified source currently requires credentials from this environment; see `PROGRESS.md`.

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

## Data limitations

Results are historical sampled observations, never live attention. The pipeline must report sampling coverage, freshness, missing fields, and source provenance with derived metrics.
