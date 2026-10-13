# PULSE Envio indexer scaffold

This scaffold is intentionally not runnable until a Monad testnet contract address and deployment block are recorded in `config.yaml`. It contains no invented transactions or synthetic Agent Pulse.

Before enabling it:

1. Deploy `PulseIntelligenceMarket` only with operator approval.
2. Replace the zero address and `start_block` with verified deployment evidence.
3. Supply `ENVIO_API_TOKEN` locally; it is required by current HyperIndex/HyperSync workflows.
4. Run Envio code generation and local development using the installed Envio CLI in this folder.

The `Purchase` ID combines chain, transaction hash, and log index. This makes event processing idempotent during retries and chain reorganizations. Wallets are not classified as agents here; a later server-side registry will separately attribute demo-agent wallets.
