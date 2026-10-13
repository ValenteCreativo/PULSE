import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPulseApi, healthSchema } from "../src/api/server.js";
import { demoRecords } from "../src/fixtures/demo-records.js";
import { computeHumanPulse, humanPulseSchema } from "../src/pulse/human-pulse.js";
import { agentPulseSchema } from "../src/pulse/agent-pulse.js";
import { attentionGapSchema } from "../src/pulse/attention-gap.js";
import { PaymentReplayError, type Entitlement } from "../src/payment/entitlements.js";
import { keccak256, toHex } from "viem";

const api = createPulseApi(computeHumanPulse(demoRecords, { mode: "fixture", processedAt: new Date("2026-10-12T00:00:00Z") }));

describe("Intelligence API", () => {
  it("returns typed health and Human Pulse documents", async () => {
    const health = await api(new Request("http://pulse.local/api/v1/health"));
    assert.equal(health.status, 200);
    healthSchema.parse(await health.json());
    const pulse = await api(new Request("http://pulse.local/api/v1/human-pulse"));
    assert.equal(pulse.status, 200);
    assert.equal(humanPulseSchema.parse(await pulse.json()).mode, "fixture");
  });

  it("does not advertise paid intelligence before payments exist", async () => {
    const catalog = await api(new Request("http://pulse.local/api/v1/intelligence/catalog"));
    const body = await catalog.json() as { products: Array<{ availability: string; price: null }> };
    assert.ok(body.products.length > 0);
    assert.ok(body.products.every((product) => product.availability === "payment-not-yet-enabled" && product.price === null));
  });

  it("returns explicit insufficient-data Agent Pulse and Attention Gap states", async () => {
    const agent = await api(new Request("http://pulse.local/api/v1/agent-pulse"));
    assert.equal(agentPulseSchema.parse(await agent.json()).status, "insufficient-data");
    const gap = await api(new Request("http://pulse.local/api/v1/attention-gap"));
    assert.equal(attentionGapSchema.parse(await gap.json()).status, "unavailable");
  });

  it("exposes typed deployment status and rejects a replayed entitlement submission", async () => {
    const status = await api(new Request("http://pulse.local/api/v1/status"));
    assert.equal(status.status, 200);
    assert.equal((await status.json() as { indexer: { status: string } }).indexer.status, "awaiting-cloud");
    let calls = 0;
    const entitlement = {
      entitlementId: "00000000-0000-4000-8000-000000000001", transactionHash: keccak256(toHex("api-tx")), purchaseId: keccak256(toHex("api-purchase")),
      chainId: 10143, contractAddress: "0x0000000000000000000000000000000000000abc", buyer: "0x0000000000000000000000000000000000000bcd",
      topicId: keccak256(toHex("api-topic")), productId: keccak256(toHex("api-product")), amount: 1n, blockNumber: 1n, confirmations: 2n,
      verifiedAt: "2026-10-13T00:00:00.000Z", redeemedAt: "2026-10-13T00:00:00.000Z", status: "confirmed" as const,
    } satisfies Entitlement;
    const paidApi = createPulseApi(computeHumanPulse(demoRecords, { mode: "fixture" }), undefined, undefined, { paymentRedeemer: { redeem: async () => {
      calls += 1;
      if (calls > 1) throw new PaymentReplayError();
      return entitlement;
    } } });
    const request = JSON.stringify({ transactionHash: entitlement.transactionHash, buyer: entitlement.buyer, topicId: entitlement.topicId, productId: entitlement.productId, amount: "1" });
    assert.equal((await paidApi(new Request("http://pulse.local/api/v1/intelligence/entitlements", { method: "POST", body: request }))).status, 201);
    assert.equal((await paidApi(new Request("http://pulse.local/api/v1/intelligence/entitlements", { method: "POST", body: request }))).status, 409);
  });

  it("returns explicit errors for unsupported routes and methods", async () => {
    assert.equal((await api(new Request("http://pulse.local/api/v1/missing"))).status, 404);
    assert.equal((await api(new Request("http://pulse.local/api/v1/health", { method: "POST" }))).status, 405);
  });
});
