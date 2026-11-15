// The start page: a trip outward from Earth. Each stop is a place on the way, with how far it is.
// Every distance and claim has a row in docs/FACTS.md (section "Home page").

export type Globe = 'earth' | 'moon' | 'mars'

/** Where a globe sits: x, y are offsets from the screen centre in screen widths/heights; s = scale; o = opacity. */
export interface Pose {
  x: number
  y: number
  s: number
  o: number
}

export interface GlobeImage {
  src: string
  alt: string
  credit: string
  name: string
  /** The planet's disc inside the photo, as a CSS clip-path: the black around it is cut away, so a globe in
      front hides the one behind it instead of letting it show through. Fitted to the photo's edge. */
  disc: string
}

export interface MachinePhoto {
  src: string
  w: number
  h: number
  alt: string
  credit: string
  name: string
  /** Where the photo's focus sits, as CSS object-position. */
  focus?: string
  /** The same for screens under 1024 px, when it needs to differ. */
  narrowFocus?: string
  /** 'contain' shows the whole photo on black (for mosaics with black gaps). Default: fill the screen. */
  fit?: 'cover' | 'contain'
}

export interface Stop {
  id: string
  /** Kilometres from Earth while this stop is on screen. */
  km: number
  /** A big number, set in the display face. */
  figure?: { value: string; label: string }
  heading?: string
  body?: string
  /** A machine on this world: its photo fills the screen while this stop is read. */
  machine?: {
    name: string
    photo: MachinePhoto
    /** Chapter slug, when its story is built. */
    slug?: string
  }
  /** Where each globe is while this stop is read. Phones use `narrow` when given. */
  globes: Partial<Record<Globe, Pose>>
  narrow?: Partial<Record<Globe, Pose>>
}

const P = 'photos/'

