import { z } from "zod";
import { indexedPurchaseSchema, type IndexedPurchase } from "../indexer/purchase.js";

export const agentPulseSchema = z.object({
  kind: z.literal("agent-pulse"), status: z.enum(["available", "insufficient-data"]),
  observationWindow: z.object({ start: z.string().nullable(), end: z.string().nullable() }),
  registeredAgentWallets: z.number().int().nonnegative(), attributablePurchases: z.number().int().nonnegative(),
  limitations: z.array(z.string()),
  topics: z.array(z.object({ topicId: z.string(), purchases: z.number().int(), uniqueBuyers: z.number().int(), totalAmount: z.coerce.bigint(), demandScore: z.number().min(0).max(1) })),
});
export type AgentPulse = z.infer<typeof agentPulseSchema>;

/** Only wallets explicitly registered by the demo operator count as agents. */
export function computeAgentPulse(purchasesInput: IndexedPurchase[], registeredAgentWallets: string[], minimumPurchases = 1): AgentPulse {
  const purchases = purchasesInput.map((purchase) => indexedPurchaseSchema.parse(purchase));
  const agents = new Set(registeredAgentWallets.map((wallet) => wallet.toLowerCase()));
  const attributable = purchases.filter((purchase) => agents.has(purchase.buyer.toLowerCase()));
  const timestamps = attributable.map((purchase) => purchase.timestamp).sort((a, b) => a < b ? -1 : 1);
  if (attributable.length < minimumPurchases) return agentPulseSchema.parse({
    kind: "agent-pulse", status: "insufficient-data", observationWindow: { start: null, end: null }, registeredAgentWallets: agents.size, attributablePurchases: attributable.length,
    limitations: ["No sufficient attributable registered-agent purchases were indexed.", "Non-registered wallets are intentionally excluded and must not be inferred as agents."], topics: [],
  });
  const byTopic = new Map<string, IndexedPurchase[]>();
  for (const purchase of attributable) byTopic.set(purchase.topicId, [...(byTopic.get(purchase.topicId) ?? []), purchase]);
  const total = attributable.reduce((sum, purchase) => sum + purchase.amount, 0n);
  return agentPulseSchema.parse({
    kind: "agent-pulse", status: "available", observationWindow: { start: new Date(Number(timestamps[0]! * 1000n)).toISOString(), end: new Date(Number(timestamps.at(-1)! * 1000n)).toISOString() },
    registeredAgentWallets: agents.size, attributablePurchases: attributable.length,
    limitations: ["Agent Pulse represents only explicitly registered demo-agent wallets, not all wallets or AI agents."],
    topics: [...byTopic.entries()].map(([topicId, topicPurchases]) => ({ topicId, purchases: topicPurchases.length, uniqueBuyers: new Set(topicPurchases.map((purchase) => purchase.buyer.toLowerCase())).size, totalAmount: topicPurchases.reduce((sum, purchase) => sum + purchase.amount, 0n), demandScore: total === 0n ? 0 : Number(topicPurchases.reduce((sum, purchase) => sum + purchase.amount, 0n) * 10_000n / total) / 10_000 })).sort((a, b) => b.demandScore - a.demandScore),
  });
}
