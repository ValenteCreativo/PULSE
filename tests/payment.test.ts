import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encodeAbiParameters, encodeEventTopics, keccak256, toHex, type Hex } from "viem";
import { InMemoryEntitlementStore, PaymentReplayError } from "../src/payment/entitlements.js";
import { PaymentVerificationError, PaymentVerifier, purchaseEvent, type PaymentRpc } from "../src/payment/verify.js";

const contract = "0x0000000000000000000000000000000000000abc";
const buyer = "0x0000000000000000000000000000000000000bcd";
const topicId = keccak256(toHex("ai"));
const productId = keccak256(toHex("human-pulse:ai"));
const purchaseId = keccak256(toHex("purchase-1"));
const transactionHash = keccak256(toHex("transaction-1"));
const amount = 100n;
const topics = encodeEventTopics({ abi: [purchaseEvent], eventName: "IntelligencePurchased", args: { buyer, topicId, productId } }).filter((topic): topic is Hex => topic !== null) as [Hex, ...Hex[]];
const data = encodeAbiParameters([{ type: "uint256" }, { type: "bytes32" }], [amount, purchaseId]);
const rpc = (overrides: Partial<{ chainId: number; head: bigint; status: "success" | "reverted"; logs: readonly { address: string; topics: [Hex, ...Hex[]]; data: Hex }[] }> = {}): PaymentRpc => ({
  getChainId: async () => overrides.chainId ?? 10143,
  getBlockNumber: async () => overrides.head ?? 12n,
  getTransactionReceipt: async () => ({ status: overrides.status ?? "success", blockNumber: 10n, transactionHash, logs: overrides.logs ?? [{ address: contract, topics, data }] }),
});
const request = { transactionHash, buyer, topicId, productId, amount };

describe("payment entitlement verification", () => {
  it("verifies every event binding and atomically rejects concurrent replay", async () => {
    const verifier = new PaymentVerifier(rpc(), { chainId: 10143, contractAddress: contract, minConfirmations: 2n });
    const verified = await verifier.verify(request);
    const store = new InMemoryEntitlementStore();
    const results = await Promise.allSettled([store.redeem(verified), store.redeem(verified)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected" && result.reason instanceof PaymentReplayError).length, 1);
  });

  it("rejects wrong chain, unconfirmed, reverted, and mismatched receipts", async () => {
    await assert.rejects(() => new PaymentVerifier(rpc({ chainId: 1 }), { chainId: 10143, contractAddress: contract, minConfirmations: 2n }).verify(request), (error: unknown) => error instanceof PaymentVerificationError && error.code === "WRONG_CHAIN");
    await assert.rejects(() => new PaymentVerifier(rpc({ head: 10n }), { chainId: 10143, contractAddress: contract, minConfirmations: 2n }).verify(request), /Need 2 confirmations/);
    await assert.rejects(() => new PaymentVerifier(rpc({ status: "reverted" }), { chainId: 10143, contractAddress: contract, minConfirmations: 2n }).verify(request), /reverted/);
    await assert.rejects(() => new PaymentVerifier(rpc({ logs: [] }), { chainId: 10143, contractAddress: contract, minConfirmations: 2n }).verify(request), /No matching/);
  });
});
