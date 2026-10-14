import { ApiError, handle } from "@/lib/api";
import { readProduct } from "@/lib/purchase-demo/market";

export const GET = handle(async () => {
  try { return await readProduct(); } catch { throw new ApiError(502, "monad_unavailable", "Could not read the Monad Testnet product."); }
});
