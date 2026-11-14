# Ghost Signals — NASA Space Apps 2026

Entry for the challenge *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*. Solo build over the hackathon weekend (14–15 Nov 2026).

## What it is

An interactive website for ages ~9–14. The player is a new operator at a listening station: drag a radio dial through static, lock on to a silent NASA machine, and hear its story in its own voice.

Every chapter uses one template with five parts:

1. 3D model with numbered pins (what each part did) and first-person story beats
2. "Try it" interaction showing how the hardware worked
3. What we learned (the science)
4. Still matters (what it led to today)
5. Quick facts + sources

Finishing a chapter earns a mission patch; all patches unlock the Fleet Log page.

## Chapters, in build order

1. Opportunity — dust-storm power game (the one real game)
2. Apollo 11 descent stage + laser retroreflector — laser-ranging toy
3. Ingenuity — rotor lift toy (Earth air vs. Mars air)
4. InSight — spot the marsquake
5. Sojourner — story first, drive-planning puzzle if time allows
6. Pioneer 10 — stretch, story only

## Rules that must not be broken

- **Accuracy.** No number or historical claim goes in the app from memory. It needs a checked row in `docs/FACTS.md` with a NASA/NSSDCA source. Narration is labelled as imagined. No invented quotes.
- **No generic AI look.** Banned: dark navy with neon glow, gradient headline text, glass-blur cards, emoji as icons, centred hero with "Get started", filler lines like "inspiring the next generation", AI-generated images.
- **Style is a 1970s field kit:** paper, black ink, one red, hard offset shadows, stamps, sticker patches, physical short motion. Tokens live in `src/index.css`; use them instead of new colours.
- **Writing:** short, concrete, real moments. Written for a ten-year-old, without talking down.
- **Accessibility from the start:** keyboard-operable, visible focus, alt text, reduced-motion respected, AA contrast, works at phone width, nothing carried by sound alone.

## Stack

Vite + React + TypeScript + Tailwind v4 (static site, `HashRouter`). 3D via the `<model-viewer>` web component with NASA `.glb` files in `public/models/`; a NASA photo is the fallback. No Three.js scene, no game library. All content lives in `src/data/chapters/*.ts` (typed by `src/data/types.ts`).

Commands: `npm run dev`, `npm run build`.

## Cut order if behind

Pioneer 10 → Sojourner puzzle → sound effects → InSight interaction → pins on later models.

## Submission notes

- The submission must describe how AI tools were used.
- Judging criteria and submission fields are not confirmed; check the team dashboard guides.
