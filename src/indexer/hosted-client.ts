import { z } from "zod";
import { indexedPurchaseSchema, type IndexedPurchase } from "./purchase.js";

const graphQlPurchaseSchema = z.object({
  id: z.string().min(1), buyer: z.string(), topicId: z.string(), productId: z.string(), amount: z.coerce.bigint(), purchaseId: z.string(),
  transactionHash: z.string(), blockNumber: z.coerce.bigint(), timestamp: z.coerce.bigint(),
});
const graphQlResponseSchema = z.object({ data: z.object({ Purchase: z.array(graphQlPurchaseSchema) }) });

export class HostedIndexerError extends Error {
  constructor(message: string) { super(message); this.name = "HostedIndexerError"; }
}

/** Read-only adapter for Envio's hosted GraphQL API. It never signs, sends, or configures an on-chain action. */
export async function queryHostedPurchases(endpoint: string, fetcher: typeof fetch = fetch, limit = 1_000): Promise<IndexedPurchase[]> {
  if (!z.string().url().safeParse(endpoint).success) throw new HostedIndexerError("Hosted GraphQL endpoint must be a valid URL");
  if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) throw new HostedIndexerError("Purchase query limit must be between 1 and 1000");
  const response = await fetcher(endpoint, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "query HostedPurchases($limit: Int!) { Purchase(limit: $limit, order_by: { blockNumber: asc }) { id buyer topicId productId amount purchaseId transactionHash blockNumber timestamp } }", variables: { limit } }),
  });
  if (!response.ok) throw new HostedIndexerError(`Hosted GraphQL query failed with HTTP ${response.status}`);
  const body = graphQlResponseSchema.safeParse(await response.json());
  if (!body.success) throw new HostedIndexerError("Hosted GraphQL response did not match the PULSE Purchase schema");
  return body.data.data.Purchase.map((purchase) => indexedPurchaseSchema.parse({ ...purchase, chainId: 10143 }));
}
