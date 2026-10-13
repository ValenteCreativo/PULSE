# First PULSE intelligence purchase — prepared, not authorized

This is a Monad **testnet** plan only. Nothing in this file signs, sends, or pays for a transaction.

## Fixed limits

- Product value: at most **0.005 MON**.
- Purchase transaction fee: at most **0.002 MON** after a fresh estimate.
- Total exposure: at most **0.007 MON**.
- Frequency: exactly one purchase in the day.
- Contract: `0x0a14814aa3d4fd9c2e17090af23a655204993bff` on chain `10143` only.

## Preconditions before any authorization

1. The contract owner must configure exactly one active product at a price no higher than `0.005 MON`. This is a separate testnet write and has not been sent.
2. Select a real topic identifier and product identifier; do not invent values or substitute fixture data.
3. Run a fresh read-only preflight: chain ID, contract bytecode, active-product price, wallet address, balance, and purchase gas estimate. Stop if the total exceeds `0.007 MON`.
4. Obtain two separate operator approvals: one for any Nebius paid inference request and one for this one transaction broadcast.
5. Submit through the durable ledger-backed purchase tool, wait for confirmations, then redeem the receipt through the replay-safe entitlement endpoint.

No autonomous path may bypass these steps.
