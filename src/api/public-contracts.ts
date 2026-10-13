import { z } from "zod";
import { attentionGapSchema } from "../pulse/attention-gap.js";
import { agentPulseSchema } from "../pulse/agent-pulse.js";
import { humanPulseSchema } from "../pulse/human-pulse.js";

export const healthSchema = z.object({ status: z.literal("ok"), version: z.literal("v1"), mode: z.enum(["fixture", "authorized-sample"]) });
export const systemStatusSchema = z.object({
  status: z.literal("ok"), chain: z.object({ id: z.literal(10143), network: z.literal("Monad Testnet"), contractAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/) }),
  humanPulse: z.object({ mode: z.enum(["fixture", "authorized-sample"]), dataStatus: z.enum(["fixture", "authorized-sample"]) }),
  indexer: z.object({ status: z.enum(["awaiting-cloud", "syncing", "ready"]), graphqlUrl: z.string().url().nullable() }),
  payments: z.object({ status: z.enum(["not-configured", "ready"]), livePurchasesEnabled: z.literal(false) }),
});
export const catalogSchema = z.object({ products: z.array(z.object({ id: z.string(), topicId: z.string(), availability: z.literal("payment-not-yet-enabled"), price: z.null() })) });
export const topicsResponseSchema = z.object({ topics: humanPulseSchema.shape.topics, provenance: humanPulseSchema.shape.provenance, mode: humanPulseSchema.shape.mode });
export const apiErrorSchema = z.object({ error: z.string(), code: z.string() });

export const publicPulseApiContracts = {
  "/api/v1/health": healthSchema,
  "/api/v1/status": systemStatusSchema,
  "/api/v1/human-pulse": humanPulseSchema,
  "/api/v1/topics": topicsResponseSchema,
  "/api/v1/agent-pulse": agentPulseSchema,
  "/api/v1/attention-gap": attentionGapSchema,
  "/api/v1/intelligence/catalog": catalogSchema,
} as const;

export type PublicPulseApiPath = keyof typeof publicPulseApiContracts;
export { humanPulseSchema };
export type { HumanPulse } from "../pulse/human-pulse.js";
