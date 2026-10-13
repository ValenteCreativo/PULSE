import { entitlementSchema } from "../payment/entitlements.js";
import { purchaseRequestSchema } from "../payment/verify.js";
import { apiErrorSchema, catalogSchema, healthSchema, publicPulseApiContracts, systemStatusSchema, topicsResponseSchema } from "./public-contracts.js";

export const pulseApiContracts = {
  ...publicPulseApiContracts,
  "/api/v1/intelligence/entitlements": entitlementSchema,
} as const;

export type PulseApiPath = keyof typeof pulseApiContracts;
export { purchaseRequestSchema, entitlementSchema, apiErrorSchema, catalogSchema, healthSchema, systemStatusSchema, topicsResponseSchema };
export { humanPulseSchema } from "./public-contracts.js";
export type { HumanPulse } from "./public-contracts.js";
