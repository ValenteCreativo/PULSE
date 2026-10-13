import { createPublicClient, createWalletClient, formatEther, http, parseEther, type Chain, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compilePulseMarket } from "../src/contract/compile.js";

const expectedChainId = 10143;
const maxFee = parseEther("0.10");
if (process.env.PULSE_DEPLOY_CONFIRM !== "MONAD_TESTNET") throw new Error("Refusing deployment: set PULSE_DEPLOY_CONFIRM=MONAD_TESTNET only after explicit operator approval.");
const rpcUrl = process.env.MONAD_RPC_URL;
const privateKey = process.env.PULSE_DEPLOYER_PRIVATE_KEY;
if (!rpcUrl || !privateKey) throw new Error("MONAD_RPC_URL and PULSE_DEPLOYER_PRIVATE_KEY are required for deployment.");
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("PULSE_DEPLOYER_PRIVATE_KEY must be a 32-byte hex private key.");
const chain: Chain = { id: expectedChainId, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } };
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
if (await publicClient.getChainId() !== expectedChainId) throw new Error(`Refusing deployment: RPC is not Monad testnet chain ${expectedChainId}.`);
const account = privateKeyToAccount(privateKey as `0x${string}`);
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
const artifact = await compilePulseMarket();
const [balance, estimatedGas, gasPrice] = await Promise.all([
  publicClient.getBalance({ address: account.address }),
  publicClient.estimateGas({ account: account.address, data: artifact.bytecode }),
  publicClient.getGasPrice(),
]);
const maximumFee = estimatedGas * gasPrice;
if (maximumFee > maxFee) throw new Error(`Refusing deployment: maximum fee ${formatEther(maximumFee)} MON exceeds authorized cap 0.10 MON.`);
if (balance < maximumFee) throw new Error(`Refusing deployment: deployer balance does not cover maximum fee ${formatEther(maximumFee)} MON.`);
const hash = await walletClient.deployContract({ abi: artifact.abi as [], bytecode: artifact.bytecode, gas: estimatedGas, gasPrice });
const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2 });
if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`Deployment failed or missing contract address: ${hash}`);
const deployedCode = await publicClient.getBytecode({ address: receipt.contractAddress });
const normalizeRuntime = (code: Hex): Hex => {
  const normalized = code.slice(2).split("");
  for (const references of Object.values(artifact.immutableReferences)) for (const reference of references) {
    const start = reference.start * 2;
    normalized.splice(start, reference.length * 2, ..."0".repeat(reference.length * 2));
  }
  return `0x${normalized.join("")}`;
};
if (!deployedCode || normalizeRuntime(deployedCode) !== normalizeRuntime(artifact.deployedBytecode)) throw new Error("Deployment receipt succeeded but runtime bytecode does not match the compiled artifact.");
const actualFee = receipt.gasUsed * receipt.effectiveGasPrice;
process.stdout.write(JSON.stringify({
  chainId: expectedChainId, deployerAddress: account.address, constructorArguments: [], transactionHash: hash, contractAddress: receipt.contractAddress,
  blockNumber: receipt.blockNumber.toString(), gasLimit: estimatedGas.toString(), gasPriceWei: gasPrice.toString(), maximumFeeMON: formatEther(maximumFee),
  actualGasUsed: receipt.gasUsed.toString(), actualFeeMON: formatEther(actualFee), runtimeBytecodeVerified: true,
}, null, 2) + "\n");
