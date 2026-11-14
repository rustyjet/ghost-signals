# Design

The visual world is the real place each machine stands in. Tokens live in `src/index.css`.

## Colour

| Token | Hex | Use |
|---|---|---|
| mars-sky | `#c4925e` | Martian daytime sky, top |
| mars-horizon | `#e2bd8f` | Sky at the horizon |
| mars-storm / mars-storm-horizon | `#2e1b12` / `#5b3826` | The same sky in a dust storm (blended by `--storm`, 0–1) |
| basalt | `#241812` | Page ground; the dark side the words sit on |
| sun | `#f2e2c2` | Light text on dark ground |
| ink | `#1f140e` | Dark text on sky |
| frost | `#a8c6d6` | Cold, reserved for the Last Light game |

The Moon chapters will use black sky, bright grey ground and gold foil.

## Type

- Display: Bricolage Grotesque, 800, tracking about -0.03em. The machine's name is set enormous behind the model on the title screen.
- Reading: Atkinson Hyperlegible Next.
- Story numbers: display face, tabular numerals, unit at 0.36em beside it, a short plain label under it.

## Layout

- A chapter is a page that scrolls. Behind the words is a sticky full-screen backdrop (`src/components/story/Backdrop.tsx`). Each step has one scene:
  - **rover:** the 3D model on a real panorama. Used for the title and the last step only.
  - **photo:** a real NASA photo filling the screen and travelling across it.
  - **framed:** a small photo shown sharp at its own size.
  - **compare:** a scroll-driven wipe between two photos.
  - **black.**
- The next scene fades in over the current one between steps. Scenes that share a photo keep travelling across it.
- 1024 px and wider: words travel up the left side over a dark scrim. Framed photos sit on the right.
- Narrower: the backdrop fills the screen and its lower part is darkened. Words are read there, and each part of the words fades out before it passes the middle of the screen. Framed photos sit in the top third. Nothing is ever layered on top of the words.
- No fixed chrome except the story counter (e.g. "Day 48 on Mars"). No progress bar, no next button.

## Motion

- Everything in a chapter is scrubbed to the scrollbar and runs backwards on the way up:
  - photo pans and zooms;
  - scene cross-fades;
  - framed-photo reveals;
  - the before/after wipe;
  - the 3D camera;
  - dust;
  - the day counter;
  - each number counting from 0;
  - heading lines rising out of masks, with the body following.
- One entrance on load: the title letters rise once (0.8 s, expo out, 25 ms stagger). Scrolling then lifts them away one by one.
- Easing: ease-out curves (power3/expo out) for arrivals; no ease-in on interface motion.
- Reduced motion: nothing travels; the camera cuts per step, numbers show final values, opacity changes stay.

## Bans

Kickers/eyebrows above headings, all-caps or monospace labels, "A · B · C" meta strings, identical cards, glass blur, neon on navy, gradient text, emoji icons, drawn imitations of photographs, captions under images (credits go in the sources list), smooth-scroll libraries, scroll snapping.
