# Ghost Signals — NASA Space Apps 2026

Entry for the challenge *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*. Solo build over the hackathon weekend (14–15 Nov 2026).

## What it is

A scroll-driven web story for ages ~9–14. Scrolling is travelling: the start page is a journey outward from Earth past the Moon and Mars, and each silent NASA machine is a stop. Inside a chapter, the real NASA 3D model is pinned full-screen while scrolling moves the camera, changes the sky, and brings in one thought at a time (`src/components/StoryScene.tsx`, driven by each chapter's `scene` steps).

## Chapters

1. Opportunity — scroll scene + "Last Light" dust-storm game (full scene, two levers)
2. Apollo 11 descent stage + laser retroreflector — laser-ranging toy
3. Ingenuity — rotor lift toy (Earth air vs. Mars air)
4. InSight, Sojourner — short stops on the journey, no full chapter
5. Pioneer 10 — only if time remains

## Rules that must not be broken

- **Accuracy.** No number or historical claim goes in the app from memory. It needs a checked row in `docs/FACTS.md` with a NASA/NSSDCA source. Narration is labelled as imagined. No invented quotes. Scene markers (dates, distances) follow the same rule.
- **Design process.** Load the `frontend-design` skill before any UI work and check the choice against its AI-tells list. Build one screen, screenshot it in Chrome at desktop and phone width, critique it, and fix it before copying the pattern anywhere else. Show the user at checkpoints.
- **Banned (read as AI-made):** cream paper with terracotta accents, all-caps or monospace labels above headings, "A · B · C" meta strings, numbered cards that aren't a real sequence, identical boxes with the same shadow, fade-up on every section, dark navy with neon glow, glass-blur cards, emoji icons, filler lines, AI-generated images.
- **Look:** colour comes from the real place (Mars: butterscotch sky → storm brown, basalt ground, pale sun; Moon: black sky, bright grey ground, gold foil). Bricolage Grotesque very large for display, Atkinson Hyperlegible for reading. Tokens live in `src/index.css`.
- **Motion:** tied to scroll position (GSAP ScrollTrigger + Lenis, see `src/scroll/smoothScroll.ts`, use the `gsap-scrolltrigger` skill). One orchestrated moment per screen. Games use the `game-feel` skill: state shown in the scene, not in bars.
- **Writing:** short, concrete, real moments. Written for a ten-year-old, without talking down.
- **Accessibility:** keyboard-operable, visible focus, alt text, reduced motion respected (Lenis off, still dust), readable contrast, works at phone width, nothing carried by sound alone.

## Stack

Vite + React + TypeScript + Tailwind v4 (static site, `HashRouter`). GSAP ScrollTrigger + Lenis for scroll. 3D via `<model-viewer>` with NASA `.glb` files in `public/models/` (Draco decoder bundled in `public/draco/`). Chapters are lazy-loaded. Content lives in `src/data/chapters/*.ts` (typed by `src/data/types.ts`).

Commands: `npm run dev`, `npm run build`.

## Submission notes

- The submission must describe how AI tools were used.
- Judging criteria and submission fields are not confirmed; check the team dashboard guides.
