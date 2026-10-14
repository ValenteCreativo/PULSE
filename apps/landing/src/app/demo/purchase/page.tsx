import type { Metadata } from "next";

import { PurchaseDemoView } from "@/views/purchase-demo";

export const metadata: Metadata = {
  title: "Buy intelligence · Live demo",
  description:
    "An AI agent buying PULSE attention intelligence and paying in MON on the deployed Monad testnet market. A real contract interaction, confirmed in MetaMask.",
};

/** Routes delegate to views (hard rule #5). The live MetaMask purchase flow. */
export default function PurchaseDemoPage() {
  return <PurchaseDemoView />;
}
