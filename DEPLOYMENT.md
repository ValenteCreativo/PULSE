# Monad testnet deployment checklist

The repository is deployment-ready but has not been deployed. The deploy command is hard-gated and must not be run without explicit approval.

## Minimum prerequisites

- A fresh EVM wallet reserved for Monad testnet, with no mainnet assets or production secrets.
- Testnet MON sufficient for deployment gas, obtained through an authorized testnet faucet; no purchased MON is required.
- `MONAD_RPC_URL` that returns chain ID `10143`.
- A secure server-only value for `PULSE_DEPLOYER_PRIVATE_KEY`. It must never enter browser code, git, logs, or `.env.example`.
- A named operator approval immediately before setting `PULSE_DEPLOY_CONFIRM=MONAD_TESTNET`.
- `ENVIO_API_TOKEN` only after a contract address and deployment block are verified.

## Secure local configuration

Use exactly `/Users/valedev/Documents/Pulse/.env`. It is Git-ignored; do not put secrets in `.env.example`, a shell history, browser code, or this chat.

```bash
cd /Users/valedev/Documents/Pulse
cp .env.example .env
chmod 600 .env
```

Open `.env` in a local editor and set only these deployment-preflight values:

```dotenv
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143
PULSE_DEPLOYER_PRIVATE_KEY=0x... # paste locally; never send it here
```

Leave `PULSE_DEPLOY_CONFIRM` empty. The read-only preflight derives the public address locally and never prints or transmits the private key.

## Before any transaction

1. Run `pnpm check` and `pnpm test`.
2. Run `pnpm contract:prepare`; inspect the generated local artifact and bytecode size.
3. Run `pnpm deploy:preflight`. Confirm its chain ID is 10143, its RPC host is `testnet-rpc.monad.xyz`, its public address is the intended fresh testnet wallet, and its balance covers the printed gas estimate.
4. Record the final transaction hash, contract address, deployment block, compiler version, and artifact checksum.
5. Replace the zero address and `start_block` in `indexer/config.yaml`, then run Envio code generation with its token.
6. Configure server-side `PULSE_CONTRACT_ADDRESS`, `MONAD_CHAIN_ID=10143`, and at least two confirmations before enabling paid delivery.

## Explicit deployment command

Only after the above and explicit approval:

```bash
PULSE_DEPLOY_CONFIRM=MONAD_TESTNET pnpm deploy:monad-testnet
```

The command refuses missing credentials, an invalid private key, or an RPC that is not chain 10143. It makes a real transaction once these checks pass.

## Verified deployment evidence — Monad testnet

- Contract: `PulseIntelligenceMarket`
- Chain ID: `10143` (Monad Testnet)
- Contract address: `0x0a14814aa3d4fd9c2e17090af23a655204993bff`
- Deployment transaction: `0x6817388a430dc71f45039ceedcced17dc9e876967e9403ef72e7786a3d7d3d2b`
- Block: `70583679`
- Constructor arguments: none
- Gas limit / used: `370746` / `370746`
- Actual transaction fee: `0.037816092 MON` (below the authorized `0.10 MON` cap)
- Runtime bytecode: verified against the compiled artifact after normalizing compiler immutable references.
- Explorer: `https://testnet.monadvision.com/tx/0x6817388a430dc71f45039ceedcced17dc9e876967e9403ef72e7786a3d7d3d2b`

Add the public address to the local Git-ignored `.env` before enabling server verification:

```dotenv
PULSE_CONTRACT_ADDRESS=0x0a14814aa3d4fd9c2e17090af23a655204993bff
PULSE_MIN_CONFIRMATIONS=2
```
