import { createPublicClient, formatEther, getAddress, http, parseAbi, type Chain, type Hex } from "viem";
import { firstPurchaseBudget } from "../src/agent/first-purchase.js";

const chainId = 10143;
const rpcUrl = process.env.MONAD_RPC_URL;
const contractAddress = process.env.PULSE_CONTRACT_ADDRESS;
const buyer = process.env.PULSE_PURCHASE_BUYER;
const productId = process.env.PULSE_FIRST_PRODUCT_ID;
const topicId = process.env.PULSE_FIRST_TOPIC_ID;
const purchaseId = process.env.PULSE_FIRST_PURCHASE_ID;
if (!rpcUrl || !contractAddress || !buyer || !productId || !topicId || !purchaseId) throw new Error("Read-only purchase preflight requires MONAD_RPC_URL, PULSE_CONTRACT_ADDRESS, PULSE_PURCHASE_BUYER, PULSE_FIRST_PRODUCT_ID, PULSE_FIRST_TOPIC_ID, and PULSE_FIRST_PURCHASE_ID.");

const chain: Chain = { id: chainId, name: "Monad Testnet", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } };
const abi = parseAbi(["function products(bytes32 productId) view returns (uint96 priceWei, bool active)", "function purchase(bytes32 productId, bytes32 topicId, bytes32 purchaseId) payable"]);
const client = createPublicClient({ chain, transport: http(rpcUrl) });
if (await client.getChainId() !== chainId) throw new Error("Refusing preflight: RPC is not Monad testnet chain 10143.");
const account = getAddress(buyer);
const contract = getAddress(contractAddress);
const [code, balance, gasPrice, product] = await Promise.all([
  client.getCode({ address: contract }), client.getBalance({ address: account }), client.getGasPrice(),
  client.readContract({ address: contract, abi, functionName: "products", args: [productId as Hex] }),
]);
if (!code || code === "0x") throw new Error("Refusing preflight: no deployed code exists at the configured contract address.");
const [priceWei, active] = product;
if (!active) throw new Error("Refusing preflight: the configured product is inactive.");
if (priceWei > firstPurchaseBudget.maxProductPriceWei) throw new Error("Refusing preflight: product price exceeds the 0.005 MON cap.");
const gas = await client.estimateContractGas({ address: contract, abi, functionName: "purchase", args: [productId as Hex, topicId as Hex, purchaseId as Hex], account, value: priceWei });
const maximumFee = gas * gasPrice;
const maximumExposure = priceWei + maximumFee;
if (maximumFee > firstPurchaseBudget.maxTransactionFeeWei) throw new Error("Refusing preflight: estimated purchase fee exceeds the 0.002 MON cap.");
if (maximumExposure > firstPurchaseBudget.maxTotalExposureWei || balance < maximumExposure) throw new Error("Refusing preflight: wallet does not safely cover the capped purchase exposure.");
process.stdout.write(JSON.stringify({ chainId, contractAddress: contract, buyer: account, productId, topicId, purchaseId, priceMON: formatEther(priceWei), estimatedGas: gas.toString(), estimatedFeeMON: formatEther(maximumFee), maximumExposureMON: formatEther(maximumExposure), balanceMON: formatEther(balance), broadcast: false }, null, 2) + "\n");
