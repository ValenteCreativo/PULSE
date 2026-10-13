import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AutonomousBuyerAgent, NebiusBuyerModel, PaidInferenceDisabledError, type BuyerModel } from "../src/agent/nebius-buyer.js";
import { PurchaseTool } from "../src/agent/purchase-tool.js";
import { SpendLedger, SpendingPolicyError, type PurchaseIntent, type SpendingPolicy } from "../src/agent/spending.js";

const contract = "0x0000000000000000000000000000000000000abc";
const productId = `0x${"1".repeat(64)}`;
const intent: PurchaseIntent = { chainId: 10143, contractAddress: contract, topicId: `0x${"2".repeat(64)}`, productId, amount: 10n };
const policy: SpendingPolicy = { chainId: 10143, contractAddress: contract, allowedProductIds: [productId], maxPerPurchase: 10n, maxPerDay: 15n, maxPurchasesPerDay: 1 };
const purchaseId = `0x${"3".repeat(64)}`;

describe("autonomous buyer safeguards", () => {
  it("never invokes Nebius inference unless explicitly enabled", async () => {
    let calls = 0;
    const request = async () => { calls += 1; return new Response(); };
    await assert.rejects(() => new NebiusBuyerModel(undefined, request as typeof fetch).recommend(), PaidInferenceDisabledError);
    assert.equal(calls, 0);
  });

  it("uses the OpenAI-compatible Nebius endpoint only through an explicitly enabled, injected transport", async () => {
    let requestUrl = "";
    const response = await new NebiusBuyerModel({ baseUrl: "https://nebius.invalid/v1", apiKey: "test-key", model: "test-model", allowPaidInference: true }, async (url) => {
      requestUrl = String(url);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ shouldBuy: false, intent: null, rationale: "no fixture purchase" }) } }] }), { status: 200 });
    }).recommend();
    assert.equal(requestUrl, "https://nebius.invalid/v1/chat/completions");
    assert.equal(response.shouldBuy, false);
  });

  it("plans a purchase without broadcasting or reserving a budget", async () => {
    let broadcasts = 0;
    const ledger = new SpendLedger();
    const tool = new PurchaseTool(policy, ledger, { broadcast: async () => { broadcasts += 1; return { transactionHash: "0xabc" }; } });
    const result = await tool.execute(intent, purchaseId);
    assert.deepEqual({ mode: result.mode, status: result.status, transactionHash: result.transactionHash }, { mode: "dry-run", status: "planned", transactionHash: null });
    assert.equal(broadcasts, 0);
    assert.equal(ledger.entries().length, 0);
  });

  it("enforces contract, product, count, and aggregate spend caps before broadcast", async () => {
    const ledger = new SpendLedger();
    const tool = new PurchaseTool(policy, ledger, { broadcast: async () => ({ transactionHash: "0xabc" }) });
    await assert.rejects(() => tool.execute({ ...intent, contractAddress: "0x0000000000000000000000000000000000000def" }, purchaseId, { allowBroadcast: true }), SpendingPolicyError);
    await tool.execute(intent, purchaseId, { allowBroadcast: true });
    await assert.rejects(() => tool.execute(intent, `0x${"4".repeat(64)}`, { allowBroadcast: true }), SpendingPolicyError);
  });

  it("keeps autonomous recommendations in dry-run mode", async () => {
    const model: BuyerModel = { recommend: async () => ({ shouldBuy: true, intent, rationale: "fixture recommendation" }) };
    const result = await new AutonomousBuyerAgent(model, new PurchaseTool(policy, new SpendLedger())).run();
    assert.equal(result.status, "planned");
    assert.equal(result.mode, "dry-run");
  });
});