/** Where the start page's numbers come from (docs/FACTS.md, "Home page"). Listed in its footer. */
export const journeySources = [
  { label: 'NASA Science: Moon facts', url: 'https://science.nasa.gov/moon/facts/' },
  { label: 'NASA: Hazard: Distance from Earth (Mars)', url: 'https://www.nasa.gov/hrp/hazard-distance-from-earth/' },
  { label: 'NSSDCA: Apollo 11 Lunar Module', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C' },
  { label: 'NASA Science: Opportunity mission page', url: 'https://science.nasa.gov/mission/mer-opportunity/' },
  { label: "NASA: After Three Years on Mars, NASA's Ingenuity Helicopter Mission Ends", url: 'https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/' },
  { label: 'NASA: NASA Retires InSight Mars Lander Mission After Years of Science', url: 'https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/' },
  { label: "NASA Photojournal: Opportunity's Last Message (PIA22929)", url: 'https://science.nasa.gov/photojournal/opportunitys-last-message' },
  { label: 'NASA Science: Mars Pathfinder', url: 'https://science.nasa.gov/mission/mars-pathfinder/' },
  { label: 'NASA Photojournal: Sojourner on Mars (PIA01122)', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA01122' },
]

export const globes: Record<Globe, GlobeImage> = {
  earth: {
    src: P + 'earth.webp',
    alt: 'The whole Earth seen from space: blue ocean, white clouds and brown land on black.',
    credit: 'NASA, photographed by the Apollo 17 crew (AS17-148-22727)',
    name: 'Earth, December 1972',
    disc: 'circle(48.9% at 51.92% 49.98%)',
  },
  moon: {
    src: P + 'moon.webp',
    alt: 'The whole Moon, grey with dark patches, on black.',
    credit: 'NASA, photographed by the Apollo 11 crew on the way home (AS11-44-6667)',
    name: 'The Moon, July 1969',
    disc: 'circle(47.4% at 50.24% 48.32%)',
  },
  mars: {
    src: P + 'mars.webp',
    alt: 'The whole of Mars, rusty orange, on black.',
    credit: 'NASA/JPL/USGS, Viking orbiter mosaic (PIA00407)',
    name: 'Mars',
    disc: 'circle(46.9% at 49.97% 49.97%)',
  },
}

// Shorthands for poses that repeat.
const gone: Pose = { x: 0, y: 0, s: 0.02, o: 0 }
const passed = (x: number, y: number): Pose => ({ x, y, s: 3.2, o: 0 })

export const stops: Stop[] = [
  {
    id: 'earth',
    km: 0,
    globes: { earth: { x: 0, y: 1.02, s: 1.7, o: 1 }, moon: gone, mars: gone },
    narrow: { earth: { x: 0, y: 0.5, s: 1.5, o: 1 } },
  },
  {
    id: 'leaving',
    km: 60000,
    body: 'Every machine in this story left from here.',
    globes: { earth: { x: 0.22, y: 0.12, s: 0.42, o: 1 }, moon: { x: 0.1, y: -0.05, s: 0.06, o: 1 }, mars: gone },
    narrow: { earth: { x: 0.05, y: -0.1, s: 0.42, o: 1 }, moon: { x: -0.05, y: -0.26, s: 0.06, o: 1 } },
  },
  {
    id: 'moon',
    km: 384400,
    figure: { value: '384,400', label: 'kilometres from Earth' },
    heading: 'The Moon.',
    body: 'The closest world to ours. People have walked here, and left things behind.',
    globes: { earth: { x: -0.08, y: 0.4, s: 0.05, o: 0.8 }, moon: { x: 0.28, y: 0, s: 0.95, o: 1 }, mars: gone },
    narrow: { earth: { x: -0.32, y: -0.38, s: 0.05, o: 0.8 }, moon: { x: 0, y: -0.2, s: 0.78, o: 1 } },
  },
  {
    id: 'eagle',
    km: 384400,
    machine: {
      name: 'Eagle',
      slug: 'eagle',
      photo: {
        src: P + 'eagle.webp',
        w: 2000,
        h: 2000,
        alt: "Apollo 11's lunar module Eagle standing on the grey Moon under a black sky, with Buzz Aldrin unloading an experiment beside it.",
        credit: 'NASA, photographed by Neil Armstrong (AS11-40-5927)',
        name: 'Eagle on the Moon, July 1969',
        focus: '50% 40%',
      },
    },
    body: 'The half that stayed, from Apollo 11.',
    globes: { earth: { x: -0.08, y: 0.4, s: 0.05, o: 0 }, moon: { x: 0.28, y: 0, s: 1.1, o: 0.4 }, mars: gone },
    narrow: { moon: { x: 0, y: -0.2, s: 0.9, o: 0.4 } },
  },
  {
    id: 'between',
    km: 30000000,
    // 225,000,000 / 384,400 ≈ 585 (our arithmetic on two checked averages)
    body: 'Mars is nearly 600 times farther away than the Moon.',
    globes: { earth: gone, moon: passed(-0.6, 0.1), mars: { x: 0.1, y: -0.05, s: 0.05, o: 0.9 } },
    narrow: { moon: passed(-0.4, -0.2), mars: { x: 0, y: -0.25, s: 0.05, o: 0.9 } },
  },
  {
    id: 'mars',
    km: 225000000,
    figure: { value: '225 million', label: 'kilometres from Earth, on average' },
    heading: 'Mars.',
    body: 'Four of the machines in this story are still here.',
    globes: { earth: gone, moon: passed(-0.6, 0.1), mars: { x: 0.28, y: 0, s: 0.95, o: 1 } },
    narrow: { moon: passed(-0.4, -0.2), mars: { x: 0, y: -0.2, s: 0.78, o: 1 } },
  },
  {
    id: 'opportunity',
    km: 225000000,
    machine: {
      name: 'Opportunity',
      slug: 'opportunity',
      photo: {
        src: P + 'selfie-dusty.webp',
        w: 2400,
        h: 2031,
        alt: "Opportunity's self-portrait in 2014, looking down on its dusty solar panels.",
        credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA17759)',
        name: 'Opportunity self-portrait, January 2014',
        focus: '50% 72%',
        narrowFocus: '0% 50%',
      },
    },
    body: 'Built for 90 days. Lasted 5,111.',
    globes: { mars: { x: 0.28, y: 0, s: 1.1, o: 0.4 } },
    narrow: { mars: { x: 0, y: -0.2, s: 0.9, o: 0.4 } },
  },
  {
    id: 'ingenuity',
    km: 225000000,
    machine: {
      name: 'Ingenuity',
      slug: 'ingenuity',
      photo: {
        src: P + 'ingenuity.webp',
        w: 1603,
        h: 1192,
        alt: 'The small Ingenuity helicopter standing on its four legs on reddish Martian ground, its shadow beside it.',
        credit: 'NASA/JPL-Caltech/ASU, photographed by Perseverance (PIA24547)',
        name: 'Ingenuity on Mars, April 2021',
        focus: '45% 50%',
      },
    },
    body: 'Allowed five flights. Flew seventy-two.',
    globes: { mars: { x: 0.28, y: 0, s: 1.1, o: 0.4 } },
  },
  {
    id: 'insight',
    km: 225000000,
    machine: {
      name: 'InSight',
      slug: 'insight',
      photo: {
        src: P + 'insight.webp',
        w: 2400,
        h: 1440,
        alt: "InSight's last selfie: the lander's deck and two round solar panels thickly covered in reddish dust.",
        credit: 'NASA/JPL-Caltech (PIA25287)',
        name: "InSight's final selfie, April 2022",
        fit: 'contain',
      },
    },
    body: 'It felt 1,319 marsquakes.',
    globes: { mars: { x: 0.28, y: 0, s: 1.1, o: 0 } },
  },
  {
    id: 'sojourner',
    km: 225000000,
    machine: {
      name: 'Sojourner',
      slug: 'sojourner',
      photo: {
        src: P + 'sojourner.webp',
        w: 1276,
        h: 1175,
        alt: 'The small six-wheeled Sojourner rover, with a flat solar panel on top, among rocks on Mars.',
        credit: 'NASA/JPL, photographed by the Pathfinder lander (PIA01122)',
        name: 'Sojourner on Mars, 1997',
      },
    },
    body: 'The first rover on Mars. Planned for a week, it lasted 83 days.',
    globes: { mars: { x: 0.28, y: 0, s: 1.1, o: 0.4 } },
  },
]
