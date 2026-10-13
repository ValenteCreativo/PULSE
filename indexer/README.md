# PULSE Envio indexer scaffold

This configuration targets the verified Monad testnet PULSE contract at `0x0a14814aa3d4fd9c2e17090af23a655204993bff`, starting from deployment block `70583679`. It contains no invented transactions or synthetic Agent Pulse.

Before enabling it:

1. Supply `ENVIO_API_TOKEN` locally; it is required by current HyperIndex/HyperSync workflows.
2. Install/use the Envio CLI in this folder, then run code generation and local development.
3. Verify that the first indexed block is `70583679` and that no purchase rows exist until a real purchase event occurs.

The `Purchase` ID combines chain, transaction hash, and log index. This makes event processing idempotent during retries and chain reorganizations. Wallets are not classified as agents here; a later server-side registry will separately attribute demo-agent wallets.
