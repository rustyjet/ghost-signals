# Ghost Signals: submission notes (draft)

Draft text for the NASA Space Apps 2026 project page. The submission fields and judging criteria were not confirmed when this was written; check the team dashboard guides and move each part into the field it belongs to. Items in [square brackets] are for the team to fill in.

## Team

Hack Tuah

- Muhammad Juni Damia bin Jihad (team lead)
- Muhammad Akmal Harith bin Mohd Isa
- Aqilah binti Mohd Yani
- Syazwin Al-Afiqah binti Mohamad Sawal
- Nur Waffiah binti Khairul Tajudin

As registered (capitals): MUHAMMAD JUNI DAMIA BIN JIHAD, MUHAMMAD AKMAL HARITH BIN MOHD ISA, AQILAH BINTI MOHD YANI, SYAZWIN AL-AFIQAH BINTI MOHAMAD SAWAL, NUR WAFFIAH BINTI KHAIRUL TAJUDIN.

## Challenge

Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.

## Project summary

Ghost Signals is a scrolling story for readers aged about 9 to 14. Scrolling is travelling: the start page moves out from Earth, past the Moon, to Mars, and each silent NASA machine is a stop on the way. Opening one starts its chapter, told by the machine itself: Opportunity, the rover built for 90 days that lasted 5,111; Ingenuity, the helicopter allowed five flights that flew 72; Eagle, the half of Apollo 11's lunar module that stayed on the Moon; InSight, the lander that stayed in one spot for four years and listened to Mars; and Sojourner, the first rover on Mars, built for a week, which kept going for 83 days.

Each chapter opens and closes on NASA's 3D model of the machine, with real NASA photographs behind every step in between. NASA has no 3D model of Sojourner, so its chapter is told in photographs alone. Every chapter ends with something to do:

- **Last Light** (Opportunity): keep the rover alive through a Mars dust storm by deciding when to run the heaters and the radio.
- **Lift off** (Ingenuity): spin the rotors and hover at 3 metres, then switch to Earth air and see why Mars's thin air needs blades that spin about 2,400 times a minute, many times faster than a passenger helicopter's on Earth.
- **Find the mirrors** (Eagle): fire a laser at the Moon, wait the real 2.5 seconds for the light to come back, and find which Apollo crews left mirrors.
- **Listen for marsquakes** (InSight): watch the seismometer's line and catch faint marsquakes. The wind hides them until you put the dome over the seismometer. Switch to Earth's ground and the same small quake gets lost in Earth's constant shaking.
- **Plan my drive** (Sojourner): nobody could steer Sojourner live, because commands took 10 to 15 minutes to reach Mars. You plan its day on the lander's real photo, send the commands, and watch it drive itself towards the rock Yogi, slipping a little and stopping when it bumps a rock. Park where the real rover stood and the lander's later colour photo appears, with the real rover and its real tracks in the same spot.

## How it addresses the challenge

- **The equipment is the storyteller.** Each machine tells what happened to it in its own words. The narration is labelled as imagined; what it describes happened.
- **Accuracy first.** Every number and historical claim on screen has a row in `docs/FACTS.md` with the NASA or NSSDCA page it came from. Game numbers that are simplified say so on screen.
- **Hands-on.** Each game teaches one real idea: power from sunlight, lift in thin air, timing light to measure distance, how quiet Mars is, and why a rover on Mars has to drive itself.
- **Reaches young readers.** Short screens, one true number at a time, large type, works on a phone.

## NASA data and resources used

