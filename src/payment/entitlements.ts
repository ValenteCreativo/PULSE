import { randomUUID } from "node:crypto";
import { z } from "zod";

const hex32 = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const verifiedPurchaseSchema = z.object({
  transactionHash: hex32,
  purchaseId: hex32,
  chainId: z.number().int().positive(),
  contractAddress: address,
  buyer: address,
  topicId: hex32,
  productId: hex32,
  amount: z.bigint().positive(),
  blockNumber: z.bigint().nonnegative(),
  confirmations: z.bigint().positive(),
  verifiedAt: z.string().datetime(),
});
export type VerifiedPurchase = z.infer<typeof verifiedPurchaseSchema>;

export const entitlementSchema = verifiedPurchaseSchema.extend({
  entitlementId: z.string().uuid(),
  status: z.literal("confirmed"),
  redeemedAt: z.string().datetime(),
});
export type Entitlement = z.infer<typeof entitlementSchema>;

export class PaymentReplayError extends Error {
  constructor() { super("Purchase was already redeemed"); this.name = "PaymentReplayError"; }
}

export interface EntitlementStore {
  redeem(purchase: VerifiedPurchase): Promise<Entitlement>;
  get(entitlementId: string): Promise<Entitlement | null>;
}

/** A keyed mutex makes check-and-insert atomic for one server process. Replace with a database constraint in multi-instance production. */
class KeyedMutex {
  private tails = new Map<string, Promise<void>>();
  async run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    this.tails.set(key, previous.then(() => current));
    await previous;
    try { return await operation(); } finally {
      release();
      if (this.tails.get(key) === current) this.tails.delete(key);
    }
  }
}

/** Safe local/default store. It is intentionally process-scoped and only appropriate for tests or a single demo process. */
export class InMemoryEntitlementStore implements EntitlementStore {
  private readonly byId = new Map<string, Entitlement>();
  private readonly purchaseIds = new Set<string>();
  private readonly transactionHashes = new Set<string>();
  private readonly mutex = new KeyedMutex();

  async redeem(purchaseInput: VerifiedPurchase): Promise<Entitlement> {
    const purchase = verifiedPurchaseSchema.parse(purchaseInput);
    return this.mutex.run(`${purchase.purchaseId.toLowerCase()}:${purchase.transactionHash.toLowerCase()}`, async () => {
      if (this.purchaseIds.has(purchase.purchaseId.toLowerCase()) || this.transactionHashes.has(purchase.transactionHash.toLowerCase())) throw new PaymentReplayError();
      const entitlement = entitlementSchema.parse({ ...purchase, entitlementId: randomUUID(), status: "confirmed", redeemedAt: new Date().toISOString() });
      this.purchaseIds.add(purchase.purchaseId.toLowerCase());
      this.transactionHashes.add(purchase.transactionHash.toLowerCase());
      this.byId.set(entitlement.entitlementId, entitlement);
      return entitlement;
    });
  }

  async get(entitlementId: string): Promise<Entitlement | null> {
    return this.byId.get(entitlementId) ?? null;
  }
}
