# CLAUDE.md — NASA Space Apps 2026: "The Mars Ghost Fleet"

## 1. Project Overview & Challenge Context
- **Event:** NASA International Space Apps Challenge 2026 (Kuala Lumpur)
- **Challenge:** *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*
- **Target Audience:** School-age space enthusiasts (ages ~8–16) and general public/judges.
- **Core Objective:** Create an interactive web-based storytelling experience that brings NASA's retired/discarded Martian spacecraft to life using 3D models, accurate historical/scientific mission data, first-person narrative logs, and a short educational mini-game.
- **Key Judging Criteria:**
  1. **Historical & Scientific Accuracy:** Real mission timelines, landing sites, engineering mechanisms, and scientific discoveries must be accurate (no fabricated NASA facts).
  2. **Storytelling & Empathy:** Frame discarded hardware not as "trash," but as robotic pioneers that completed heroic missions before going silent.
  3. **Interactivity & Usability:** Smooth, intuitive browser-based 3D inspection and an engaging mini-game that teaches real Mars engineering constraints.

---

## 2. Product Concept: "The Mars Ghost Fleet: From Flight to Silence"
Users land on an interactive 3D Martian surface/orbital map featuring **4 iconic retired NASA Mars spacecraft**. Selecting a beacon zooms into the spacecraft's 3D model, unlocks interactive hardware hotspots, plays/displays its first-person "Mission Log" timeline, and lets the user play a mission-themed mini-game.

### The 4 Hero Artifacts (Strictly Scoped for 48-Hour Hackathon)
1. **Ingenuity (Mars Helicopter)**
   - *Landing Site:* Jezero Crater (`18.4447° N, 77.4508° E`)
   - *Mission Arc:* Designed for 5 test flights; completed 72 flights before rotor damage ended operations in Jan 2024.
   - *Key Engineering Fact:* Coaxial counter-rotating carbon-fiber blades spinning at ~2,400–2,900 RPM to generate lift in Mars's ~1% Earth-density atmosphere.
2. **Opportunity (MER-B / "Oppy")**
   - *Landing Site:* Meridiani Planum (`1.9462° S, 354.4734° E`)
   - *Mission Arc:* Planned for 90 sols (Martian days); survived nearly 15 Earth years (5,111 sols) until a 2018 global dust storm blocked solar power.
   - *Key Engineering Fact:* Found evidence of past liquid water (hematite "blueberries"); final telemetry inspired *"My battery is low and it's getting dark."*
3. **InSight Lander**
   - *Landing Site:* Elysium Planitia (`4.5024° N, 135.6234° E`)
   - *Mission Arc:* Operated 2018–2022; stationary geophysical lander listening to Mars's interior until Martian dust covered its solar arrays.
   - *Key Engineering Fact:* SEIS seismometer detected over 1,300 marsquakes, revealing Mars's crust, mantle, and liquid core structure.
4. **Sojourner (Mars Pathfinder Rover)**
   - *Landing Site:* Ares Vallis (`19.13° N, 33.22° W`)
   - *Mission Arc:* First wheeled vehicle on another planet (1997); designed for 7 sols, operated for 83 sols.
   - *Key Engineering Fact:* Microwave-sized (~11.5 kg) rover proving mobile autonomy and rocker-bogie suspension on Mars.

---

## 3. Recommended Tech Stack
- **Framework:** Next.js (App Router) or Vite + React + TypeScript
- **Styling:** Tailwind CSS + Framer Motion (for smooth HUD/narrative transitions)
- **3D Engine:** Three.js via `@react-three/fiber` and `@react-three/drei`
- **Audio:** Web Audio API / lightweight synthesized sound effects (ambient Martian wind, telemetry pings, marsquake low-pass rumble — zero external audio file dependencies required)
- **Data Storage:** Static TypeScript/JSON data modules (`src/data/artifacts.ts`) for fast, offline-reliable hackathon demoing.

---

