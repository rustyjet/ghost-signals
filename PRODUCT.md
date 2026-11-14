# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

School-age space enthusiasts, roughly 9 to 14, reading on a phone or a school/home computer. Also the NASA Space Apps 2026 judges, who see it once on a laptop.

## Product Purpose

Ghost Signals tells the stories of NASA machines left on the Moon and Mars (Opportunity, Ingenuity, the Apollo 11 Eagle descent stage, with short stops for InSight and Sojourner). Each machine tells its own story in the first person while the reader scrolls past its real NASA 3D model. Success: a ten-year-old reads a whole chapter and remembers one true number from it.

## Positioning

Real NASA 3D models and real NASA photographs, told by the machine itself, with every number checked against a NASA source. Not a fact sheet: one idea and one true number per screen.

## Capabilities and Constraints

- Static site (Vite, React, TypeScript, Tailwind v4, HashRouter). No backend.
- The page scrolls natively. Animation is scrubbed to the scrollbar; nothing snaps or hijacks the wheel.
- Copy limits are enforced at build time: heading at most 5 words, body at most 150 characters.
- Every number or historical claim needs a checked row in `docs/FACTS.md`.
- Built solo over the hackathon weekend (14–15 Nov 2026).

## Brand Commitments

- Name: Ghost Signals.
- Voice: the machine, first person, past tense, dry and understated. Feelings come from facts.
- User-stated: no generic "AI-made" look; Awwwards-level interactive scroll experience (references: awwwards.com web-interactive, glinto.co.kr); counting numbers and text reveals; always works on desktop and phone.

## Evidence on Hand

- NASA 3D models in `public/models/` (credits in `docs/CREDITS.md`).
- NASA photographs in `public/photos/` (credits in `docs/CREDITS.md`).
- No invented quotes, testimonials or figures may be added.

## Product Principles

1. Accuracy first: a line that cannot be sourced is rewritten, not shipped.
2. One idea, one true number per screen.
3. The machine and its real place lead; the interface stays out of the way.
4. Phones are a first-class layout, not a squeezed desktop.

## Accessibility & Inclusion

Keyboard-operable, visible focus, alt text, readable contrast, works at 320 px wide, reduced motion respected (nothing travels, numbers show final values), nothing carried by sound alone.
