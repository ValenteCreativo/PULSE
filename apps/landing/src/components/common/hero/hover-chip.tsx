"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { hasFinePointer } from "@/lib/scene/device";

export interface ChipHint {
  /** The line the chip types out. */
  text: string;
  /**
   * `mint` is the site's accent with black on it — the chip over a case, and
   * over anything the page is *inviting* a click on. `night` is the inverse,
   * black with the accent on it: quieter, for the sets that hold no work.
   */
  tone?: "mint" | "night";
  /**
   * The word after the divider, with the arrow. Left out — and the divider and
   * the arrow go with it — when the chip is a **statement** rather than an
   * offer: there is nothing to explore on a set showing noise, and an arrow
   * promising otherwise is the kind of small lie a page is judged on.
   */
  action?: string;
}

export interface HoverChipProps {
  /** What the chip says — `null` when nothing is under the pointer. */
  hint: ChipHint | null;
}

/** Characters a second the name is typed at. */
const SPEED = 26;
/** How hard the chip is pulled to the cursor each frame, `0`–`1`. */
const CHASE = 0.22;
/** Where it sits relative to the pointer, in px. */
const OFFSET = { x: 18, y: -14 };

/**
 * The chip that follows the cursor over the wall of televisions.
 *
 * **DOM, not a plane in the scene.** The label used to hang in the room above
 * the hovered set, turned the way that set was turned, and every problem it had
 * came from that: it was foreshortened to a different size on every television,
 * it had to be sized in pixels against the axial depth to stay readable, and it
 * could be buried behind whatever stood in front of it. A chip on the cursor is
 * a chip on the cursor — one size, one place, always legible.
 *
 * **Two tones.** Over a case it is the site's accent with the arrow and the word
 * after it, because there is somewhere to go. Over a set showing noise there is
 * not: the chip turns black with the accent on the type and drops the arrow, so
 * the offer is only ever made where it can be kept.
 *
 * It chases rather than tracks: the position is eased toward the pointer each
 * frame, so it trails the cursor slightly instead of being welded to it. The
 * name **types itself** on a clock, restarting whenever the label changes, and
 * the chip fades and scales out when there is nothing under the pointer.
 *
 * Everything here is written **straight to the element** off the shared ticker.
 * React is told the label and nothing else — position, opacity and the typed
 * substring all change on most frames of a hover.
 */
export const HoverChip = ({ hint }: HoverChipProps) => {
  const label = hint?.text ?? null;
  const action = hint?.action;
  const night = hint?.tone === "night";
  const root = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  /**
   * **There is no cursor to put a chip on.** The scene already withholds its
   * own hover on a touch device, but the team ring reports a pointer over it
   * from a finger as readily as from a mouse — which left a label parked at the
   * last place the screen was touched, chasing nothing. Read after mount, never
   * during render: the server has no pointer to ask about, and answering
   * differently on the two passes is a hydration mismatch.
   */
  const [cursor, setCursor] = useState(false);
  /** Live pointer, live chip, and where the typing is up to. */
  const state = useRef({
    pointer: { x: 0, y: 0 },
    at: { x: 0, y: 0, placed: false },
    level: 0,
    since: 0,
    typed: -1,
  });

  useEffect(() => setCursor(hasFinePointer()), []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      state.current.pointer.x = event.clientX;
      state.current.pointer.y = event.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // A new label restarts the typing. Kept out of the loop so the clock is only
  // reset when the name really changes, not on every frame it is shown.
  useEffect(() => {
    state.current.since = performance.now() / 1000;
    state.current.typed = -1;
  }, [label]);

  useEffect(() => {
    return subscribeToTicker(
      (time) => {
        const node = root.current;
        const text = name.current;
        if (!node || !text) return;
        const live = state.current;
        const seconds = time / 1000;
        const wanted = label !== null;

        // Chase the cursor. The first placement jumps, so the chip does not fly
        // in from the corner of the window the first time it is used.
        if (!live.at.placed) {
          live.at.x = live.pointer.x;
          live.at.y = live.pointer.y;
          live.at.placed = true;
        }
        live.at.x += (live.pointer.x - live.at.x) * CHASE;
        live.at.y += (live.pointer.y - live.at.y) * CHASE;
        live.level += ((wanted ? 1 : 0) - live.level) * 0.18;

        node.style.transform = `translate3d(${(live.at.x + OFFSET.x).toFixed(
          1,
        )}px, ${(live.at.y + OFFSET.y).toFixed(1)}px, 0) scale(${(
          0.9 +
          live.level * 0.1
        ).toFixed(3)})`;
        node.style.opacity = `${live.level}`;
        node.style.visibility = live.level > 0.01 ? "visible" : "hidden";

        if (!label) return;
        const out = Math.min(
          label.length,
          Math.floor((seconds - live.since) * SPEED),
        );
        if (out !== live.typed) {
          live.typed = out;
          text.textContent = label.slice(0, out);
        }
      },
      () => 0,
    );
  }, [label]);

  if (!cursor) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className={`pointer-events-none invisible fixed top-0 left-0 z-30 flex items-center gap-3 rounded-full py-2.5 font-sans text-[1rem] leading-[1.2] whitespace-nowrap opacity-0 will-change-transform ${
        night
          ? "border border-nav-accent/40 bg-black text-nav-accent"
          : "bg-nav-accent text-nav-accent-ink"
      } ${action ? "pr-5 pl-6" : "px-6"}`}
    >
      <span ref={name} className="min-w-[1ch] font-semibold" />
      {action ? (
        <>
          <span
            className={`h-4 w-px ${night ? "bg-nav-accent/30" : "bg-nav-accent-ink/30"}`}
          />
          <span className="flex items-center gap-1.5">
            {action}
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="size-4"
            >
              <path
                d="M2.5 8h11M9.5 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </>
      ) : null}
    </div>
  );
};
