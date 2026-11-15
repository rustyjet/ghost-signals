# Ghost Signals: submission notes (draft)

Draft text for the NASA Space Apps 2026 project page. The submission fields and judging criteria were not confirmed when this was written; check the team dashboard guides and move each part into the field it belongs to. Items in [square brackets] are for the team to fill in.

## Challenge

Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.

## Project summary

Ghost Signals is a scrolling story for readers aged about 9 to 14. Scrolling is travelling: the start page moves out from Earth, past the Moon, to Mars, and each silent NASA machine is a stop on the way. Opening one starts its chapter, told by the machine itself: Opportunity, the rover built for 90 days that lasted 5,111; Ingenuity, the helicopter allowed five flights that flew 72; and Eagle, the half of Apollo 11's lunar module that stayed on the Moon. InSight and Sojourner are shorter stops on the journey.

Each chapter opens and closes on NASA's 3D model of the machine, with real NASA photographs behind every step in between. Every chapter ends with something to do:

- **Last Light** (Opportunity): keep the rover alive through a Mars dust storm by deciding when to run the heaters and the radio.
- **Lift off** (Ingenuity): spin the rotors and hover at 3 metres, then switch to Earth air and see why Mars's thin air needs blades that spin ten times faster.
- **Find the mirrors** (Eagle): fire a laser at the Moon, wait the real 2.5 seconds for the light to come back, and find which Apollo crews left mirrors.

## How it addresses the challenge

- **The equipment is the storyteller.** Each machine tells what happened to it in its own words. The narration is labelled as imagined; what it describes happened.
- **Accuracy first.** Every number and historical claim on screen has a row in `docs/FACTS.md` with the NASA or NSSDCA page it came from. Game numbers that are simplified say so on screen.
- **Hands-on.** Each game teaches one real idea: power from sunlight, lift in thin air, and timing light to measure distance.
- **Reaches young readers.** Short screens, one true number at a time, large type, works on a phone.

## NASA data and resources used

- 4 NASA 3D models (NASA 3D Resources): Opportunity, Ingenuity, the Apollo lunar module, InSight.
- 40 photographs and image files from NASA, JPL, NSSDCA and NASA's Scientific Visualization Studio, including Opportunity's last image, Apollo 11 surface photos and an LRO view of the Moon with NASA's Apollo site markers. Each one is listed with its NASA ID and source page in `docs/CREDITS.md` and credited on the page.
- About 140 checked facts from NASA, JPL and NSSDCA pages, listed with their sources in `docs/FACTS.md`.

## Use of artificial intelligence

Hack Tuah built Ghost Signals with Claude Code, Anthropic's AI coding assistant (Claude models). How it was used:

- **Code.** Claude Code wrote most of the source code (React, TypeScript, the scroll animation and the three games), working from the team's direction and reviewed by the team at each checkpoint.
- **Writing.** Claude drafted first versions of the machines' narration. The team chose the stories and the facts in them, and made every edit that fits the narration to the rules in `CLAUDE.md`: short, concrete, for a ten-year-old, with no invented quotes.
- **Research.** Claude read NASA, JPL and NSSDCA pages to find and check facts. No fact was taken from the model's memory: every claim on screen was matched to a NASA source and logged with that source in `docs/FACTS.md`. Where a page could only be seen through a search summary, the row says so.
- **Design checks.** Claude ran design and accessibility checks and took screenshots at desktop and phone width.

What AI did **not** make:

- **No AI-generated images, video, audio or 3D models.** Every picture and model is real NASA material.
- **No invented quotes.** Every quotation comes from a NASA source.

Done by the team without AI: the idea behind Ghost Signals, the choice of machines and stories, and the narration edits.

## Tools

Vite, React, TypeScript, Tailwind CSS, GSAP ScrollTrigger and SplitText, Google's model-viewer, sharp (image conversion), Claude Code.

## Links

- Live site: [URL once deployed]
- Source code: [repository URL]