## 4. Architecture & Directory Structure
```text
src/
├── app/ or pages/
│   └── page.tsx                  # Main entry: Mars Orbital Hub -> Artifact View -> Mini-Game Modal
├── components/
│   ├── canvas/
│   │   ├── MarsHubScene.tsx      # 3D Mars globe/terrain with clickable coordinates/beacons
│   │   ├── ArtifactViewer.tsx    # 3D model inspector with OrbitControls, lighting, & 3D Html hotspots
│   │   └── FallbackMesh.tsx      # Procedural stylized 3D placeholder if .glb asset is missing
│   ├── ui/
│   │   ├── MissionLogDrawer.tsx  # Scrollytelling POV cards, real NASA stats, & discovery badges
│   │   ├── HotspotCard.tsx       # Engineering breakdown popup when clicking 3D hardware pins
│   │   └── AudioAmbience.tsx     # Toggleable Web Audio API synth (wind/telemetry beeps)
│   └── minigame/
│       └── DustStormSurvival.tsx # 2D HTML5 Canvas physics/resource mini-game
├── data/
│   └── artifacts.ts              # Structured NASA mission facts, coordinates, hotspots, & POV scripts
└── public/
    └── models/                   # NASA official .glb files (ingenuity.glb, opportunity.glb, insight.glb, sojourner.glb)
```

---

## 5. Key Implementation Guidelines for Claude Code

### A. 3D Models & Asset Resilience
- We will source official `.glb` models from NASA's 3D Resources (`science.nasa.gov/3d-resources`) and place them in `public/models/`.
- **CRITICAL:** Build `ArtifactViewer.tsx` with graceful error boundaries / Suspense fallbacks (`FallbackMesh.tsx`) so the app renders immediately and cleanly even before all `.glb` files are downloaded into `public/models/`.
- Use `<Html>` from `@react-three/drei` to attach interactive numbered pins (`[1]`, `[2]`, `[3]`) directly to 3D coordinates on each spacecraft (e.g., Solar Array, High-Gain Antenna, SEIS Seismometer, Carbon Rotors).

### B. Interactive Mini-Game Specification (`DustStormSurvival.tsx`)
- Keep the mini-game self-contained in a single HTML5 `<canvas>` React component (~60–90 seconds per playthrough) tied directly to the story:
  - **Concept:** *"Last Transmission: Dust Storm Survival"*
  - **Mechanic:** The player controls a solar-powered Mars rover/lander as dust particles accumulate on its solar panels and storm opacity increases.
  - **Gameplay Loop:**
    1. Tilt/angle solar panels toward shifting sunlight breaks while triggering occasional wind-gust "cleaning events."
    2. Balance **Battery Wattage** between *Heaters* (preventing electronics from freezing) and *High-Gain Antenna* (uploading final science packets to Earth).
    3. Goal: Transmit 100% of the final scientific dataset before power reaches 0%.
  - **Educational Payoff:** End screen compares the player's score with the real historical fate of Opportunity and InSight.

### C. UI/UX & Tone
- **Aesthetic:** Clean "NASA Mission Control meets Interactive Museum" — deep space slate (`#0B0F19`), Martian rust accents (`#E05A47`), telemetry cyan (`#38BDF8`), monospace data readouts (`JetBrains Mono` / `Space Grotesk`).
- **Accessibility for Young Audiences:** Keep explanations concise, punchy, and free of unexplained jargon. Include a "Quick Facts" telemetry strip (Launch Date, Landing Site, Planned Life vs. Actual Life, Status).

---

## 6. Immediate Build Roadmap (Step-by-Step)
1. **Scaffold App:** Initialize project with React, TypeScript, Tailwind CSS, `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, and `lucide-react`.
2. **Create `src/data/artifacts.ts`:** Populate accurate NASA mission data, coordinates, 3D hotspot coordinates/descriptions, and first-person story logs for all 4 spacecraft.
3. **Build 3D Scene (`MarsHubScene` & `ArtifactViewer`):** Implement smooth camera transitions between the Mars overview and individual spacecraft inspection with working hotspots and fallback geometries.
4. **Build Narrative & Audio UI:** Connect `MissionLogDrawer` and Web Audio synth ambience.
5. **Build Mini-Game (`DustStormSurvival.tsx`):** Implement the HTML5 Canvas solar/transmission survival mini-game accessible from the main HUD or after reading an artifact's story.
6. **Polish & Verify:** Ensure responsive layout, zero console errors, and crisp performance for live hackathon pitching.
```

Save this as `CLAUDE.md` in your project root, run `claude` in your terminal, and tell it: *"Read CLAUDE.md and execute Step 1 through Step 3 of the roadmap."* Let me know if you want help grabbing the exact NASA `.glb` links or refining the game mechanics!