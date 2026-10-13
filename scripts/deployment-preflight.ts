import { createPublicClient, formatEther, http, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compilePulseMarket } from "../src/contract/compile.js";

const expectedChainId = 10143;
const rpcUrl = process.env.MONAD_RPC_URL;
const privateKey = process.env.PULSE_DEPLOYER_PRIVATE_KEY;
if (!rpcUrl || !privateKey) throw new Error("Create the Git-ignored .env with MONAD_RPC_URL and PULSE_DEPLOYER_PRIVATE_KEY before preflight.");
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("PULSE_DEPLOYER_PRIVATE_KEY must be a 32-byte hex private key.");
const parsedUrl = new URL(rpcUrl);
if (parsedUrl.protocol !== "https:") throw new Error("Refusing a non-HTTPS RPC URL.");
const chain: Chain = { id: expectedChainId, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } };
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const actualChainId = await publicClient.getChainId();
if (actualChainId !== expectedChainId) throw new Error(`Refusing preflight: RPC chain is ${actualChainId}, not Monad testnet ${expectedChainId}.`);
const account = privateKeyToAccount(privateKey as `0x${string}`);
const artifact = await compilePulseMarket();
const [balance, gas, gasPrice] = await Promise.all([
  publicClient.getBalance({ address: account.address }),
  publicClient.estimateGas({ account: account.address, data: artifact.bytecode }),
  publicClient.getGasPrice(),
]);
const estimatedCost = gas * gasPrice;
process.stdout.write(JSON.stringify({
  deployerAddress: account.address,
  network: { name: "Monad Testnet", chainId: actualChainId, rpcHost: parsedUrl.host },
  contractName: "PulseIntelligenceMarket",
  balance: { wei: balance.toString(), mon: formatEther(balance) },
  estimatedDeployment: { gasUnits: gas.toString(), gasPriceWei: gasPrice.toString(), costWei: estimatedCost.toString(), costMON: formatEther(estimatedCost) },
  readiness: { configurationValid: true, balanceCoversEstimate: balance >= estimatedCost, deploymentBlocked: true },
}, null, 2) + "\n");
