"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { subscribeToTicker } from "@/lib/animation/ticker";
import { markIntroDone, onSceneReady } from "@/lib/page/intro";

export interface PreloaderProps {
  /** Accessible name for the loading region. */
  label: string;
}

/** Cells in the bar. Fixed, so the server and the client draw the same row. */
const CELLS = 64;
/** Share of the bar filled per second while the room is still loading. */
const PACE = 0.62;
/** …and once it is. The last of the bar is always travelled at this rate. */
const FINISH = 1.6;
/** Where the bar waits if the room is not ready yet. */
const HOLD = 0.92;
/**
 * How long the room gets before the curtain goes up regardless.
 *
 * A loader that can hang forever is worse than one that lets you in early: if
 * WebGL is refused the scene never reports anything, and the page behind this is
 * still a page.
 */
const PATIENCE = 6;

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * The curtain over the first paint.
 *
 * A field of the site's own mint with the count top-left and a bar of rounded
 * cells across the foot — the cells fill left to right, the number counts with
 * them. When the room behind it is ready the bar finishes, and the whole sheet
 * is **clipped away from the bottom up** (`inset(0 0 x% 0)`), so the hero is not
 * revealed by a fade but by the curtain leaving the frame. Only then does the
 * hero start ([[animation-system|`lib/page/intro.ts`]]).
 *
 * The count is a **real** one where it can be: the bar advances at its own pace
 * to `HOLD` and waits there for the scene to say it has loaded, compiled and
 * drawn a frame. What it must never do is finish before the room has — the whole
 * point of a loader is that what comes after it is ready.
 *
 * Everything per-frame is written straight to the elements off the shared
 * ticker: 64 cells and a number changing sixty times a second is not a thing to
 * re-render for. React is told two things, each of which happens once — that the
 * bar is full, and that the curtain has gone.
 */
export const Preloader = ({ label }: PreloaderProps) => {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLParagraphElement>(null);
  const cells = useRef<Array<HTMLSpanElement | null>>([]);
  const [full, setFull] = useState(false);
  const [gone, setGone] = useState(false);

  // The page must not be scrolled out from under the curtain — and the scroll
  // position everything is derived from is measured against a document this is
  // still covering.
  //
  // Keyed on `gone` rather than released on unmount: this component **does not**
  // unmount, it renders nothing, so an unmount cleanup would leave the page
  // locked for good.
  useEffect(() => {
    const { stop, start } = useScroll.getState();
    if (gone) {
      start();
      return;
    }
    stop();
    window.scrollTo(0, 0);
    return () => start();
  }, [gone]);

  useEffect(() => {
    if (full) return;

    let ready = false;
    const off = onSceneReady(() => {
      ready = true;
    });

    let shown = 0;
    let last = 0;
    let waited = 0;
    let lit = -1;

    const stop = subscribeToTicker(
      (time) => {
        const delta = last ? Math.min((time - last) / 1000, 0.05) : 0;
        last = time;
        waited += delta;

        const done = ready || waited > PATIENCE;
        const target = done ? 1 : HOLD;
        shown = clamp01(
          shown + Math.min(target - shown, (done ? FINISH : PACE) * delta),
        );

        const percent = Math.round(shown * 100);
        if (percent !== lit) {
          lit = percent;
          if (count.current) count.current.textContent = `${percent}%`;
          // Cells are lit by crossing a threshold, so all but a couple of these
          // write nothing on any given frame.
          const edge = shown * CELLS;
          cells.current.forEach((cell, index) => {
            if (!cell) return;
            const on = index < edge ? "1" : "0.16";
            if (cell.style.opacity !== on) cell.style.opacity = on;
          });
        }

        if (shown >= 1) setFull(true);
      },
      () => 0,
    );

    return () => {
      off();
      stop();
    };
  }, [full]);

  // **The hero starts with the curtain, not after it.** The sheet is clipped from
  // the bottom up, so the top of the window — where the headline is — is the
  // *last* thing uncovered; waiting for the curtain to be gone meant the letters
  // only began resolving once they were already in view, seconds after the page
  // appeared to have arrived. Told at the moment the lift begins, the headline is
  // half resolved by the time it is uncovered, which is what the brief asked for:
  // the hero plays *as* the curtain leaves.
  useEffect(() => {
    if (full) markIntroDone();
  }, [full]);

  // The curtain. A spring, like everything else that moves (hard rule #1) — and
  // one that arrives without overshoot, because an edge that bounces back down
  // over the page it has just revealed reads as a mistake.
  const { lift } = useSpring({
    lift: full ? 1 : 0,
    config: { tension: 82, friction: 26 },
    onChange: ({ value }) => {
      const node = root.current;
      if (!node) return;
      const cut = (value.lift as number) * 100;
      node.style.clipPath = `inset(0 0 ${cut.toFixed(2)}% 0)`;
    },
    onRest: () => {
      if (!full) return;
      setGone(true);
    },
  });
  void lift;

  if (gone) return null;

  return (
    <div
      ref={root}
      role="status"
      aria-label={label}
      aria-live="polite"
      className="fixed inset-0 z-50 bg-nav-accent font-sans text-nav-accent-ink"
    >
      <p
        ref={count}
        className="absolute top-6 left-6 font-display text-[3rem] leading-none tabular-nums sm:top-8 sm:left-8 sm:text-[4.5rem]"
      >
        0%
      </p>

      {/* The gap closes on a phone rather than the count of cells changing: each
          cell has a 1px floor, so 64 of them 4px apart is 316px of bar — wider
          than the window it is laid across, and a flex row that cannot shrink
          past its floor overflows rather than tightening. */}
      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-px sm:inset-x-8 sm:bottom-8 sm:gap-1">
        {Array.from({ length: CELLS }, (_, index) => (
          <span
            key={index}
            ref={(node) => {
              cells.current[index] = node;
            }}
            style={{ opacity: 0.16 }}
            className="h-[2rem] max-w-[0.4375rem] min-w-px flex-1 rounded-full bg-nav-accent-ink sm:h-[2.875rem]"
          />
        ))}
      </div>
    </div>
  );
};
