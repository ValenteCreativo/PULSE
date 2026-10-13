import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { PurchaseIntent } from "./spending.js";
import { PurchaseTool, type PurchaseExecution } from "./purchase-tool.js";

export const buyerRecommendationSchema = z.object({
  shouldBuy: z.boolean(),
  intent: z.custom<PurchaseIntent>().nullable(),
  rationale: z.string().min(1),
});
export type BuyerRecommendation = z.infer<typeof buyerRecommendationSchema>;

export interface BuyerModel {
  recommend(): Promise<BuyerRecommendation>;
}

export const nebiusModelConfigSchema = z.object({
  baseUrl: z.string().url().default("https://api.studio.nebius.com/v1"),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  allowPaidInference: z.literal(true).optional(),
});
export type NebiusModelConfig = z.infer<typeof nebiusModelConfigSchema>;

export class PaidInferenceDisabledError extends Error {
  constructor() { super("Nebius inference is disabled until explicitly authorized"); this.name = "PaidInferenceDisabledError"; }
}

/**
 * Boundary for a future Nebius model call. It intentionally has no default
 * network path: local tests and dry runs cannot invoke paid inference.
 */
export class NebiusBuyerModel implements BuyerModel {
  constructor(
    private readonly config?: NebiusModelConfig,
    private readonly request: typeof fetch = fetch,
  ) {}

  async recommend(): Promise<BuyerRecommendation> {
    if (!this.config?.allowPaidInference) throw new PaidInferenceDisabledError();
    const config = nebiusModelConfigSchema.parse(this.config);
    const response = await this.request(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        max_tokens: 300,
        messages: [{ role: "system", content: "Return one JSON object matching {shouldBuy:boolean,intent:PurchaseIntent|null,rationale:string}. Recommend purchases only when explicitly justified. Never include credentials." }],
      }),
    });
    if (!response.ok) throw new Error(`Nebius inference failed with HTTP ${response.status}`);
    const body = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("Nebius inference returned no recommendation content");
    return buyerRecommendationSchema.parse(JSON.parse(content));
  }
}

export class AutonomousBuyerAgent {
  constructor(private readonly model: BuyerModel, private readonly purchases: PurchaseTool) {}

  async run(): Promise<PurchaseExecution | { status: "skipped"; reason: string }> {
    const recommendation = buyerRecommendationSchema.parse(await this.model.recommend());
    if (!recommendation.shouldBuy || !recommendation.intent) return { status: "skipped", reason: recommendation.rationale };
    // Deliberately omit authorization: autonomous operation produces a local plan only.
    return this.purchases.execute(recommendation.intent, `0x${randomBytes(32).toString("hex")}`);
  }
}
