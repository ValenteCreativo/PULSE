// 📖 PULSE sub-pages share this chrome so /agents, /menu and /contact read as
// the same product as the cinematic home route — the dark room, the mint accent,
// the bracketed frame and the nav pill — without re-mounting the 3D scene.

import Link from "next/link";
import type { ReactNode } from "react";

/** One bracket corner, matching the home HUD's vector (2px, solid). */
const Corner = ({ className }: { className: string }) => (
  <svg
    viewBox="0 0 33 33"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none absolute size-6 text-hud-corner sm:size-8 ${className}`}
  >
    <path
      d="M32 0V22C32 27.5228 27.5228 32 22 32H0"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export interface PageShellProps {
  /** Small tracked label over the heading. */
  kicker: string;
  /** The page heading, display face. */
  heading: string;
  children: ReactNode;
}

/**
 * A full-height dark surface with the home page's frame and a back-to-home nav
 * pill. The background glow mirrors the scene's fog/mint so a sub-page feels
 * like the same room with the lights up.
 */
export const PageShell = ({ kicker, heading, children }: PageShellProps) => (
  <main className="relative min-h-lvh overflow-hidden bg-[#07090d] font-sans text-hud-text">
    {/* Atmosphere — a mint glow top-centre fading into the room's dark. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_-5%,#17444655,transparent_60%),linear-gradient(#070b0f,#05080b)]"
    />

    {/* Bracketed frame, same as the scene HUD. */}
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      <span className="absolute top-9 bottom-9 left-3 w-px bg-hud-rule sm:top-12 sm:bottom-12 sm:left-4" />
      <span className="absolute top-9 right-3 bottom-9 w-px bg-hud-rule sm:top-12 sm:right-4 sm:bottom-12" />
      <span className="absolute top-3 right-9 left-9 h-px bg-hud-rule sm:top-4 sm:right-12 sm:left-12" />
      <span className="absolute right-9 bottom-3 left-9 h-px bg-hud-rule sm:right-12 sm:bottom-4 sm:left-12" />
      <Corner className="top-3 left-3 rotate-180 sm:top-4 sm:left-4" />
      <Corner className="top-3 right-3 -scale-y-100 sm:top-4 sm:right-4" />
      <Corner className="bottom-3 left-3 -scale-x-100 sm:bottom-4 sm:left-4" />
      <Corner className="right-3 bottom-3 sm:right-4 sm:bottom-4" />
    </div>

    {/* Nav pill — a link home. */}
    <nav className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center sm:top-4">
      <div className="pointer-events-auto relative flex h-[2.25rem] items-center gap-6 rounded-md border border-nav-surface bg-nav-surface px-5 backdrop-blur-[3px] sm:h-[2.5625rem]">
        <Link
          href="/"
          className="text-[0.75rem] leading-[1.2] font-semibold whitespace-nowrap text-nav-text transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70 sm:text-[0.875rem]"
        >
          {"< >"}
        </Link>
        <Link
          href="/"
          className="text-[0.75rem] leading-[1.2] font-semibold whitespace-nowrap text-nav-accent transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70 sm:text-[0.875rem]"
        >
          PULSE ↩
        </Link>
      </div>
    </nav>

    <div className="relative z-10 mx-auto flex min-h-lvh w-full max-w-[62rem] flex-col justify-center px-6 py-[7rem] sm:px-10">
      <p className="mb-4 font-sans text-[0.75rem] tracking-[0.18em] text-nav-accent uppercase">
        {kicker}
      </p>
      <h1 className="mb-10 font-display text-[2.5rem] leading-none text-nav-text uppercase whitespace-pre-line sm:text-[4rem] lg:text-[5rem]">
        {heading}
      </h1>
      {children}
    </div>

    <span className="pointer-events-none fixed bottom-5 left-1/2 z-30 -translate-x-1/2 text-[0.75rem] tracking-[0.1em] text-hud-text/70">
      From Mexico with 🖤
    </span>
  </main>
);
