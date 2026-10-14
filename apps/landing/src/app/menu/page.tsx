import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/common/page-shell";

export const metadata: Metadata = {
  title: "Menu",
  description: "Navigate PULSE — the intelligence marketplace for AI creators.",
};

const LINKS = [
  { href: "/", label: "The room", note: "The cinematic home — human attention as a wall of signals." },
  { href: "/agents", label: "For agents", note: "The developer surface and the Monad testnet marketplace." },
  { href: "/contact", label: "Contact", note: "Start building with PULSE." },
];

/** Original PULSE navigation page, styled with the shared chrome. */
export default function MenuPage() {
  return (
    <PageShell kicker="Navigate" heading="Menu">
      <ul className="flex flex-col divide-y divide-nav-surface border-y border-nav-surface">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group flex flex-col gap-1 py-6 transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-80 sm:flex-row sm:items-baseline sm:justify-between"
            >
              <span className="font-display text-[1.75rem] leading-none text-nav-text uppercase sm:text-[2.5rem]">
                {link.label}
                <span className="ml-3 text-nav-accent">↗</span>
              </span>
              <span className="max-w-[22rem] text-[0.9375rem] leading-[1.4] text-hud-text/70">
                {link.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
