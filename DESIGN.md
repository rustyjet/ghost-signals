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
- A stop whose machine has no chapter carries no button and no promise of one. Every machine has one now.
- The trip ends with the last photo sinking into black, then a footer listing where every number and picture comes from. The sticky photo layer is clipped to the journey section so it never covers the footer.

## The Last Light game

- One full screen after the story. The player drives NASA's 3D Opportunity across drawn Mars ground (three.js, `src/components/game/rover/`), chase camera behind it, while the storm comes in. Goal: drive to the marked rock, stop beside it to study it (a ring fills), and let the radio send the finding home; survive 40 days. A day is 3 s.
- The state is in the scene, not in bars:
  - the storm: the butterscotch sky and fog turn storm brown, the fog closes in, the Sun shrinks to a dull dot, the air fills with blowing dust;
  - dust on the panels: the panel materials turn dust-coloured;
  - a gust: the camera shakes a little and a burst of dust blows through;
  - heaters on: a warm glow under the rover;
  - driving: the body pitches and rolls over the ground, dust puffs from the wheels, tracks stay behind (the model's wheels are one piece with it, so they don't turn);
  - the rock: a pale ring laid onto the ground's shape (so dunes never cut it) and a thin marker pole; while studying, a second ring fills over a faint track, starting at the far side; an arrow at the screen edge (never in the bottom part where the words are) when it is off screen;
  - the radio: a small light leaves the antenna and rises out of view;
  - cold and signal lost: the frost and the black curtain below, laid over the 3D view.
- The battery (both versions, `BatteryCell` in `LastLightHud.tsx`): a drawn cell with a terminal nub and the number inside it. The fill counts with the number; digits over the fill turn dark (a clipped copy), so they read at every level. A day's loss lingers as a faint band, then drains. Below 20 the cell turns warn orange with the word "low"; a gaining day says "charging". Reduced motion: no counting, no band.
- Sent home (both versions, `SentHome` in `LastLightHud.tsx`): a drawn radio dish beside the count. Findings waiting on board sit as square blocks in a small open tray beside it (two to a row, five drawn at most; the tray hides when empty), with "N to send" in the label. A send: the dish's signal arcs flash, a small light rises from it, the count pops. Radio off: the dish dims (the switch says Off). Reduced motion: the arcs flash only.
- The switches (both versions, `Lever` in `LastLightHud.tsx`): up is on, and the knob carries what it switches. Heaters: a thermometer whose level is the rover's warmth (the only place warmth shows as a level; "Getting cold" stays as the word). Radio: the same dish as Sent home, its arcs beating slowly while on (lit and still under reduced motion). The knob is thrown with a small overshoot, the track lights when on, an off card goes quieter; On/Off is always in words. Focus: no ring after a mouse or touch press (the keys drive while the switches are clicked, and Chrome would otherwise often ring a clicked switch, which reads as "selected"); from the keyboard (Tab, Space, Enter) a cream ring on the card's own edge, so a focused switch never looks bigger than its neighbour. Pause works the same way.
- The news line (both versions, `NewsLine` in `LastLightHud.tsx`): a round badge with a drawn sign for what it is about (battery, thermometer, Sun, wind, rock, dish), then the line. Warnings are orange with an orange badge, cold is frost with a frost badge; the badge shape always says it too. A new line rises in as a short blur clears (340 ms); reduced motion: a fade. The words sit on dark: a text halo, a denser bottom band on phones, and on wide screens a soft oval of dark behind the words so the rover stays bright.
- The day counter (both versions, `DayCounter` in `LastLightHud.tsx`): "Day 14" large with "of 40" beside it, and under it a strip of one thin bar per day, as tall as that day's sunlight from the rules' own curve, so the storm reads as a dip to plan around (a forecast drawn as a shape, not a progress bar). Days lived solid, days ahead faint, today bright with a dot over it; the word "sunlight" beside it. Each new day number rises in; reduced motion: it just changes. The top fade is deeper so it sits on dark; the off-screen rock arrow stays below it.
- Pause (both versions, `PauseButton` in `LastLightHud.tsx`): a button with a drawn glyph, two bars for Pause and a triangle for Keep going, swapped in a quick scale and blur crossfade. Running it is quiet (dark, thin outline); paused it turns cream and breathes a soft ring, since nothing moves until it is pressed (no ring under reduced motion). P toggles it while the game has focus. When the game pauses itself (scrolled away, tab hidden) the news says so with a pause badge.
- Controls: arrow keys or W A S D only while the 3D view has focus ("Start the storm" puts it there; elsewhere the arrows scroll the page). Touch screens get a thumb stick above the words on the right. Heaters and Radio switches and Pause as before.
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

