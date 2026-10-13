import { z } from "zod";
import { purchaseIntentSchema, SpendLedger, type PurchaseIntent, type SpendingPolicy } from "./spending.js";

const purchaseIdSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/);

export interface PurchaseBroadcaster {
  broadcast(input: PurchaseIntent & { purchaseId: string }): Promise<{ transactionHash: string }>;
}

export const purchaseExecutionSchema = z.object({
  mode: z.enum(["dry-run", "broadcast"]),
  status: z.enum(["planned", "submitted"]),
  purchaseId: purchaseIdSchema,
  transactionHash: z.string().nullable(),
  reason: z.string().nullable(),
});
export type PurchaseExecution = z.infer<typeof purchaseExecutionSchema>;

export class PurchaseTool {
  constructor(
    private readonly policy: SpendingPolicy,
    private readonly ledger: SpendLedger,
    private readonly broadcaster?: PurchaseBroadcaster,
  ) {}

  /**
   * Broadcasting is opt-in at the call site; absent this exact flag this is a
   * deterministic local plan and does not contact an RPC or sign anything.
   */
  async execute(intentInput: PurchaseIntent, purchaseIdInput: string, authorization?: { allowBroadcast: true }): Promise<PurchaseExecution> {
    const intent = purchaseIntentSchema.parse(intentInput);
    const purchaseId = purchaseIdSchema.parse(purchaseIdInput);
    if (!authorization?.allowBroadcast) return purchaseExecutionSchema.parse({
      mode: "dry-run", status: "planned", purchaseId, transactionHash: null,
      reason: "Broadcast disabled: an explicit per-call authorization is required.",
    });
    if (!this.broadcaster) throw new Error("Broadcast requested but no broadcaster is configured");
    const reservation = await this.ledger.reserve(intent, this.policy);
    try {
      const result = await this.broadcaster.broadcast({ ...intent, purchaseId });
      return purchaseExecutionSchema.parse({ mode: "broadcast", status: "submitted", purchaseId, transactionHash: result.transactionHash, reason: null });
    } catch (error) {
      this.ledger.release(reservation.id);
      throw error;
    }
  }
}