- 4 NASA 3D models (NASA 3D Resources): Opportunity, Ingenuity, the Apollo lunar module, InSight. NASA has none of Sojourner.
- More than 50 photographs and image files from NASA, JPL, NSSDCA and NASA's Scientific Visualization Studio, including Opportunity's last image, Apollo 11 surface photos, an LRO view of the Moon with NASA's Apollo site markers, InSight's own photos of its seismometer and dome, and the Pathfinder lander's photos of Sojourner. Each one is listed with its NASA ID and source page in `docs/CREDITS.md` and credited on the page.
- 4 NASA sound recordings, each played by a "Hear it" button under the story step it belongs to: Ingenuity's blades on its fourth flight, recorded by the Perseverance rover's microphone; Neil Armstrong's "The Eagle has landed" radio call (NSSDCA); wind on InSight's solar panels, felt by its seismometer; and Mars wind recorded by Perseverance, under Opportunity's step about the wind cleaning its panels (Opportunity had no microphone, and the caption says so). Listed with their source pages in `docs/CREDITS.md` and credited on the page.
- About 200 checked facts from NASA, JPL and NSSDCA pages and from Sojourner's day-by-day operations logs in NASA's Planetary Data System, listed with their sources in `docs/FACTS.md`.

## Use of artificial intelligence

Hack Tuah built Ghost Signals with Claude Code, Anthropic's AI coding assistant (Claude models). How it was used:

- **Code.** Claude Code wrote most of the source code (React, TypeScript, the scroll animation and the five games), working from the team's direction and reviewed by the team at each checkpoint.
- **Writing.** Claude drafted first versions of the machines' narration. The team chose the stories and the facts in them, and made every edit that fits the narration to the rules in `CLAUDE.md`: short, concrete, for a ten-year-old, with no invented quotes.
- **Research.** Claude read NASA, JPL and NSSDCA pages to find and check facts. No fact was taken from the model's memory: every claim on screen was matched to a NASA source and logged with that source in `docs/FACTS.md`. Where a page could only be seen through a search summary, the row says so. For Plan my drive, Claude found and read Sojourner's own operations logs and a JPL engineering paper on how it was driven, and every line the game uses was checked against them.
- **Design checks.** Claude ran design and accessibility checks and took screenshots at desktop and phone width.

What AI did **not** make:

- **No AI-generated images, video, audio or 3D models.** Every picture and model is real NASA material. In the Last Light driving game, the Mars ground, rocks, sky and dust are drawn live by the game's code (no image files); the rover is NASA's own 3D model.
- **Drawn parts are labelled.** The seismometer line in Listen for marsquakes and the rover's outline and drive in Plan my drive are drawn by the game's code, and the screen says so. Plan my drive's two lander photos were lined up on each other by an image-matching script, which only scaled and cropped them. The marsquake game's sound is made live by its code from the line it draws, and the screen says so.
- **NASA's recordings are only trimmed, levelled and, where needed, raised in pitch.** As NASA released them, the three Mars recordings are almost all below 150 Hz, which laptop and phone speakers cannot play, so they were raised two octaves with ffmpeg (same length, nothing added). Each caption says so, and `docs/CREDITS.md` lists every change.
- **No invented quotes.** Every quotation comes from a NASA source.

Done by the team without AI: the idea behind Ghost Signals, the choice of machines and stories, and the narration edits.

## Tools

Vite, React, TypeScript, Tailwind CSS, GSAP ScrollTrigger and SplitText, Google's model-viewer, three.js (the driving game), sharp, ffmpeg and Pillow (image conversion, cropping and lining up; trimming and levelling the NASA sound clips), the Web Audio API (the marsquake game's sound), Claude Code.

## Links

- Live site: https://rustyjet.github.io/ghost-signals/
- Source code: https://github.com/rustyjet/ghost-signals
- 3-minute demo video: [link]. Every chapter and all five games, with captions and music (no voice). Rendered from `demo-video/remotion` (composition `GhostSignalsLong`); site footage captured from the built site by `demo-video/capture/`.
- Project demo (required): [link to the video or slide deck]. Either a video of 30 seconds or less, or a slide deck of up to seven slides including the title. Hosted on YouTube, Google Drive, GitHub or similar, publicly viewable with no login. Include the team name, team members, the challenge, and how NASA data made the project possible. Slide decks must be in English; a video in another language needs English subtitles. No images, video or audio of anyone under 18.
