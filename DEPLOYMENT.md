# Monad testnet deployment checklist

The repository is deployment-ready but has not been deployed. The deploy command is hard-gated and must not be run without explicit approval.

## Minimum prerequisites

- A fresh EVM wallet reserved for Monad testnet, with no mainnet assets or production secrets.
- Testnet MON sufficient for deployment gas, obtained through an authorized testnet faucet; no purchased MON is required.
- `MONAD_RPC_URL` that returns chain ID `10143`.
- A secure server-only value for `PULSE_DEPLOYER_PRIVATE_KEY`. It must never enter browser code, git, logs, or `.env.example`.
- A named operator approval immediately before setting `PULSE_DEPLOY_CONFIRM=MONAD_TESTNET`.
- `ENVIO_API_TOKEN` only after a contract address and deployment block are verified.

## Before any transaction

1. Run `pnpm check` and `pnpm test`.
2. Run `pnpm contract:prepare`; inspect the generated local artifact and bytecode size.
3. Confirm the RPC chain ID is 10143 and the deployer address is the intended fresh testnet wallet.
4. Record the final transaction hash, contract address, deployment block, compiler version, and artifact checksum.
5. Replace the zero address and `start_block` in `indexer/config.yaml`, then run Envio code generation with its token.
6. Configure server-side `PULSE_CONTRACT_ADDRESS`, `MONAD_CHAIN_ID=10143`, and at least two confirmations before enabling paid delivery.

## Explicit deployment command

Only after the above and explicit approval:

```bash
PULSE_DEPLOY_CONFIRM=MONAD_TESTNET pnpm deploy:monad-testnet
```

The command refuses missing credentials, an invalid private key, or an RPC that is not chain 10143. It makes a real transaction once these checks pass.