- One full screen after the Ingenuity story: the 3D helicopter on the Jezero ground under the Mars sky. Its two rotors (separate parts in NASA's model) really turn, in opposite directions, at a speed the eye can follow. Past about a third of lift-off speed they blur (`rotorBlur.ts`): the blades fade and a soft see-through disc with faint streak rings grows over the circle each one sweeps, full by about 90%. In Earth air the blades turn slowly enough that they stay sharp.
- One big **Hold to spin** button (touch, mouse, space bar): holding speeds the blades up, letting go slows them. A **Mars air / Earth air** switch. The speed and height are big numbers; a news line says what happened.
- The sky: deeper overhead, butterscotch in the middle, pale toward the horizon, with a soft bright haze just above the far horizon that stays with the far crater floor. Farthest of all (moving a sixteenth as fast as the ground): faint bands of high dust haze drifting very slowly (still under reduced motion) and, on wide screens, a small pale Sun with a soft halo, up and to the left, the side the shadow falls away from. Phones have no clear corner for the Sun, so it is left out there.
- The heading is the stage: "Your turn.", then "Now Earth air." (or Mars) after the first hover, then "You flew it twice." Each new stage rises in word by word out of a mask (reduced motion: it just changes). It rises into view scrubbed to the scroll as the game arrives, like the story's headings. On wide screens it stops short of the height pole, shrinking only as much as a long stage needs.
- The Hold to spin button: Ingenuity's two rotors seen from above sit in a dark disc beside the words and turn with the blades in the scene (opposite ways), fading into a blurred disc as they speed up. It presses like an arcade button: held, it sinks onto its darker lip and brightens; let go, it springs back. Reduced motion: the blades stay still and only the disc shows the speed.
- The Mars air / Earth air switch: one cream thumb slides between the sides; it is a dark-lettered copy of the labels clipped to one half, so the lettering turns at the thumb's edge as it slides (no slide under reduced motion). Each side draws its air: a circle with a few dots for thin Mars air, packed with dots for Earth air (a picture, not to scale). A tick marks a side you have hovered in; on narrow phones the tick takes the drawing's place. Arrow keys move between the sides.
- The numbers: under the speed, a thin track fills with the blade speed and carries a "lift-off" mark at the speed that just lifts it in the air you are in (from the game's own lift rule); switching air slides the mark (far left for Earth air), and the fill brightens once it passes. Under the height ("m" at the small unit size), a drawn sign and a word say what it is doing: On the ground, Going up, Hovering, Coming down, and Falling fast in warn orange and bold when a hard landing is coming, so the player can ease off in time.
- The news line is Last Light's (`NewsLine` in `LastLightHud.tsx`) with its own badges: rotor, going up, too high, a gentle landing, a bump, thin air, and a tick. A hard landing and too high are warnings (orange); a hover reached is cream with a tick, in bold. Every line the game can say sits invisibly under the shown one, and every stage under the heading, so the controls keep the height of the longest: nothing moves mid-flight (on phones that height sets the ground line and the scale, so a news line that grew by one line used to shift the whole scene). The lines are kept short enough for three lines on a 360 px phone.
- The 3 m band: dashed edges while it waits, with "3 m" and "stay 3 s" at the right edge. With the helicopter inside, the edges go solid and light, and the band fills left to right as the seconds count ("1.4 of 3 s"), draining while it is out. Done in this air: full, with a tick and "done".
- Saying what to do next: reaching the band says to stay there 3 seconds with short taps; slipping out says which way to go back (too high: let go; too low: hold), at most every 2.5 s, and coming back says so. After a hover: land gently, then try Earth air; a gentle landing then says to switch air.
- The shadow is built from the helicopter's parts: a dark body, the blades (a thin line at rest, a soft disc as they spin up) and, on the ground only, a tight contact shadow under the feet. Climbing, it slides along the ground to one side (the Sun at an angle) and grows softer and fainter, a second height cue beside the pole.
- The rotor's dust (`downwash.ts`): soft puffs blown out along the ground to both sides from under the rotor; they slow, billow up a little, grow and fade. How much follows the lift the blades make and how near the ground the rotor is (none by about 3 m), spreading wider as it climbs; the same in both airs, since the wash holds up the same helicopter. A puff at lift-off, a big burst on a hard landing. The faint wind dust stays light. Reduced motion: a still haze at the ground that grows and fades.
- Under the button, two separate lines. Where there is a mouse: "Or click it once, then hold [space]", with a drawn key that sinks while space is held (pressing the button always selects it, so this is true in every browser). Then, quieter: the game's numbers are simpler than the real helicopter's.
- In the scene: dust kicked up near the ground, the shadow shrinking, a 3 m band that lights and counts while you hover. Small shake at lift-off, bigger on a hard landing.
- Height you can see: the view is zoomed out so the ground, the shadow and the 3 m band are all on screen at the start, and the helicopter is drawn at true scale against them (the model fills about half its frame, so the frame is twice its size). A height pole stands on the ground beside it, striped like a surveyor's rod (dark and cream, half a metre each, so height can be counted at a glance), numbered every metre to 8 m (3 m a size up), with a soft footing shadow. Once airborne, a cream marker rides up the pole level with the feet, with a dotted line across to them. The camera follows only when the rotor would leave the top of the screen; then the pole's marks slide past and the near ground drops away, while a far crater floor (the same NASA Jezero photo, finer and hazier) moves a fifth as fast, so more distant ground shows behind as it climbs. The band's label sits at the right edge and hides when the band drops behind the controls.
- Standing on the ground: the ground photo's top edge is its far, hazy distance, so the photo starts a little above the ground line and the feet stand inside it on rocks, with a dark shadow under them at rest.
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
- The landing-site numbers are drawn over NASA's printed ones, at the same places (NASA's dots; each label anchored at the edge of NASA's box nearest its dot, so where it is bigger than NASA's, on phones, it grows away from the dot and 12 and 14 never touch). Dark labels with cream numbers, sized from the Moon but never under 10.5 px. They show the game: lit green while aimed at; green with a tick (and a green ring on the spot) once its mirrors sent light back; dimmed and crossed out once fired at and found to have no mirrors.
- The Moon is the only control: tap (or click) a spot to fire; a mouse moves the aim ring first. Keyboard: the Moon is focusable, arrow keys aim (Shift for bigger steps), Enter or Space fires; the aim is announced ("Aiming at Apollo 11"). No separate Fire button: it would fire at a stale aim (on phones, the middle of the Moon). A line under the numbers says how to fire, with a drawn crosshair, and follows what you are doing: touch screens, "Tap a spot on the Moon to fire."; with a mouse, "Click a spot on the Moon to fire. Or press [Tab] to use the keys.", and while the mouse is over the Moon, "Click to fire at Apollo 11" (or bare ground, or empty space); with the Moon focused from the keyboard, the keys drawn as caps (arrows, Enter, Shift for bigger steps) and "Aiming at …" in green; while light is in flight, "Wait for the light to come back." It keeps room for two lines with a mouse, so the words above never jump. The drawn key is shared with Lift off (`Key.tsx`). While light is in flight the cursor over the Moon shows it is busy.
- The heading is how the hunt is going (`StageHeading`, shared with Lift off): "Find the mirrors.", then "Two more to find.", "One more to find.", "All three found." Each new one rises in word by word; it rises into view scrubbed to the scroll. Its size also follows the screen height, so two lines fit on short wide screens.
- The stopwatch turns laser green while light is out, and under "there and back" two legs fill: out to the Moon, then back home with the light. If nothing comes back, the back leg turns dashed and stays empty. The distance's "?" dims while waiting; when light returns the distance counts up to 385,000 (0.65 s) and pops, so it reads as worked out from the time (reduced motion: it just appears).
- Mirrors found ("Mirrors found: 1 of 3", then a row of slots): each found site is drawn as the panel of corner cubes it left, green dots in a green frame with "Apollo 11" under it; Apollo 15's 300 are drawn as three times as many dots as the 100 at 11 and 14 (a picture, not to scale). The cubes light up in a quick diagonal wave when light comes back, again on every later catch from that site. Not found yet: a dashed panel with a question mark, the same for every slot, so it gives nothing away.
- The news line is the other games' (`NewsLine`), with its own badges: a Moon to start, a beam for "Fired", a cream tick in bold for each mirror found (a goal), a returning arrow for light back again, a crossed circle for no mirrors or nothing back, and an arrow flying past a circle for a miss. It keeps room for three lines (four on wide screens), the heading keeps room for two on wide screens and the fire hint for two, so the words never jump as they change.
- The sight: a green ring with four ticks and a centre dot, each on a dark casing. On a landing site it snaps onto the site's dot and tightens (the pulse then goes to that dot); off the Moon it turns dashed and dimmer, since that pulse would fly past; while light is out it waits where you fired, dim, without ticks. Touch screens show no sight until the first tap.
- The beam: a flash where it leaves the station; a bright pale-green core with a soft green glow climbing to the Moon; behind it a faint cone that widens on the way, as a real beam spreads (drawn, no number); a glowing spot where it lands, fading, with the ring. Light coming back is a pale dot with a green glow and a short tail. The glow is an SVG blur in screen units, so a beam going straight up still glows.
- A pulse is a short green line climbing to the Moon over 1.25 s, a ring splashing where it lands, and, when light comes back, one green dot falling home along the same line. The stopwatch counts to 2.50 s; a catch shakes the view a little and the distance pops to 385,000 km. Mirrors that sent light back stay ringed in green.
- Every green mark sits on a dark casing so it reads on the bright Moon. Reduced motion: the beam and the dot appear in place without travelling, and nothing shakes.
