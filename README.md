# Ghost Signals

A scrolling story about the machines NASA left on the Moon and Mars, for readers aged about 9 to 14. Made for the NASA Space Apps Challenge 2026 challenge *Abandoned but not Forgotten*.

Scrolling is travelling. The start page moves out from Earth, past the Moon, to Mars, and stops at each machine. Each machine tells its own story in a chapter, and each chapter ends with a game:

| Machine | Where | The game |
|---|---|---|
| Opportunity | Perseverance Valley, Mars | **Last Light**: keep the rover alive through a dust storm |
| Ingenuity | Jezero crater, Mars | **Lift off**: hover at 3 metres in Mars air, then in Earth air |
| Eagle (Apollo 11) | Sea of Tranquility, the Moon | **Find the mirrors**: time a laser's trip to the Moon and back |
| InSight | Elysium Planitia, Mars | **Listen for marsquakes**: catch faint quakes on a seismometer once the dome keeps the wind off |
| Sojourner | Ares Vallis, Mars | **Plan my drive**: plan a day's drive on the lander's photo, because commands took minutes to arrive |

## Accuracy

Every number and historical claim on screen has a row in [docs/FACTS.md](docs/FACTS.md) with the NASA, JPL or NSSDCA page it came from. Every photograph and 3D model is real NASA material, listed in [docs/CREDITS.md](docs/CREDITS.md) and credited on the page. The machines' voices are imagined, and the page says so; what they describe happened. The games simplify their numbers and say so on screen.

## Running it

Needs Node 20.19 or newer (or 22.12+), as Vite 8 requires.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

The build is a static site with hash routing (`#/signal/eagle`), so it works on any static host without server settings.

## How it is built

- Vite, React, TypeScript and Tailwind CSS v4.
- GSAP ScrollTrigger scrubs every animation to the native scrollbar; there is no smooth-scroll library or scroll snapping.
- NASA's 3D models are shown with Google's `<model-viewer>`, using a Draco decoder served from `public/draco/` so nothing loads from a third-party CDN.
- Chapter text lives in `src/data/chapters/*.ts`, typed by `src/data/types.ts`. `node scripts/check-copy.mjs` enforces the copy limits (headings at most 5 words, body at most 150 characters).
- The games are in `src/components/game/`.

Design and product notes: [DESIGN.md](DESIGN.md), [PRODUCT.md](PRODUCT.md). How AI tools were used: [docs/SUBMISSION.md](docs/SUBMISSION.md).
