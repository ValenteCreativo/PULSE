import { randomUUID } from "node:crypto";
import { z } from "zod";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const bytes32 = z.string().regex(/^0x[0-9a-fA-F]{64}$/);

export const purchaseIntentSchema = z.object({
  chainId: z.literal(10143),
  contractAddress: address,
  topicId: bytes32,
  productId: bytes32,
  amount: z.bigint().positive(),
});
export type PurchaseIntent = z.infer<typeof purchaseIntentSchema>;

export const spendingPolicySchema = z.object({
  chainId: z.literal(10143),
  contractAddress: address,
  allowedProductIds: z.array(bytes32).min(1),
  maxPerPurchase: z.bigint().positive(),
  maxPerDay: z.bigint().positive(),
  maxPurchasesPerDay: z.number().int().positive(),
});
export type SpendingPolicy = z.infer<typeof spendingPolicySchema>;

export class SpendingPolicyError extends Error {
  constructor(message: string) { super(message); this.name = "SpendingPolicyError"; }
}

export interface SpendReservation {
  id: string;
  intent: PurchaseIntent;
  createdAt: Date;
}

/** In-memory ledger for a single process. Production deployments must back this with durable storage. */
export class SpendLedger {
  private readonly reservations: SpendReservation[] = [];
  private lock: Promise<void> = Promise.resolve();

  async reserve(intentInput: PurchaseIntent, policyInput: SpendingPolicy, now = new Date()): Promise<SpendReservation> {
    const intent = purchaseIntentSchema.parse(intentInput);
    const policy = spendingPolicySchema.parse(policyInput);
    const previous = this.lock;
    let release!: () => void;
    this.lock = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      if (intent.chainId !== policy.chainId) throw new SpendingPolicyError("Purchase chain is not permitted");
      if (intent.contractAddress.toLowerCase() !== policy.contractAddress.toLowerCase()) throw new SpendingPolicyError("Purchase contract is not permitted");
      if (!policy.allowedProductIds.some((id) => id.toLowerCase() === intent.productId.toLowerCase())) throw new SpendingPolicyError("Product is not permitted");
      if (intent.amount > policy.maxPerPurchase) throw new SpendingPolicyError("Purchase exceeds the per-purchase limit");
      const day = now.toISOString().slice(0, 10);
      const todays = this.reservations.filter((entry) => entry.createdAt.toISOString().slice(0, 10) === day);
      if (todays.length >= policy.maxPurchasesPerDay) throw new SpendingPolicyError("Purchase count exceeds the daily limit");
      const total = todays.reduce((sum, entry) => sum + entry.intent.amount, 0n);
      if (total + intent.amount > policy.maxPerDay) throw new SpendingPolicyError("Purchase exceeds the daily budget");
      const reservation = { id: randomUUID(), intent, createdAt: now };
      this.reservations.push(reservation);
      return reservation;
    } finally {
      release();
    }
  }

  release(reservationId: string): void {
    const index = this.reservations.findIndex((entry) => entry.id === reservationId);
    if (index >= 0) this.reservations.splice(index, 1);
  }

  entries(): readonly SpendReservation[] { return this.reservations; }
}
