import { z } from "zod";
import type { AgentPulse } from "./agent-pulse.js";
import type { HumanPulse } from "./human-pulse.js";

export const attentionGapSchema = z.object({
  status: z.enum(["available", "preliminary", "unavailable"]), limitations: z.array(z.string()),
  topics: z.array(z.object({ topicId: z.string(), humanAttentionScore: z.number().min(0).max(1), agentDemandScore: z.number().min(0).max(1).nullable(), attentionGap: z.number().min(-1).max(1).nullable(), humanSampleCount: z.number().int(), agentPurchases: z.number().int() })),
});
export type AttentionGap = z.infer<typeof attentionGapSchema>;

export function computeAttentionGap(human: HumanPulse, agent: AgentPulse): AttentionGap {
  if (agent.status !== "available") return attentionGapSchema.parse({
    status: "unavailable", limitations: ["Attention Gap is unavailable until sufficient attributable Agent Pulse exists.", ...agent.limitations],
    topics: human.topics.map((topic) => ({ topicId: topic.id, humanAttentionScore: topic.prevalence, agentDemandScore: null, attentionGap: null, humanSampleCount: topic.sampleCount, agentPurchases: 0 })),
  });
  const agentByTopic = new Map(agent.topics.map((topic) => [topic.topicId, topic]));
  const humanMax = Math.max(...human.topics.map((topic) => topic.prevalence), 1);
  return attentionGapSchema.parse({
    status: agent.attributablePurchases < 5 ? "preliminary" : "available",
    limitations: ["Scores are normalized within their own observed samples; they are not population estimates.", ...human.limitations, ...agent.limitations],
    topics: human.topics.map((topic) => {
      const agentTopic = agentByTopic.get(topic.id);
      const humanAttentionScore = topic.prevalence / humanMax;
      const agentDemandScore = agentTopic?.demandScore ?? 0;
      return { topicId: topic.id, humanAttentionScore, agentDemandScore, attentionGap: humanAttentionScore - agentDemandScore, humanSampleCount: topic.sampleCount, agentPurchases: agentTopic?.purchases ?? 0 };
    }),
  });
}
