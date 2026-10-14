"use client";

// The copy-paste API + "pay in MON" call to action, placed at the very END of
// the scroll (over the closing shot), so it is the last thing a visitor reaches.
// Fades in on the shared scroll ticker like the hero copy; only the copy-button
// state lives in React. The purchase flow it links to is a dry-run demo.

import { useEffect, useRef } from "react";

import { smoothScrollProgress } from "@/lib/animation/scroll-progress";
import { subscribeToTicker } from "@/lib/animation/ticker";

/**
 * Scroll window, 0-1. The epilogue reveals over [0.75, 0.958]; this comes up as
 * the last shot settles and holds to the end of the page.
 */
const IN: [number, number] = [0.9, 0.95];

const clamp01 = (v: number): number => Math.min(Math.max(v, 0), 1);
const phase = (v: number, a: number, b: number): number => clamp01((v - a) / (b - a));

export const ClosingCta = () => {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let previous = Number.NaN;
    return subscribeToTicker(
      (time) => {
        const node = root.current;
        if (!node) return;
        const level = phase(smoothScrollProgress(time), IN[0], IN[1]);
        if (level === previous) return;
        previous = level;
        node.style.opacity = `${level}`;
        node.style.visibility = level > 0.01 ? "visible" : "hidden";
      },
      () => 0,
    );
  }, []);

  return (
    <div
      ref={root}
      style={{ opacity: 0, visibility: "hidden" }}
      className="pointer-events-none fixed inset-x-0 bottom-[5rem] z-20 flex flex-col items-center gap-3 px-6 font-sans sm:bottom-[6rem]"
    >
      <a
        href="/demo/purchase"
        className="pointer-events-auto grid h-[2.6875rem] place-items-center rounded-md bg-nav-accent px-7 text-[0.9375rem] font-semibold text-nav-accent-ink transition-colors duration-[var(--duration-fast)] ease-entrance hover:bg-nav-text"
      >
        Buy intelligence · Pay in MON ↗
      </a>
      <span className="text-[0.6875rem] leading-[1.4] text-[#ffb36b]">
        Live on Monad testnet · confirmed in MetaMask
      </span>
    </div>
  );
};
