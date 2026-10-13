# PULSE Envio indexer scaffold

This configuration targets the verified Monad testnet PULSE contract at `0x0a14814aa3d4fd9c2e17090af23a655204993bff`, starting from deployment block `70583679`. It contains no invented transactions or synthetic Agent Pulse.

The configured Monad testnet chain is served by Envio HyperSync: an authenticated read-only height request returned HTTP 200 during setup. Therefore this indexer deliberately uses HyperSync rather than adding an RPC sync configuration. HyperIndex still needs Docker or Podman to run its local Postgres and Hasura services.

## Envio Cloud handoff

For the public demo, prefer Envio Cloud over local Docker. Connect the operator-authorized GitHub repository, create an indexer with **Indexer Directory** set to `indexer`, then select the release branch (`main` until an operator chooses another protected release branch). Cloud builds only this directory. It does not receive ignored files or local `.env` values.

Monad testnet is served through HyperSync, so no custom Monad RPC URL is needed for this configuration. Envio Cloud supplies the hosted indexer stack and publishes the resulting GraphQL endpoint after a successful sync. Record that public endpoint in the demo environment only after Cloud displays it.

Before enabling it locally:

1. Supply `ENVIO_API_TOKEN` locally; it is required by current HyperIndex/HyperSync workflows.
2. Install/use the Envio CLI in this folder, then run code generation and local development. Docker or Podman is required unless `ENVIO_PG_HOST` points to an operator-managed Postgres instance.
3. Verify that the first indexed block is `70583679` and that no purchase rows exist until a real purchase event occurs.

The `Purchase` ID combines chain, transaction hash, and log index. This makes event processing idempotent during retries and chain reorganizations. Wallets are not classified as agents here; a later server-side registry will separately attribute demo-agent wallets.
