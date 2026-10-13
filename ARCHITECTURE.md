# PULSE architecture

PULSE is organized around a deterministic human-attention pipeline and a separately attributable onchain demand pipeline.

```text
bounded source preflight -> normalized records -> Human Pulse metrics -> versioned API
Monad purchase events -> Envio indexer -> Agent Pulse -> Attention Gap
```

This milestone establishes the left side of the system. `src/data` never emits raw creator identifiers and persists provenance with every sample. Remote source inspection uses Hugging Face API metadata and HTTP `HEAD`/`Range` requests, with a byte budget enforced before any future Parquet reads.

Future adapters will expose the typed core through Next.js routes; payment verification and delivery will be server-only modules.
