import { parseEther } from "viem";
import { type SpendingPolicy } from "./spending.js";

export const firstPurchaseBudget = {
  /** Explicit demo cap: the product itself may never cost more than 0.005 testnet MON. */
  maxProductPriceWei: parseEther("0.005"),
  /** Separate cap for the purchase transaction fee; re-estimate immediately before broadcast. */
  maxTransactionFeeWei: parseEther("0.002"),
  maxTotalExposureWei: parseEther("0.007"),
  maxPurchasesPerDay: 1,
} as const;

/** Builds the narrowest possible policy for exactly one configured testnet product. */
export function createFirstPurchasePolicy(contractAddress: string, productId: string): SpendingPolicy {
  return {
    chainId: 10143,
    contractAddress,
    allowedProductIds: [productId],
    maxPerPurchase: firstPurchaseBudget.maxProductPriceWei,
    maxPerDay: firstPurchaseBudget.maxProductPriceWei,
    maxPurchasesPerDay: firstPurchaseBudget.maxPurchasesPerDay,
  };
}
