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
| warn | `#ff9e6e` | Low battery in the Last Light game (always with a word, never colour alone) |

The Moon: a chapter page with `data-world="moon"` swaps the tokens: black sky to the horizon (`--color-sky`, `--color-horizon`), light lettering on it (`--color-on-sky`), a near-black ground under the words (`--color-basalt`), and no dust in the air. The grey ground and gold foil come from the real photos and the 3D model.

## Type

- Display: Bricolage Grotesque, 800, tracking about -0.03em. The machine's name is set enormous behind the model on the title screen.
- Reading: Atkinson Hyperlegible Next.
- Story numbers: display face, tabular numerals, unit at 0.36em beside it, a short plain label under it.

## Layout

- A chapter is a page that scrolls. Behind the words is a sticky full-screen backdrop (`src/components/story/Backdrop.tsx`). Each step has one scene:
  - **rover:** the 3D model on a real panorama. Used for the title and the last step only.
  - **photo:** a real NASA photo filling the screen and travelling across it.
  - **compare:** two photos of the same view filling the screen, with a scroll-driven wipe from one to the other.
  - **black.**
- Every photo fills the screen; no framed pictures. The next scene dissolves in over the current one across most of the scroll between two steps, and both keep moving while they cross. Scenes that share a photo keep travelling across it.
- At the end of the story the picture sinks into the page's dark ground before the next section, so there is never a hard edge.
- 1024 px and wider: words travel up the middle of the screen, centred, over a soft oval of dark that leaves both sides of the picture bright. On the last step the 3D machine steps to the right so the words never sit on it.
- Narrower: the backdrop fills the screen and its lower part is darkened. Words are read there, and each part of the words fades out before it passes the middle of the screen. Nothing is ever layered on top of the words.
- No fixed chrome except the story counter (e.g. "Day 48 on Mars"). No progress bar, no next button.

## The start page

- A trip outward from Earth (`src/components/journey/Journey.tsx`, stops in `src/data/journey.ts`). The page is pure black space; the real globes (Apollo 17 Earth, Apollo 11 Moon, Viking Mars) sit in a sticky layer, blended with `lighten` so their black edges vanish.
- Scrolling moves between stops: Earth shrinks behind, the Moon grows and passes, Mars grows. At each machine its NASA photo fills the screen. The corner counter is the distance from Earth, travelling on a log scale so it races after the Moon.
- Photos with black mosaic gaps (InSight) are shown whole on black instead of filling the screen. Each photo can have its own phone crop (`narrowFocus`) to keep mosaic holes off screen.
- Words are centred. Stops in space (the Moon, Mars, the distances) are read in the middle on wide screens, beside the globes, over a soft oval of dark; on wide screens the title sits above Earth rising from the bottom edge, and the Moon and Mars pass to the right of the words. A machine's photo is mostly machine, so its words are read low on every screen, over a dark band along the bottom, and fade before the middle: the machine stands above them. Phones read every stop low.
- Short stops (InSight, Sojourner) have no chapter, so they carry no button and no promise of one.
- The trip ends with the last photo sinking into black, then a footer listing where every number and picture comes from. The sticky photo layer is clipped to the journey section so it never covers the footer.

## The Last Light game

- One full screen after the story. The player drives NASA's 3D Opportunity across drawn Mars ground (three.js, `src/components/game/rover/`), chase camera behind it, while the storm comes in. Goal: drive to the marked rock, stop beside it to study it (a ring fills), and let the radio send the finding home; survive 40 days. A day is 3 s.
- The state is in the scene, not in bars:
  - the storm: the butterscotch sky and fog turn storm brown, the fog closes in, the Sun shrinks to a dull dot, the air fills with blowing dust;
  - dust on the panels: the panel materials turn dust-coloured;
  - a gust: the camera shakes a little and a burst of dust blows through;
  - heaters on: a warm glow under the rover;
  - driving: the body pitches and rolls over the ground, dust puffs from the wheels, tracks stay behind (the model's wheels are one piece with it, so they don't turn);
  - the rock: a pale ring and a thin marker pole; an arrow at the screen edge (never in the bottom part where the words are) when it is off screen;
  - the radio: a small light leaves the antenna and rises out of view;
  - cold and signal lost: the frost and the black curtain below, laid over the 3D view.
- Controls: arrow keys or W A S D only while the 3D view has focus ("Start the storm" puts it there; elsewhere the arrows scroll the page). Touch screens get a thumb stick beside the numbers. Heaters and Radio switches and Pause as before.
- Framing: the camera aims below the rover so it rides in the open upper part of the screen; the intro orbit keeps it right of the words on wide screens and above them on phones.
- Reduced motion: no shake, sway or orbit, the camera follows rigidly, the air dust stands still; driving still works because the player moves it.
- No WebGL, or the model fails to load: the photo version below plays instead (`LastLight.tsx`).

### The photo version (fallback)

- On Opportunity's real deck (the 2014 self-portraits). The state is in the picture, not in bars:
  - dust on the panels: the clean photo turns into the dusty one;
  - a gust: the dustier picture is swept off left to right behind a thin light line, the camera shakes a little and the air fills with dust;
  - the storm: the light goes dark brown;
  - cold: the colour drains and frost grows in from the edges;
  - signal lost: the picture goes black from the bottom up in rows, like the real last picture.
- The battery is a big number; each day's change floats up beside it. A one-line news line says what just happened.
- Two big switches (up is on): Heaters and Radio. The game pauses itself when it scrolls out of view or the tab is hidden.
- The deck rises out of the story's dark on scroll (scrubbed), so there is no hard edge between the story and the game.

## The Lift off game (Ingenuity)

- One full screen after the Ingenuity story: the 3D helicopter on the Jezero ground under the Mars sky. Its two rotors (separate parts in NASA's model) really turn, in opposite directions, at a speed the eye can follow.
- One big **Hold to spin** button (touch, mouse, space bar): holding speeds the blades up, letting go slows them. A **Mars air / Earth air** switch. The speed and height are big numbers; a news line says what happened.
- In the scene: dust kicked up near the ground, the shadow shrinking, the ground dropping away as the camera follows the climb, a 3 m band that lights and counts while you hover. Small shake at lift-off, bigger on a hard landing.
- Phones: the ground line sits just above the controls, measured from where they actually end up.

## Motion

- Everything in a chapter is scrubbed to the scrollbar and runs backwards on the way up:
  - photo pans and zooms;
  - scene cross-fades;
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

## The Find the mirrors game (Eagle)

- One full screen after the Eagle story, on black: NASA's LRO near-side Moon with NASA's own numbered Apollo landing sites. Wide screens: the Moon on the right, the words bottom left. Phones: the Moon sized to the space above the words, measured from where they start, so nothing overlaps.
- Tap (or click) a spot to fire; a mouse moves the aim ring first. Keyboard: the Moon is focusable, arrow keys aim (Shift for bigger steps), Enter or Space fires; the aim is announced ("Aiming at Apollo 11").
- A pulse is a short green line climbing to the Moon over 1.25 s, a ring splashing where it lands, and, when light comes back, one green dot falling home along the same line. The stopwatch counts to 2.50 s; a catch shakes the view a little and the distance pops to 385,000 km. Mirrors that sent light back stay ringed in green.
- Every green mark sits on a dark casing so it reads on the bright Moon. Reduced motion: the beam and the dot appear in place without travelling, and nothing shakes.
