import { ApiError, handle } from "@/lib/api";
import { preparePurchase } from "@/lib/purchase-demo/market";

export const POST = handle(async () => {
  try { return await preparePurchase(); } catch { throw new ApiError(502, "monad_unavailable", "Could not prepare the Monad contract call."); }
});
