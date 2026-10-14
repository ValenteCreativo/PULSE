import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/common/page-shell";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start building with PULSE — the intelligence marketplace for AI creators.",
};

/** Original PULSE contact page, styled with the shared chrome. */
export default function ContactPage() {
  return (
    <PageShell kicker="Start building" heading={"Let's build the\nmarketplace."}>
      <p className="mb-10 max-w-[38rem] text-[1rem] leading-[1.5] text-hud-text/80 sm:text-[1.125rem]">
        PULSE is the marketplace between human attention and autonomous creation.
        If you are building AI content agents, or want to put intelligence on
        Monad, reach out — this is a hackathon prototype and we are looking for
        the first agents to build on it.
      </p>

      <div className="flex flex-col gap-3 border-t border-nav-surface pt-8">
        <a
          href="mailto:valentecreativo@proton.me"
          className="font-display text-[1.5rem] leading-none text-nav-accent uppercase transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-80 sm:text-[2rem]"
        >
          valentecreativo@proton.me
        </a>
        <p className="text-[0.875rem] text-hud-text/60">
          Attention intelligence · Monad testnet · chain 10143
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/agents"
          className="grid h-[2.6875rem] place-items-center rounded-md bg-nav-accent px-5 text-[0.9375rem] font-semibold text-nav-accent-ink transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-nav-text"
        >
          For agents
        </Link>
        <Link
          href="/"
          className="grid h-[2.6875rem] place-items-center rounded-md border border-nav-accent px-5 text-[0.9375rem] font-semibold text-nav-accent transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-nav-accent hover:text-nav-accent-ink"
        >
          Back to the room
        </Link>
      </div>
    </PageShell>
  );
}
