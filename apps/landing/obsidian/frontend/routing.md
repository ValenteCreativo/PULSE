---
tags: [frontend, stable]
updated: 2026-08-10
---

# Routing

Next.js 16 App Router. The defining convention: **routes delegate to views**.

> [!warning]
> Per `AGENTS.md`, this version of Next.js may differ from older knowledge. Heed
> deprecation notices before writing routing code.

## Route → View delegation

`app/**/page.tsx` files contain **no UI logic**. They import a component from
`src/views/` and render it. ADR: [[decisions-log]] ADR-0003.

```tsx
// src/app/page.tsx
import { generateMetadata } from "@/utils/seo/generate-page-metadata";
import { HomeView } from "@/views/home";

// The one thing a route file holds besides its view — see the note below.
export const metadata = generateMetadata({ title: "Work", url: "/work" });

export default function Home() {
  return <HomeView />;
}
```

All layout and UI logic lives in `src/views/home.tsx` (`HomeView`). The view is
a **Server Component**; isolate any client-only animation in a leaf component —
see [[component-conventions]] hard rule #6.

> [!note] `metadata` is the one thing a route file holds besides its view
> Next reads it from the segment itself, so it cannot move into `src/views/`.
> Everything that *can* live with the page does: the home page's `WebPage`
> JSON-LD is rendered by `HomeView`, not by `page.tsx`. See [[seo-metadata]].

What it composes today, all of it fed from `data/mocks/home.ts`:

| Piece | Role |
|-------|------|
| `<Preloader>` | The curtain over the first paint; lifting it is what starts the hero ([[components/common]]) |
| `<SiteHeader>` | The nav pill, `fixed` to the top for the whole scroll |
| `<SceneHud>` | The window's hairline frame and its four readouts, also `fixed` |
| `<LazyTvScene>` | The 3D scene, `sticky` inside an `840lvh` section — four acts driven by the scroll ([[scene-3d]]) |
| `<HeroCopy>` | The first screen's words, outside the sticky box so they leave with that screen |


The scene's own client leaf renders the rest over the canvas as siblings of it:
the carousel section's `<CasePanel>`, the black layer, the cursor's `<HoverChip>`,
the `<PanelStack>` of opaque panels — team, then about — that slide up over the
room and carry the page's later sections, and `<ClosingCopy>` over the last shot.
All of them have to talk to the scene, which is why they are mounted there rather
than here. See [[components/common]].

## Current routes

| Route | File | View |
|-------|------|------|
| `/` | `src/app/page.tsx` | `views/home.tsx` → `HomeView` |

> [!important] One route, and therefore one `href`
> Nothing in the UI links anywhere else. `/contact`, `/work`, `/work/<slug>` and
> `/privacy-policy` were all being linked before anyone built them; every `href`
> that is content is optional now, and its component renders a `<span>` rather
> than a dead anchor when it is absent. **Write the route first, then write the
> `href` back** — `data/mocks/home.ts`, or `siteConfig.privacyPolicyUrl`. See
> [[decisions-log]] ADR-0037.

## Special files

`src/app/` carries the App Router special files:

| File | Role |
|------|------|
| `layout.tsx` | Root layout — provider tree, font, `metadata` + `viewport`, JSON-LD |
| `loading.tsx` | Suspense fallback — its presence enables streaming |
| `error.tsx` | Route-segment error boundary (Client Component) |
| `not-found.tsx` | 404 page — served with a 404 status |
| `robots.ts` / `sitemap.ts` | Generate `/robots.txt` and `/sitemap.xml` — see [[seo-metadata]] |
| `api/<resource>/route.ts` | API endpoints (Route Handlers) — see [[api-architecture]] |

## Adding a route

1. Create `src/app/<route>/page.tsx` — a `metadata` export and a view, nothing else.
2. Create `src/views/<route>.tsx` — the actual page component.
3. Use route groups `app/(feature)/` to scope feature pages without affecting the URL.
4. Follow the [[new-page]] playbook.

## Layouts

- `src/app/layout.tsx` — the **root layout**. Holds the provider tree
  (`ScrollLayout` → `AdaptiveGrid` / `ReducedMotion` / `Cookie` → children),
  loads the two local faces (Chakra Petch + Big Shoulders Inline — Onest is gone,
  see [[design-system]]) and `globals.css`, takes its `lang` from `siteConfig`,
  exports `metadata` + `viewport` — and **owns the title template**, which is why
  no other segment sets one — and renders the site's JSON-LD. See [[data-flow]].
- Reusable layout *wrappers* (not route layouts) live in `src/layouts/` —
  e.g. [[smooth-scroll|ScrollLayout]].

## Navigation

Use **standard Next.js navigation** — `<Link>` from `next/link` and `useRouter`
from `next/navigation`. ADR: [[decisions-log]] ADR-0005.

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';
```

> [!note]
> Earlier drafts of `generic-layout-prompt.md` referenced `<AnimLink>` /
> `useAnimRouter()`. Those were never built and the convention is dropped — use
> `next/link` directly.

## SEO per route

Each route exports `metadata` via the shared generator — see [[seo-metadata]].

## Related

[[system-overview]] · [[component-conventions]] · [[new-page]]
