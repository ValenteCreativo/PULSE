import { SiteHeader } from "@/components/common/header/site-header";
import { RobotProvider, RobotView } from "@/components/common/robot-view";
import { homeHero, type HomeAboutIcon } from "@/data/mocks/home";
import { getHomeStructuredData } from "@/utils/seo/structured-data";

/** The room at rest, captured from the running scene (`tools/capture-still.mjs`). */
const ROOM = {
  desktop: "/assets/robot/room-desktop.webp",
  mobile: "/assets/robot/room-mobile.webp",
};

const BUTTON =
  "grid h-[2.5rem] place-items-center rounded-md px-4 text-[0.875rem] leading-[1.2] font-semibold whitespace-nowrap sm:h-[2.6875rem] sm:text-[1rem]";

/** The about cards' marks, drawn the way the panel draws them. */
const AboutMark = ({ icon }: { icon: HomeAboutIcon }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
    {icon === "circle" && (
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" />
    )}
    {icon === "triangle" && (
      <path d="M12 3 21 20H3Z" fill="none" stroke="currentColor" />
    )}
    {icon === "square" && (
      <rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" />
    )}
  </svg>
);

/**
 * The home page as a robot gets it (D-016): the same words, at rest, in the
 * server HTML — no preloader, no scene, no readouts.
 *
 * People's page keeps every word of the cases and the about block
 * *inside* the client-only scene, so nothing below the first screen was ever in
 * the document a crawler reads. Here each act is a plain section under a still
 * of the room, in the design's faces and tokens. The hero keeps `HeroCopy`'s
 * geometry (the headline 5.25rem down on a 535px measure, the column at the
 * foot) so the two forms share a first screen.
 */
export const RobotHome = () => {
  const { headline, intro, primaryCta, secondaryCta, nav, cases, about, closing } =
    homeHero;

  return (
    <RobotProvider robot>
      <RobotView />
      <main className="w-full font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getHomeStructuredData()),
          }}
        />
        <SiteHeader
          label={nav.label}
          homeLabel={nav.home}
          menuLabel={nav.menu}
          contactLabel={nav.contact}
          contactHref={nav.contactHref}
        />

        {/* The first screen: the room, still, with the words where the scene
            puts them. */}
        <section
          aria-label={homeHero.sceneLabel}
          className="relative h-lvh w-full overflow-hidden bg-black"
        >
          <picture>
            <source media="(min-width: 640px)" srcSet={ROOM.desktop} />
            <img
              src={ROOM.mobile}
              alt=""
              fetchPriority="high"
              decoding="sync"
              className="absolute inset-0 size-full object-cover"
            />
          </picture>
          <h1 className="absolute top-[5.25rem] left-1/2 w-[calc(100%-3.5rem)] -translate-x-1/2 text-center font-display text-[2rem] leading-none text-nav-accent uppercase sm:top-[6.0625rem] sm:w-[33.4375rem] sm:text-[3rem] lg:text-[4.5rem]">
            {headline}
          </h1>
          <div className="absolute inset-x-0 bottom-[4.5rem] flex flex-col items-center sm:bottom-[3.125rem]">
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className="mb-3 size-6 text-hud-text sm:mb-4 sm:size-8"
            >
              <path d="M16.5 0V32M32 16.5H0" stroke="currentColor" strokeWidth="1" />
            </svg>
            <p className="mb-6 w-[calc(100%-3rem)] text-center text-[0.875rem] leading-[1.35] text-hud-text sm:mb-[1.975rem] sm:w-[25.6875rem] sm:text-[1rem] sm:leading-[1.2]">
              {intro}
            </p>
            <div className="flex gap-2 sm:gap-3">
              <span className={`${BUTTON} bg-nav-accent text-nav-accent-ink`}>
                {primaryCta.label}
              </span>
              <span
                className={`${BUTTON} border border-nav-accent text-nav-accent sm:w-[8.9375rem]`}
              >
                {secondaryCta.label}
              </span>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-20 px-6 py-20 text-foreground sm:gap-28 sm:py-28">
          <section aria-labelledby="robot-cases">
            <p className="mb-2 text-[0.875rem] uppercase text-foreground/70">
              {cases.label}
            </p>
            <h2
              id="robot-cases"
              className="mb-8 font-display text-[2rem] leading-none uppercase sm:text-[3rem]"
            >
              {cases.heading}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {cases.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-xl border border-foreground/10 p-5"
                >
                  <h3 className="text-[1.25rem] font-semibold">{item.name}</h3>
                  <p className="mt-2 text-[0.875rem] text-foreground/70">
                    {item.tags.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="robot-about">
            <h2
              id="robot-about"
              className="mb-8 font-display text-[2rem] leading-none uppercase sm:text-[3rem]"
            >
              {about.heading}
            </h2>
            <p className="max-w-[40rem] text-[1.25rem] leading-[1.3] sm:text-[1.5rem]">
              {about.lead.map((part, index) => (
                <span key={index} className={part.dim ? "text-foreground/70" : undefined}>
                  {part.text}
                </span>
              ))}
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {about.cards.map((card) => (
                <li
                  key={card.icon}
                  className="rounded-xl border border-foreground/10 p-5"
                >
                  <AboutMark icon={card.icon} />
                  <p className="mt-4 text-[0.9375rem] leading-[1.4]">{card.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="robot-closing" className="text-center">
            <h2
              id="robot-closing"
              className="font-display text-[2.5rem] leading-none uppercase sm:text-[4rem]"
            >
              {closing.heading}
            </h2>
            <p className="mt-4 text-[1.125rem] text-foreground/70">{closing.lead}</p>
          </section>
        </div>
      </main>
    </RobotProvider>
  );
};
