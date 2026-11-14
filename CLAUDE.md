# Ghost Signals — NASA Space Apps 2026

Entry for the challenge *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*. Solo build over the hackathon weekend (14–15 Nov 2026).

## What it is

A scroll-driven web story for ages ~9–14. Scrolling is travelling: the start page is a journey outward from Earth past the Moon and Mars, and each silent NASA machine is a stop. Inside a chapter, the page really scrolls: the real NASA 3D model stays on screen (CSS sticky) over a real NASA panorama, while the words travel up past it and the camera, sky, day counter, numbers and text reveals all follow the scrollbar (`src/components/StoryScene.tsx`, driven by each chapter's `steps`). Product and design context for the impeccable skill: `PRODUCT.md`, `DESIGN.md`.

## Chapters

1. Opportunity — scroll scene + "Last Light" dust-storm game (full scene, two levers)
2. Apollo 11 descent stage + laser retroreflector — laser-ranging toy
3. Ingenuity — rotor lift toy (Earth air vs. Mars air)
4. InSight, Sojourner — short stops on the journey, no full chapter
5. Pioneer 10 — only if time remains

## Rules that must not be broken

- **Accuracy.** No number or historical claim goes in the app from memory. It needs a checked row in `docs/FACTS.md` with a NASA/NSSDCA source. Narration is labelled as imagined. No invented quotes. Scene markers (dates, distances) follow the same rule.
- **Design process.** Before any UI work load `impeccable` (read its `craft-floor.md`), `emil-design-eng` (motion and polish) and `design-taste-frontend` (its bans and width checks; its HTML starter kit does not apply to this React app). The user asked for these three by name. Run `impeccable detect` on changed UI files before committing. Build one screen, screenshot it in Chrome at desktop and phone width, critique it, and fix it before copying the pattern anywhere else. Show the user at checkpoints.
- **Banned (read as AI-made):** cream paper with terracotta accents, all-caps or monospace labels above headings, "A · B · C" meta strings, numbered cards that aren't a real sequence, identical boxes with the same shadow, fade-up on every section, dark navy with neon glow, glass-blur cards, emoji icons, filler lines, AI-generated images.
- **Look:** colour comes from the real place (Mars: butterscotch sky → storm brown, basalt ground, pale sun; Moon: black sky, bright grey ground, gold foil). Bricolage Grotesque very large for display, Atkinson Hyperlegible for reading. Tokens live in `src/index.css`.
- **Motion:** scrubbed to the scrollbar with GSAP ScrollTrigger (`scrub`), running backwards on the way up. Native scrolling only: no smooth-scroll library, no snapping, no wheel or touch hijacking, no one-flick-one-step. No fixed chrome except the story counter (no progress bar, no next button, no floating pills). One load entrance per page (the title). Games use the `game-feel` skill: state shown in the scene, not in bars.
- **Writing:** short, concrete, real moments. Written for a ten-year-old, without talking down.
- **Accessibility:** keyboard-operable, visible focus, alt text, reduced motion respected (camera cuts, numbers final, still dust), readable contrast, works at phone width, nothing carried by sound alone.

## Stack

Vite + React + TypeScript + Tailwind v4 (static site, `HashRouter`). GSAP ScrollTrigger + SplitText for scroll-scrubbed animation; native scroll. 3D via `<model-viewer>` with NASA `.glb` files in `public/models/` (Draco decoder bundled in `public/draco/`). Chapters are lazy-loaded. Content lives in `src/data/chapters/*.ts` (typed by `src/data/types.ts`).

Commands: `npm run dev`, `npm run build`.

## Submission notes

- The submission must describe how AI tools were used.
- Judging criteria and submission fields are not confirmed; check the team dashboard guides.
