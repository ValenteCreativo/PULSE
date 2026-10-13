import type { HumanPulse } from "../pulse/human-pulse.js";
import { computeAgentPulse, type AgentPulse } from "../pulse/agent-pulse.js";
import { computeAttentionGap, type AttentionGap } from "../pulse/attention-gap.js";
import { PaymentReplayError, type Entitlement } from "../payment/entitlements.js";
import { type PurchaseRequest } from "../payment/verify.js";
import { apiErrorSchema, catalogSchema, healthSchema, purchaseRequestSchema, systemStatusSchema, topicsResponseSchema } from "./contracts.js";

export { apiErrorSchema, healthSchema } from "./contracts.js";

export interface PaymentRedeemer { redeem(request: PurchaseRequest): Promise<Entitlement>; }
export interface PulseApiOptions { paymentRedeemer?: PaymentRedeemer; indexerGraphqlUrl?: string; indexerStatus?: "awaiting-cloud" | "syncing" | "ready"; }
const deployedContractAddress = "0x0a14814aa3d4fd9c2e17090af23a655204993bff";

export function createPulseApi(humanPulse: HumanPulse, agentPulse: AgentPulse = computeAgentPulse([], []), attentionGap: AttentionGap = computeAttentionGap(humanPulse, agentPulse), options: PulseApiOptions = {}): (request: Request) => Promise<Response> {
  return async (request) => {
    const url = new URL(request.url);
    // JSON has no BigInt primitive; serialize monetary and block values as decimal strings at the HTTP boundary.
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body, (_key, value: unknown) => typeof value === "bigint" ? value.toString() : value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    if (request.method === "POST" && url.pathname === "/api/v1/intelligence/entitlements") {
      if (!options.paymentRedeemer) return response({ error: "Payment verification is not configured", code: "PAYMENT_NOT_CONFIGURED" }, 503);
      try {
        const entitlement = await options.paymentRedeemer.redeem(purchaseRequestSchema.parse(await request.json()));
        return response(entitlement, 201);
      } catch (error) {
        if (error instanceof PaymentReplayError) return response({ error: error.message, code: "PAYMENT_REPLAY" }, 409);
        return response({ error: error instanceof Error ? error.message : "Invalid payment request", code: "PAYMENT_INVALID" }, 400);
      }
    }
    if (request.method !== "GET") return response({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
    if (url.pathname === "/api/v1/health") return response(healthSchema.parse({ status: "ok", version: "v1", mode: humanPulse.mode }));
    if (url.pathname === "/api/v1/status") return response(systemStatusSchema.parse({
      status: "ok", chain: { id: 10143, network: "Monad Testnet", contractAddress: deployedContractAddress },
      humanPulse: { mode: humanPulse.mode, dataStatus: humanPulse.mode },
      indexer: { status: options.indexerStatus ?? "awaiting-cloud", graphqlUrl: options.indexerGraphqlUrl ?? null },
      payments: { status: options.paymentRedeemer ? "ready" : "not-configured", livePurchasesEnabled: false },
    }));
    if (url.pathname === "/api/v1/human-pulse") return response(humanPulse);
    if (url.pathname === "/api/v1/topics") return response(topicsResponseSchema.parse({ topics: humanPulse.topics, provenance: humanPulse.provenance, mode: humanPulse.mode }));
    if (url.pathname === "/api/v1/agent-pulse") return response(agentPulse);
    if (url.pathname === "/api/v1/attention-gap") return response(attentionGap);
    if (url.pathname === "/api/v1/intelligence/catalog") return response(catalogSchema.parse({ products: humanPulse.topics.map((topic) => ({ id: `human-pulse:${topic.id}`, topicId: topic.id, availability: "payment-not-yet-enabled", price: null })) }));
    return response({ error: "Route not found", code: "NOT_FOUND" }, 404);
  };
}
