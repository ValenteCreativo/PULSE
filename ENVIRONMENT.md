# PULSE hosted environment

## Envio GraphQL

Set `PULSE_ENVIO_GRAPHQL_URL` to the hosted Envio GraphQL endpoint in local `.env` and in Vercel's server-side Environment Variables for Production and Preview.

Do not use a `NEXT_PUBLIC_` prefix: the backend and API route should query Envio, keeping the integration swappable without coupling browser code to a provider URL. The endpoint is public, but no token belongs in Vercel for Envio Cloud hosted indexing.

Current hosted endpoint: `https://indexer.dev.hyperindex.xyz/a0a89c4/v1/graphql`.
