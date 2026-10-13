import { z } from "zod";
import type { HumanPulse } from "../pulse/human-pulse.js";
import { computeAgentPulse, type AgentPulse } from "../pulse/agent-pulse.js";
import { computeAttentionGap, type AttentionGap } from "../pulse/attention-gap.js";

export const apiErrorSchema = z.object({ error: z.string(), code: z.string() });
export const healthSchema = z.object({ status: z.literal("ok"), version: z.literal("v1"), mode: z.enum(["fixture", "authorized-sample"]) });

export function createPulseApi(humanPulse: HumanPulse, agentPulse: AgentPulse = computeAgentPulse([], []), attentionGap: AttentionGap = computeAttentionGap(humanPulse, agentPulse)): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    if (request.method !== "GET") return response({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
    if (url.pathname === "/api/v1/health") return response(healthSchema.parse({ status: "ok", version: "v1", mode: humanPulse.mode }));
    if (url.pathname === "/api/v1/human-pulse") return response(humanPulse);
    if (url.pathname === "/api/v1/topics") return response({ topics: humanPulse.topics, provenance: humanPulse.provenance, mode: humanPulse.mode });
    if (url.pathname === "/api/v1/agent-pulse") return response(agentPulse);
    if (url.pathname === "/api/v1/attention-gap") return response(attentionGap);
    if (url.pathname === "/api/v1/intelligence/catalog") return response({ products: humanPulse.topics.map((topic) => ({ id: `human-pulse:${topic.id}`, topicId: topic.id, availability: "payment-not-yet-enabled", price: null })) });
    return response({ error: "Route not found", code: "NOT_FOUND" }, 404);
  };
}
