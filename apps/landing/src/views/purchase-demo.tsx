import { PurchaseDemoClient } from "@/components/purchase-demo/purchase-demo-client";
import { PageShell } from "@/components/common/page-shell";

export function PurchaseDemoView() {
  return <PageShell kicker="Live purchase demo · Monad Testnet" heading={"Buy human-pulse:ai."}>
    <p className="mb-8 max-w-[42rem] text-[1rem] leading-[1.55] text-hud-text/80">Terminal discovery points to PULSE’s public fixture API; this page reads the configured product directly from the deployed Monad market. It creates a real contract interaction only after you manually confirm it in MetaMask.</p>
    <div className="mb-4 rounded-xl border border-nav-surface bg-nav-surface/30 p-5 font-sans text-[0.75rem] leading-[1.7] text-hud-text/75"><p className="mb-2 tracking-[0.14em] text-nav-accent uppercase">Public discovery</p><code>GET /api/v1/manifest.json → fixture-only public intelligence · paidIntelligence.enabled: false</code></div>
    <PurchaseDemoClient />
  </PageShell>;
}
