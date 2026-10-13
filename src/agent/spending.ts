import { randomUUID } from "node:crypto";
import { DuckDBInstance } from "@duckdb/node-api";
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
  status: "reserved" | "submitted";
}

export interface SpendingLedger {
  reserve(intent: PurchaseIntent, policy: SpendingPolicy, now?: Date): Promise<SpendReservation>;
  release(reservationId: string): Promise<void>;
  markSubmitted(reservationId: string): Promise<void>;
  entries(): Promise<readonly SpendReservation[]>;
}

/** In-memory ledger for a single process. Production deployments must back this with durable storage. */
export class SpendLedger implements SpendingLedger {
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
      const reservation = { id: randomUUID(), intent, createdAt: now, status: "reserved" as const };
      this.reservations.push(reservation);
      return reservation;
    } finally {
      release();
    }
  }

  async release(reservationId: string): Promise<void> {
    const index = this.reservations.findIndex((entry) => entry.id === reservationId);
    if (index >= 0) this.reservations.splice(index, 1);
  }

  async markSubmitted(reservationId: string): Promise<void> {
    const reservation = this.reservations.find((entry) => entry.id === reservationId);
    if (!reservation) throw new SpendingPolicyError("Spend reservation does not exist");
    reservation.status = "submitted";
  }

  async entries(): Promise<readonly SpendReservation[]> { return this.reservations; }
}

/** Durable single-node ledger. Pending and submitted reservations both count against the daily cap after restarts. */
export class DuckDbSpendLedger implements SpendingLedger {
  private lock: Promise<void> = Promise.resolve();
  private constructor(private readonly connection: Awaited<ReturnType<DuckDBInstance["connect"]>>) {}

  static async open(path: string): Promise<DuckDbSpendLedger> {
    const instance = await DuckDBInstance.create(path);
    const connection = await instance.connect();
    await connection.run(`CREATE TABLE IF NOT EXISTS pulse_agent_spend_reservations (
      id VARCHAR PRIMARY KEY, chain_id INTEGER NOT NULL, contract_address VARCHAR NOT NULL,
      topic_id VARCHAR NOT NULL, product_id VARCHAR NOT NULL, amount VARCHAR NOT NULL,
      created_at VARCHAR NOT NULL, status VARCHAR NOT NULL
    )`);
    return new DuckDbSpendLedger(connection);
  }

  async reserve(intentInput: PurchaseIntent, policyInput: SpendingPolicy, now = new Date()): Promise<SpendReservation> {
    const intent = purchaseIntentSchema.parse(intentInput);
    const policy = spendingPolicySchema.parse(policyInput);
    const previous = this.lock;
    let unlock!: () => void;
    this.lock = new Promise<void>((resolve) => { unlock = resolve; });
    await previous;
    try {
      this.assertIntent(intent, policy);
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
      const result = await this.connection.runAndReadAll("SELECT amount FROM pulse_agent_spend_reservations WHERE created_at >= ?", [dayStart]);
      const rows = result.getRowObjectsJS() as Array<{ amount: string }>;
      if (rows.length >= policy.maxPurchasesPerDay) throw new SpendingPolicyError("Purchase count exceeds the daily limit");
      const total = rows.reduce((sum, row) => sum + BigInt(row.amount), 0n);
      if (total + intent.amount > policy.maxPerDay) throw new SpendingPolicyError("Purchase exceeds the daily budget");
      const reservation: SpendReservation = { id: randomUUID(), intent, createdAt: now, status: "reserved" };
      await this.connection.run("INSERT INTO pulse_agent_spend_reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [reservation.id, intent.chainId, intent.contractAddress.toLowerCase(), intent.topicId.toLowerCase(), intent.productId.toLowerCase(), intent.amount.toString(), now.toISOString(), reservation.status]);
      return reservation;
    } finally { unlock(); }
  }

  async release(reservationId: string): Promise<void> {
    await this.connection.run("DELETE FROM pulse_agent_spend_reservations WHERE id = ? AND status = 'reserved'", [reservationId]);
  }

  async markSubmitted(reservationId: string): Promise<void> {
    await this.connection.run("UPDATE pulse_agent_spend_reservations SET status = 'submitted' WHERE id = ? AND status = 'reserved'", [reservationId]);
  }

  async entries(): Promise<readonly SpendReservation[]> {
    const result = await this.connection.runAndReadAll("SELECT * FROM pulse_agent_spend_reservations ORDER BY created_at");
    return (result.getRowObjectsJS() as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id), intent: purchaseIntentSchema.parse({ chainId: row.chain_id, contractAddress: row.contract_address, topicId: row.topic_id, productId: row.product_id, amount: BigInt(String(row.amount)) }),
      createdAt: new Date(String(row.created_at)), status: z.enum(["reserved", "submitted"]).parse(row.status),
    }));
  }

  private assertIntent(intent: PurchaseIntent, policy: SpendingPolicy): void {
    if (intent.chainId !== policy.chainId) throw new SpendingPolicyError("Purchase chain is not permitted");
    if (intent.contractAddress.toLowerCase() !== policy.contractAddress.toLowerCase()) throw new SpendingPolicyError("Purchase contract is not permitted");
    if (!policy.allowedProductIds.some((id) => id.toLowerCase() === intent.productId.toLowerCase())) throw new SpendingPolicyError("Product is not permitted");
    if (intent.amount > policy.maxPerPurchase) throw new SpendingPolicyError("Purchase exceeds the per-purchase limit");
  }
}
