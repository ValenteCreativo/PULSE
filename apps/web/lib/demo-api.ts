import { computeAgentPulse } from "../../../src/pulse/agent-pulse";
import { computeAttentionGap } from "../../../src/pulse/attention-gap";
import { demoRecords } from "../../../src/fixtures/demo-records";
import { computeHumanPulse } from "../../../src/pulse/human-pulse";

const pulse = computeHumanPulse(demoRecords, { mode: "fixture", processedAt: new Date("2026-10-13T00:00:00.000Z") });
const agent = computeAgentPulse([], []);
const gap = computeAttentionGap(pulse, agent);
const contractAddress = "0x0a14814aa3d4fd9c2e17090af23a655204993bff";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, (_key, value: unknown) => typeof value === "bigint" ? value.toString() : value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

/** Public Vercel demo adapter: mirrors the typed backend's safe, fixture-only read surface. */
export function demoApi(request: Request): Response {
  const url = new URL(request.url);
  if (request.method === "POST" && url.pathname === "/api/v1/intelligence/entitlements") return response({ error: "Payment verification is not configured in the public demo", code: "PAYMENT_NOT_CONFIGURED" }, 503);
  if (request.method !== "GET") return response({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  if (url.pathname === "/api/v1/health") return response({ status: "ok", version: "v1", mode: pulse.mode });
  if (url.pathname === "/api/v1/status") return response({ status: "ok", chain: { id: 10143, network: "Monad Testnet", contractAddress }, humanPulse: { mode: pulse.mode, dataStatus: pulse.mode }, indexer: { status: "awaiting-cloud", graphqlUrl: null }, payments: { status: "not-configured", livePurchasesEnabled: false } });
  if (url.pathname === "/api/v1/human-pulse") return response(pulse);
  if (url.pathname === "/api/v1/topics") return response({ topics: pulse.topics, provenance: pulse.provenance, mode: pulse.mode });
  if (url.pathname === "/api/v1/agent-pulse") return response(agent);
  if (url.pathname === "/api/v1/attention-gap") return response(gap);
  if (url.pathname === "/api/v1/intelligence/catalog") return response({ products: pulse.topics.map((topic) => ({ id: `human-pulse:${topic.id}`, topicId: topic.id, availability: "payment-not-yet-enabled", price: null })) });
  return response({ error: "Route not found", code: "NOT_FOUND" }, 404);
}
