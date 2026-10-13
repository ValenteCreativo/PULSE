# PULSE demo web app

The public demo is a Next.js application with a fixture-labeled Human Pulse dashboard and safe read-only API routes under `/api/v1`.

## Vercel

Import `ValenteCreativo/PULSE` in Vercel and leave **Root Directory** as the repository root. Vercel uses the root `vercel.json`, installs the workspace lockfile, and runs `pnpm web:build`.

The public demo deliberately has no runtime secrets. Its payment route returns `PAYMENT_NOT_CONFIGURED`; production payment verification remains in the typed backend and requires separately authorized configuration.
