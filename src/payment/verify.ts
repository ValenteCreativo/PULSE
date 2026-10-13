import { decodeEventLog, parseAbiItem, type Hex } from "viem";
import { z } from "zod";
import { verifiedPurchaseSchema, type VerifiedPurchase } from "./entitlements.js";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const hex32 = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const purchaseRequestSchema = z.object({ transactionHash: hex32, buyer: address, topicId: hex32, productId: hex32, amount: z.coerce.bigint().positive() });
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;

export const purchaseEvent = parseAbiItem("event IntelligencePurchased(address indexed buyer, bytes32 indexed topicId, bytes32 indexed productId, uint256 amount, bytes32 purchaseId)");
type ReceiptLog = { address: string; topics: [Hex, ...Hex[]]; data: Hex };
type Receipt = { status: "success" | "reverted"; blockNumber: bigint; transactionHash: Hex; logs: readonly ReceiptLog[] };

export interface PaymentRpc {
  getChainId(): Promise<number>;
  getTransactionReceipt(hash: Hex): Promise<Receipt | null>;
  getBlockNumber(): Promise<bigint>;
}

export class PaymentVerificationError extends Error {
  constructor(readonly code: "WRONG_CHAIN" | "NOT_FOUND" | "REVERTED" | "UNCONFIRMED" | "EVENT_MISMATCH", message: string) { super(message); this.name = "PaymentVerificationError"; }
}

export class PaymentVerifier {
  constructor(private readonly rpc: PaymentRpc, private readonly config: { chainId: number; contractAddress: string; minConfirmations: bigint }) {}

  async verify(requestInput: PurchaseRequest): Promise<VerifiedPurchase> {
    const request = purchaseRequestSchema.parse(requestInput);
    const actualChainId = await this.rpc.getChainId();
    if (actualChainId !== this.config.chainId) throw new PaymentVerificationError("WRONG_CHAIN", `Expected chain ${this.config.chainId}, received ${actualChainId}`);
    const receipt = await this.rpc.getTransactionReceipt(request.transactionHash as Hex);
    if (!receipt) throw new PaymentVerificationError("NOT_FOUND", "Transaction receipt was not found");
    if (receipt.status !== "success") throw new PaymentVerificationError("REVERTED", "Transaction execution reverted");
    const head = await this.rpc.getBlockNumber();
    const confirmations = head >= receipt.blockNumber ? head - receipt.blockNumber + 1n : 0n;
    if (confirmations < this.config.minConfirmations) throw new PaymentVerificationError("UNCONFIRMED", `Need ${this.config.minConfirmations} confirmations; received ${confirmations}`);
    const event = receipt.logs.find((log) => {
      if (log.address.toLowerCase() !== this.config.contractAddress.toLowerCase()) return false;
      try {
        const decoded = decodeEventLog({ abi: [purchaseEvent], data: log.data, topics: log.topics });
        const args = decoded.args as { buyer: string; topicId: string; productId: string; amount: bigint; purchaseId: string };
        return args.buyer.toLowerCase() === request.buyer.toLowerCase() && args.topicId.toLowerCase() === request.topicId.toLowerCase() && args.productId.toLowerCase() === request.productId.toLowerCase() && args.amount === request.amount;
      } catch { return false; }
    });
    if (!event) throw new PaymentVerificationError("EVENT_MISMATCH", "No matching IntelligencePurchased event exists in the confirmed receipt");
    const decoded = decodeEventLog({ abi: [purchaseEvent], data: event.data, topics: event.topics });
    const args = decoded.args as { purchaseId: Hex };
    return verifiedPurchaseSchema.parse({ transactionHash: receipt.transactionHash, purchaseId: args.purchaseId, chainId: actualChainId, contractAddress: this.config.contractAddress, buyer: request.buyer, topicId: request.topicId, productId: request.productId, amount: request.amount, blockNumber: receipt.blockNumber, confirmations, verifiedAt: new Date().toISOString() });
  }
}
