import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeAttentionGap } from "../src/pulse/attention-gap.js";
import { computeAgentPulse } from "../src/pulse/agent-pulse.js";
import { toIndexedPurchase } from "../src/indexer/purchase.js";
import { demoRecords } from "../src/fixtures/demo-records.js";
import { computeHumanPulse } from "../src/pulse/human-pulse.js";

const wallet = "0x0000000000000000000000000000000000000bcd";
const hash = (suffix: string) => `0x${suffix.padStart(64, "0")}`;
const purchase = (topicId: string, amount: bigint, suffix: string) => toIndexedPurchase({ chainId: 10143, buyer: wallet, topicId: hash(topicId), productId: hash("2"), amount, purchaseId: hash(suffix), transactionHash: hash(`a${suffix}`), blockNumber: 10n, timestamp: 1_700_000_000n });

describe("Agent Pulse and Attention Gap", () => {
  it("does not infer agents or gaps when no registered agent activity exists", () => {
    const agent = computeAgentPulse([], [wallet]);
    assert.equal(agent.status, "insufficient-data");
    assert.equal(computeAttentionGap(computeHumanPulse(demoRecords, { mode: "fixture" }), agent).status, "unavailable");
  });

  it("aggregates only registered buyers and marks low-volume gaps preliminary", () => {
    const ai = hash("1");
    const agent = computeAgentPulse([purchase("1", 100n, "3"), purchase("1", 50n, "4")], [wallet]);
    assert.equal(agent.status, "available");
    assert.equal(agent.topics[0]?.topicId, ai);
    assert.equal(agent.topics[0]?.totalAmount, 150n);
    const human = computeHumanPulse(demoRecords, { mode: "fixture" });
    const gap = computeAttentionGap(human, { ...agent, topics: agent.topics.map((topic) => ({ ...topic, topicId: topic.topicId === ai ? "ai" : topic.topicId })) });
    assert.equal(gap.status, "preliminary");
    assert.equal(gap.topics.find((topic) => topic.topicId === "ai")?.agentPurchases, 2);
  });
});
