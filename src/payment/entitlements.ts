import { randomUUID } from "node:crypto";
import { DuckDBInstance } from "@duckdb/node-api";
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
  amount: z.coerce.bigint().positive(),
  blockNumber: z.coerce.bigint().nonnegative(),
  confirmations: z.coerce.bigint().positive(),
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

/** Durable single-node entitlement store. Unique purchase/transaction constraints provide replay protection across restarts. */
export class DuckDbEntitlementStore implements EntitlementStore {
  private constructor(private readonly connection: Awaited<ReturnType<DuckDBInstance["connect"]>>) {}

  static async open(path: string): Promise<DuckDbEntitlementStore> {
    const instance = await DuckDBInstance.create(path);
    const connection = await instance.connect();
    await connection.run(`CREATE TABLE IF NOT EXISTS pulse_entitlements (
      entitlement_id VARCHAR PRIMARY KEY, transaction_hash VARCHAR UNIQUE NOT NULL, purchase_id VARCHAR UNIQUE NOT NULL,
      chain_id INTEGER NOT NULL, contract_address VARCHAR NOT NULL, buyer VARCHAR NOT NULL, topic_id VARCHAR NOT NULL,
      product_id VARCHAR NOT NULL, amount VARCHAR NOT NULL, block_number VARCHAR NOT NULL, confirmations VARCHAR NOT NULL,
      verified_at VARCHAR NOT NULL, redeemed_at VARCHAR NOT NULL, status VARCHAR NOT NULL
    )`);
    return new DuckDbEntitlementStore(connection);
  }

  async redeem(purchaseInput: VerifiedPurchase): Promise<Entitlement> {
    const purchase = verifiedPurchaseSchema.parse(purchaseInput);
    const entitlement = entitlementSchema.parse({ ...purchase, entitlementId: randomUUID(), status: "confirmed", redeemedAt: new Date().toISOString() });
    const result = await this.connection.runAndReadAll(
      `INSERT INTO pulse_entitlements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING RETURNING entitlement_id`,
      [entitlement.entitlementId, entitlement.transactionHash.toLowerCase(), entitlement.purchaseId.toLowerCase(), entitlement.chainId, entitlement.contractAddress.toLowerCase(), entitlement.buyer.toLowerCase(), entitlement.topicId.toLowerCase(), entitlement.productId.toLowerCase(), entitlement.amount.toString(), entitlement.blockNumber.toString(), entitlement.confirmations.toString(), entitlement.verifiedAt, entitlement.redeemedAt, entitlement.status],
    );
    if (result.getRowObjectsJS().length !== 1) throw new PaymentReplayError();
    return entitlement;
  }

  async get(entitlementId: string): Promise<Entitlement | null> {
    const result = await this.connection.runAndReadAll("SELECT * FROM pulse_entitlements WHERE entitlement_id = ?", [entitlementId]);
    const row = result.getRowObjectsJS()[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return entitlementSchema.parse({
      entitlementId: row.entitlement_id, transactionHash: row.transaction_hash, purchaseId: row.purchase_id, chainId: row.chain_id,
      contractAddress: row.contract_address, buyer: row.buyer, topicId: row.topic_id, productId: row.product_id,
      amount: BigInt(String(row.amount)), blockNumber: BigInt(String(row.block_number)), confirmations: BigInt(String(row.confirmations)),
      verifiedAt: row.verified_at, redeemedAt: row.redeemed_at, status: row.status,
    });
  }
}
