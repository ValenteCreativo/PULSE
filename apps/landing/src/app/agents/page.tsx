import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/common/page-shell";

export const metadata: Metadata = {
  title: "For Agents",
  description:
    "How autonomous AI agents read PULSE attention intelligence and buy it on Monad. Hackathon prototype — sample data and a Monad testnet marketplace.",
};

/**
 * The developer / agent-facing page. Original PULSE content; the live API
 * wiring to the same-origin public API (/api/v1/*) and the pay-in-MON flow are documented here
 * as the integration path and remain illustrative — no transaction is signed.
 */
export default function AgentsPage() {
  return (
    <PageShell kicker="For agents · developer surface" heading={"Give your agent a pulse."}>
      <p className="mb-10 max-w-[40rem] text-[1rem] leading-[1.5] text-hud-text/80 sm:text-[1.125rem]">
        PULSE exposes human attention intelligence through a read-only API, and a
        marketplace where agents buy that intelligence on Monad. Discover what is
        taking off, decide what matters, and let your agent act. Hackathon
        prototype — sample attention data on a Monad testnet marketplace.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            step: "01 · Discover",
            body: "Read human attention signals — formats taking off, sounds spreading, watch-time and engagement patterns.",
          },
          {
            step: "02 · Decide",
            body: "Rank topics and content opportunities against what your agent is built to create.",
          },
          {
            step: "03 · Create",
            body: "Feed the intelligence into your own content workflow — PULSE never generates content, it informs it.",
          },
        ].map((card) => (
          <article
            key={card.step}
            className="rounded-xl border border-nav-surface bg-[#0b1116]/70 p-6"
          >
            <p className="mb-3 font-sans text-[0.75rem] tracking-[0.14em] text-nav-accent uppercase">
              {card.step}
            </p>
            <p className="text-[0.9375rem] leading-[1.5] text-hud-text/80">
              {card.body}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-[#8f75ff66] bg-[#04060a]/80 p-6">
        <p className="mb-4 font-sans text-[0.75rem] tracking-[0.14em] text-[#ad9cff] uppercase">
          Buy intelligence · Monad testnet · chain 10143
        </p>
        <pre className="overflow-auto rounded-lg bg-[#05080d] p-4 font-sans text-[0.8125rem] leading-[1.7] text-[#bafff4]">
{`# 1. Discover what intelligence is for sale
curl https://pulse.local/api/v1/intelligence/catalog

# 2. (Illustrative) claim an entitlement after paying in MON on Monad testnet
#    Contract: 0x0a14814aa3d4fd9c2e17090af23a655204993bff
curl -X POST https://pulse.local/api/v1/intelligence/entitlements \\
  -H "content-type: application/json" \\
  -d '{ "productId": "human-pulse:<topic>", "chainId": 10143, "txHash": "0x..." }'
# -> dry-run on this demo: nothing is signed or broadcast, no funds are spent.`}
        </pre>
        <p className="mt-4 text-[0.8125rem] leading-[1.5] text-[#ffb36b]">
          Hackathon prototype — sample attention data, agent-facing APIs, and a
          Monad testnet marketplace. The purchase path is illustrative; no
          transaction is broadcast and no funds are spent.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="grid h-[2.6875rem] place-items-center rounded-md bg-nav-accent px-5 text-[0.9375rem] font-semibold text-nav-accent-ink transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-nav-text"
        >
          Back to the room
        </Link>
        <Link
          href="/contact"
          className="grid h-[2.6875rem] place-items-center rounded-md border border-nav-accent px-5 text-[0.9375rem] font-semibold text-nav-accent transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-nav-accent hover:text-nav-accent-ink"
        >
          Talk to us
        </Link>
      </div>
    </PageShell>
  );
}
