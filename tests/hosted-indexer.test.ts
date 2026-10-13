import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { queryHostedPurchases } from "../src/indexer/hosted-client.js";
import { computeHostedAgentPulse } from "../src/pulse/hosted-agent-pulse.js";

const buyer = "0x0000000000000000000000000000000000000bcd";
const purchase = {
  id: "10143-0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-0", buyer,
  topicId: `0x${"1".repeat(64)}`, productId: `0x${"2".repeat(64)}`, amount: "5", purchaseId: `0x${"3".repeat(64)}`,
  transactionHash: `0x${"a".repeat(64)}`, blockNumber: "70583680", timestamp: "1760000000",
};
const hostedResponse = async () => new Response(JSON.stringify({ data: { Purchase: [purchase] } }), { status: 200 });

describe("hosted Envio integration", () => {
  it("maps the hosted Purchase entity into the shared Agent Pulse event shape", async () => {
    const purchases = await queryHostedPurchases("https://indexer.dev.hyperindex.xyz/example/v1/graphql", hostedResponse as typeof fetch);
    assert.equal(purchases[0]?.chainId, 10143);
    assert.equal(purchases[0]?.amount, 5n);
  });

  it("computes attributable Agent Pulse from hosted GraphQL results", async () => {
    const pulse = await computeHostedAgentPulse("https://indexer.dev.hyperindex.xyz/example/v1/graphql", [buyer], hostedResponse as typeof fetch);
    assert.equal(pulse.status, "available");
    assert.equal(pulse.attributablePurchases, 1);
  });
});
