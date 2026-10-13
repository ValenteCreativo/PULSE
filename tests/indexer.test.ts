import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compilePulseMarket } from "../src/contract/compile.js";
import { toIndexedPurchase } from "../src/indexer/purchase.js";

describe("Envio integration contract", () => {
  it("keeps the indexed event schema aligned with the compiled contract ABI", async () => {
    const abi = (await compilePulseMarket()).abi as Array<{ type?: string; name?: string; inputs?: Array<{ name: string; type: string; indexed?: boolean }> }>;
    const event = abi.find((item) => item.type === "event" && item.name === "IntelligencePurchased");
    assert.deepEqual(event?.inputs?.map((input) => [input.name, input.type, input.indexed]), [["buyer", "address", true], ["topicId", "bytes32", true], ["productId", "bytes32", true], ["amount", "uint256", false], ["purchaseId", "bytes32", false]]);
  });

  it("creates a stable duplicate-safe primary key", () => {
    const purchase = toIndexedPurchase({ chainId: 10143, buyer: "0x0000000000000000000000000000000000000bcd", topicId: `0x${"01".repeat(32)}`, productId: `0x${"02".repeat(32)}`, amount: 1n, purchaseId: `0x${"03".repeat(32)}`, transactionHash: `0x${"04".repeat(32)}`, blockNumber: 1n, timestamp: 1n });
    assert.equal(purchase.id, `10143-0x${"04".repeat(32)}-0x${"03".repeat(32)}`);
  });
});
