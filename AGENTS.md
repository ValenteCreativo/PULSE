# PULSE engineering rules

- Never commit secrets, private keys, raw social data, database files, or paid receipts.
- Dataset access is budgeted: inspect metadata first; never perform an unbounded remote scan.
- All numerical Human Pulse metrics must remain deterministic and reproducible.
- Paid operations default to dry-run and must never be invoked by tests.
- Keep data, API, contract, indexer, and agent concerns in separate modules.
