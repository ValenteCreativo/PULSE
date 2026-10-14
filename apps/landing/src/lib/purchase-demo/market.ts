import { randomBytes } from "node:crypto";
import { decodeEventLog, decodeFunctionResult, encodeFunctionData, parseAbi, type Address, type Hex } from "viem";

export const MONAD_RPC_URL = "https://testnet-rpc.monad.xyz";
export const MONAD_CHAIN_ID = 10143;
export const MARKET_ADDRESS = "0x0a14814aa3d4fd9c2e17090af23a655204993bff" as Address;
export const PRODUCT_ID = "0x60db48e47d0e2a153f08aedbd63b69eb050eced25ab3300812ff521678e1003b" as Hex;
export const TOPIC_ID = "0xddcbc2f3cd78fe18022ddc814d17d15cf9b6233e57a7d34f0b059ed049ad5014" as Hex;

export const marketAbi = parseAbi([
  "function products(bytes32 productId) view returns (uint96 priceWei, bool active)",
  "function purchase(bytes32 productId, bytes32 topicId, bytes32 purchaseId) payable",
  "event IntelligencePurchased(address indexed buyer, bytes32 indexed topicId, bytes32 indexed productId, uint256 amount, bytes32 purchaseId)",
]);

type RpcResponse<T> = { result?: T; error?: { message?: string } };
type Receipt = { status: Hex; logs: Array<{ address: string; topics: Hex[]; data: Hex }> };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(MONAD_RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }), cache: "no-store" });
  const json = await response.json() as RpcResponse<T>;
  if (!response.ok || json.error || json.result === undefined) throw new Error(json.error?.message ?? "Monad RPC request failed.");
  return json.result;
}

export async function readProduct() {
  const data = encodeFunctionData({ abi: marketAbi, functionName: "products", args: [PRODUCT_ID] });
  const result = await rpc<Hex>("eth_call", [{ to: MARKET_ADDRESS, data }, "latest"]);
  const [priceWei, active] = decodeFunctionResult({ abi: marketAbi, functionName: "products", data: result }) as readonly [bigint, boolean];
  if (!active || priceWei <= BigInt(0)) throw new Error("human-pulse:ai is not active on Monad Testnet.");
  return { id: "human-pulse:ai", productId: PRODUCT_ID, topicId: TOPIC_ID, priceWei: priceWei.toString(), active, contractAddress: MARKET_ADDRESS, chainId: MONAD_CHAIN_ID };
}

export async function preparePurchase() {
  const product = await readProduct();
  const purchaseId = `0x${randomBytes(32).toString("hex")}` as Hex;
  const data = encodeFunctionData({ abi: marketAbi, functionName: "purchase", args: [PRODUCT_ID, TOPIC_ID, purchaseId] });
  return { ...product, purchaseId, data, value: `0x${BigInt(product.priceWei).toString(16)}` };
}

export async function verifyPurchase(hash: Hex, buyer: Address, purchaseId: Hex) {
  const receipt = await rpc<Receipt | null>("eth_getTransactionReceipt", [hash]);
  if (!receipt) return { state: "pending" as const };
  if (receipt.status !== "0x1") return { state: "reverted" as const };
  const event = receipt.logs.find((log) => {
    if (log.address.toLowerCase() !== MARKET_ADDRESS.toLowerCase()) return false;
    try {
      const decoded = decodeEventLog({ abi: marketAbi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
      const args = decoded.args as { buyer: Address; topicId: Hex; productId: Hex; purchaseId: Hex };
      return decoded.eventName === "IntelligencePurchased" && args.buyer.toLowerCase() === buyer.toLowerCase() && args.topicId === TOPIC_ID && args.productId === PRODUCT_ID && args.purchaseId === purchaseId;
    } catch { return false; }
  });
  return event ? { state: "confirmed" as const } : { state: "missing-event" as const };
}
