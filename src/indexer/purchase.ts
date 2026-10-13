import { z } from "zod";

const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const hex32 = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

export const indexedPurchaseSchema = z.object({
  id: z.string().min(1), chainId: z.number().int().positive(), buyer: address,
  topicId: hex32, productId: hex32, amount: z.bigint().positive(), purchaseId: hex32,
  transactionHash: hex32, blockNumber: z.bigint().nonnegative(), timestamp: z.bigint().nonnegative(),
});
export type IndexedPurchase = z.infer<typeof indexedPurchaseSchema>;

/** Shared pure transform: handler and tests use the same canonical, duplicate-safe shape. */
export function toIndexedPurchase(event: Omit<IndexedPurchase, "id">): IndexedPurchase {
  return indexedPurchaseSchema.parse({ ...event, id: `${event.chainId}-${event.transactionHash.toLowerCase()}-${event.purchaseId.toLowerCase()}` });
}
