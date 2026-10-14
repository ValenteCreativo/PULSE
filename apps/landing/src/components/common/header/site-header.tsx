// 📖 Docs: obsidian/frontend/components/common.md

import Link from "next/link";

export interface SiteHeaderProps {
  /** Accessible name for the nav landmark. */
  label: string;
  /** The bracketed glyph pair at the left of the pill — a link home. */
  homeLabel: string;
  menuLabel: string;
  contactLabel: string;
  /**
   * Where *Contact* goes — **absent while nothing is there to go to**, in which
   * case the word renders as a word: no tab stop, no pointer, no hover. It
   * pointed at `/contact`, which was never built.
   */
  contactHref?: string;
}

/**
 * The nav pill, pinned to the top of the window.
 *
 * Read off the Figma frame (node `1097:251` → *1441:331*) rather than eyeballed,
 * because almost everything about it was wrong the first time: the pill is
 * **translucent white at 20%** over a 3px backdrop blur with a border of the
 * same 20% — not a solid grey — and its radius is **6px**, not a stadium. The
 * chip is `#dbfffe`, 109 wide, also 6px. Type is Chakra Petch **SemiBold 14**
 * throughout; the readouts in [[components/common|the frame]] are the Regular
 * 16 ones.
 *
 * Both labels are placed by their **text centres** (`< >` at 42.5, `Contact` at
 * 50% + 97), which is how the design positions them, so the pill's spacing holds
 * whatever the strings are.
 *
 * `fixed`: the brief is that it stays at the top for the whole scroll. A server
 * component — nothing here holds state, and keeping it off the client is what
 * lets the route's only client leaf stay the scene.
 *
 * **On a phone the pill is the same pill, 79% of the size.** Every offset in it
 * is a text centre from the design, so the three labels cannot simply be let
 * loose in a flex row without moving all three; each one carries its own
 * smaller number instead, scaled off the pill's width, and the shape the design
 * drew survives the change of size. At 390px it comes to 240 of them, which is
 * what the frame's top row was sized around — see
 * [[components/common|`<SceneHud>`]].
 */
/** *Contact*'s place in the pill — one string, whether it is a link or not. */
const CONTACT =
  "absolute top-[0.5625rem] left-[calc(50%+4.8125rem)] -translate-x-1/2 text-[0.75rem] leading-[1.2] font-semibold whitespace-nowrap text-nav-text sm:top-[0.6875rem] sm:left-[calc(50%+6.0625rem)] sm:text-[0.875rem]";

export const SiteHeader = ({
  label,
  homeLabel,
  menuLabel,
  contactLabel,
  contactHref,
}: SiteHeaderProps) => (
  <nav
    aria-label={label}
    // **`pointer-events-none` on the bar, `auto` on the pill.** The nav is a
    // full-width strip across the top of the window, and without this it
    // swallows every click along that strip — which is what made the dev
    // panel's button in the top-right corner unclickable.
    className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center font-sans sm:top-4"
  >
    <div className="pointer-events-auto relative h-[2.25rem] w-[13.75rem] rounded-md border border-nav-surface bg-nav-surface backdrop-blur-[3px] sm:h-[2.5625rem] sm:w-[17.4375rem]">
      <Link
        href="/"
        className="absolute top-[0.5625rem] left-[2.125rem] -translate-x-1/2 text-[0.75rem] leading-[1.2] font-semibold whitespace-nowrap text-nav-text transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70 sm:top-[0.6875rem] sm:left-[2.65625rem] sm:text-[0.875rem]"
      >
        {homeLabel}
      </Link>

      <button
        type="button"
        className="absolute -top-px left-1/2 flex h-[2.25rem] w-[5.5rem] -translate-x-1/2 items-center gap-[0.375rem] rounded-md bg-nav-accent pr-4 pl-[1.25rem] transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90 sm:h-[2.5625rem] sm:w-[6.8125rem] sm:gap-[0.4375rem] sm:pr-6 sm:pl-[1.5625rem]"
      >
        <span className="text-[0.75rem] leading-[1.2] font-semibold whitespace-nowrap text-nav-accent-ink sm:text-[0.875rem]">
          {menuLabel}
        </span>
        {/* Three rules, 14×1 each at 0 / 3 / 6 — an icon, so it carries no label
            of its own; the button's text is the accessible name. */}
        <span
          aria-hidden="true"
          className="relative block h-[0.4375rem] w-3 sm:w-3.5"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-nav-accent-ink" />
          <span className="absolute inset-x-0 top-[0.1875rem] h-px bg-nav-accent-ink" />
          <span className="absolute inset-x-0 top-[0.375rem] h-px bg-nav-accent-ink" />
        </span>
      </button>

      {contactHref ? (
        <Link
          href={contactHref}
          className={`${CONTACT} transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70`}
        >
          {contactLabel}
        </Link>
      ) : (
        <span className={CONTACT}>{contactLabel}</span>
      )}
    </div>
  </nav>
);
