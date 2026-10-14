import { z } from "zod";
import { ApiError, handle } from "@/lib/api";
import { verifyPurchase } from "@/lib/purchase-demo/market";

const requestSchema = z.object({ hash: z.string().regex(/^0x[\da-fA-F]{64}$/), buyer: z.string().regex(/^0x[\da-fA-F]{40}$/), purchaseId: z.string().regex(/^0x[\da-fA-F]{64}$/) });
export const POST = handle(async (request) => {
  const input = requestSchema.parse(await request.json());
  try { return await verifyPurchase(input.hash as `0x${string}`, input.buyer as `0x${string}`, input.purchaseId as `0x${string}`); } catch { throw new ApiError(502, "monad_unavailable", "Could not verify the Monad receipt."); }
});
