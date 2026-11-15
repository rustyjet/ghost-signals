import type { Chapter, SceneImage } from '../types'

// Script: see the approved plan, corrected against NASA's own wording (docs/FACTS.md, "Ingenuity").
// Every number has a checked row there, every picture a row in docs/CREDITS.md.
// The counter is flights flown, out of the five planned.

const P = 'photos/'

const jezeroGround: SceneImage = {
  id: 'jezero-ground',
  wide: { src: P + 'jezero-ground-wide.webp', w: 6000, h: 966 },
  tall: { src: P + 'jezero-ground-narrow.webp', w: 2400, h: 1098 },
  alt: 'The floor of Jezero crater: flat reddish ground scattered with rocks, hills on the horizon and rover tracks on the right.',
  credit: 'NASA/JPL-Caltech/ASU/MSSS (PIA24663)',
  name: 'Jezero crater, where the rover parked for my first flights',
}
const jezeroPano: SceneImage = {
  ...jezeroGround,
  id: 'jezero-pano',
}
const belly: SceneImage = {
  id: 'ingenuity-belly',
  wide: { src: P + 'ingenuity-belly.webp', w: 2400, h: 1620 },
  alt: "Underneath the Perseverance rover, between its wheels: Ingenuity folded up and fixed to the rover's belly.",
  credit: 'NASA/JPL-Caltech/MSSS (PIA24424)',
  name: 'Folded under the rover, March 2021',
}
const rotor: SceneImage = {
  id: 'ingenuity-rotor',
  wide: { src: P + 'ingenuity-swatch.webp', w: 2400, h: 1600 },
  alt: "Close-up under Ingenuity's black carbon rotor blades, with a tiny square of old cloth taped around a cable.",
  credit: 'NASA/JPL-Caltech (PIA24291)',
  name: 'My rotor, and the cloth from the Wright Flyer',
}
const firstFlight: SceneImage = {
  id: 'ingenuity-first-flight',
  wide: { src: P + 'ingenuity-first-flight.webp', w: 1607, h: 1195 },
  alt: 'Far off on a flat, rocky plain, the small helicopter hangs in the air above its own shadow.',
  credit: 'NASA/JPL-Caltech/ASU/MSSS (PIA24550)',
  name: 'My first flight, seen by the rover, 19 April 2021',
}
const aerial: SceneImage = {
  id: 'ingenuity-aerial',
  wide: { src: P + 'ingenuity-aerial.webp', w: 2400, h: 1780 },
  alt: 'Mars seen from the air: pale ground with the rover\'s wheel tracks, and the tips of the helicopter\'s legs at the edges.',
  credit: 'NASA/JPL-Caltech (PIA24593)',
  name: 'My first colour picture from the air',
}
const bladeShadow: SceneImage = {
  id: 'ingenuity-blade-shadow',
  wide: { src: P + 'ingenuity-blade-shadow.webp', w: 2400, h: 1780 },
  alt: "Smooth reddish sand, and on it the dark shadow of a rotor blade with a broken, ragged tip.",
  credit: 'NASA/JPL-Caltech (PIA26243)',
  name: 'The shadow of my damaged blade, January 2024',
}
const finalAirfield: SceneImage = {
  id: 'ingenuity-final-airfield',
  wide: { src: P + 'ingenuity-final-airfield.webp', w: 2800, h: 1134 },
  alt: 'Rows of grey-blue sand ripples below a rocky slope. In the middle of the ripples is a tiny dark speck: the helicopter.',
  credit: 'NASA/JPL-Caltech/ASU/MSSS (PIA26236)',
  name: 'Where I came down for the last time, seen by the rover from 450 m away',
}

export const ingenuity: Chapter = {
  slug: 'ingenuity',
  name: 'Ingenuity',
  world: 'mars',
  place: 'Jezero crater, Mars',
  tagline: 'It was allowed five flights on Mars, and it made seventy-two.',
  spine: { before: 'Flight', after: 'of 5 planned', silentAfter: 'of 5 planned, then grounded' },
  title: {
    storm: 0,
    scene: {
      kind: 'rover',
      ground: jezeroGround,
      from: { orbit: '-35deg 80deg 2.6m', target: '0m 0.5m 0m' },
      to: { orbit: '-20deg 82deg 2m', target: '0m 0.42m 0m' },
    },
  },
  model: {
    src: 'models/ingenuity.glb',
    alt: 'The Ingenuity helicopter: a small box body on four thin legs, two long rotor blades stacked on top, and a solar panel above them.',
    credit: 'NASA/Brian E. Kumanchik',
  },
  steps: [
    {
      spine: 0,
      figure: { value: 1.8, decimals: 1, unit: 'kg', label: 'all of me' },
      heading: "I'm small.",
      body: 'I rode to Mars folded up under the belly of the Perseverance rover.',
      storm: 0,
      // Wide screens: the folded helicopter under the rover sits left of the words. Phones keep the original pan.
      scene: { kind: 'photo', image: belly, from: { x: 1, y: 0.32, zoom: 1.45 }, to: { x: 1, y: 0.45, zoom: 1.6 }, narrow: [{ x: 0.5, y: 0.35, zoom: 1.05 }, { x: 0.52, y: 0.55, zoom: 1.2 }] },
    },
    {
      spine: 0,
      figure: { value: 1, unit: '%', label: 'as thick as the air on Earth' },
      heading: 'Mars has almost no air.',
      body: 'Blades lift a helicopter by pushing against air. Here there is hardly any air to push against.',
      storm: 0,
      scene: { kind: 'photo', image: jezeroPano, from: { x: 0.2, y: 0.5, zoom: 1 }, to: { x: 0.45, y: 0.5, zoom: 1 } },
    },
    {
      spine: 0,
      figure: { value: 2400, unit: 'turns', label: 'a minute' },
      heading: 'So I spin very fast.',
      body: 'My blades turn about 2,400 times a minute. That is many times faster than a passenger helicopter on Earth.',
      storm: 0,
      scene: { kind: 'photo', image: rotor, from: { x: 0.85, y: 0.1, zoom: 1.1 }, to: { x: 0.6, y: 0.25, zoom: 1.2 } },
      // docs/FACTS.md, Story sounds: Ingenuity 3
      sound: {
        src: 'audio/ingenuity-flight4.mp3',
        label: 'Hear my blades on Mars',
        caption: 'My fourth flight, heard by Perseverance 80 metres away. NASA made the hum louder; we raised it two octaves so speakers can play it.',
        credit: 'NASA/JPL-Caltech/ASU/MSSS/LANL/CNES/CNRS/ISAE-Supaéro',
        name: 'My blades on my fourth flight, heard by Perseverance',
        url: 'https://science.nasa.gov/resource/listen-to-nasas-ingenuity-mars-helicopter-in-flight/',
      },
    },
    {
      spine: 1,
      figure: { value: 39.1, decimals: 1, unit: 'seconds', label: 'in the air' },
      heading: 'First flight.',
      body: '19 April 2021. I rose 3 metres, hovered and landed. Nothing had made a powered flight on another planet before.',
      storm: 0,
      scene: {
        kind: 'photo',
        image: firstFlight,
        // Wide screens: the helicopter hovers in the left third as the camera moves in.
        from: { x: 1, y: 0.5, zoom: 1.4 },
        to: { x: 0.8, y: 0.5, zoom: 1.75 },
        // Phones: lift the helicopter into the top half, clear of the words
        narrow: [{ x: 0.5, y: 0.62, zoom: 1.5 }, { x: 0.5, y: 0.7, zoom: 2 }],
      },
    },
    {
      spine: 1,
      figure: { value: 1903, plain: true, label: 'the year this cloth first flew' },
      heading: 'I carry the first plane.',
      body: "Taped under my solar panel is a scrap of cloth the size of a stamp, from the wing of the Wright brothers' plane.",
      storm: 0,
      // Wide screens: a slow push in on the cloth (wrapped round the cable), right of the words.
      scene: { kind: 'photo', image: rotor, from: { x: 0, y: 0.5, zoom: 1.65 }, to: { x: 0, y: 0.56, zoom: 1.8 }, narrow: [{ x: 0.6, y: 0.25, zoom: 1.2 }, { x: 0.12, y: 0.85, zoom: 1.6 }] },
    },
    {
      spine: 5,
      figure: { value: 5, unit: 'flights', label: 'in the plan' },
      heading: 'Five flights was the plan.',
      body: 'After five, the team kept me flying. I became a scout, looking at the ground ahead for the rover.',
      storm: 0,
      scene: { kind: 'photo', image: aerial, from: { x: 0.5, y: 0.4, zoom: 1.1 }, to: { x: 0.5, y: 0.6, zoom: 1.25 } },
    },
    {
      spine: 29,
      figure: { value: -90, unit: '°C', label: 'on a winter night' },
      heading: 'Nights were the hard part.',
      body: 'In winter my battery could not keep my heaters on all night. I waited out 101 days of winter, then flew again.',
      storm: 0,
      scene: { kind: 'black' },
    },
    {
      spine: 72,
      figure: { value: 72, unit: 'flights', label: 'by 18 January 2024' },
      heading: 'Flight 72.',
      body: 'The sand below was too smooth for my camera to follow. I came down hard, and my blades were damaged.',
      storm: 0,
      // Wide screens: the broken blade's shadow falls right of the words.
      scene: { kind: 'photo', image: bladeShadow, from: { x: 0, y: 0.6, zoom: 1.05 }, to: { x: 0.05, y: 0.75, zoom: 1.2 }, narrow: [{ x: 0.6, y: 0.6, zoom: 1.05 }, { x: 0.55, y: 0.75, zoom: 1.2 }] },
    },
    {
      spine: 72,
      silent: true,
      figure: { value: 17, unit: 'km', label: 'flown in all, in just over two hours' },
      heading: 'That was all of it.',
      body: 'I made seventy-two flights and flew more than 14 times farther than planned. Then the team said goodbye.',
      storm: 0,
      scene: { kind: 'photo', image: finalAirfield, from: { x: 0.5, y: 0.5, zoom: 1 }, to: { x: 0.52, y: 0.62, zoom: 1.5 } },
    },
    {
      spine: 72,
      silent: true,
      figure: { value: 20, unit: 'years', label: 'of days my memory can hold' },
      heading: 'They left me one job.',
      body: 'Wake up each day, take one photo and record how cold I am. My memory can hold about 20 years of that.',
      storm: 0,
      scene: {
        kind: 'rover',
        ground: jezeroGround,
        from: { orbit: '-120deg 78deg 2.6m', target: '0m 0.5m 0m' },
        to: { orbit: '-40deg 80deg 2.1m', target: '0m 0.45m 0m' },
      },
    },
  ],
  interaction: 'rotor-lift',
  sources: [
    {
      label: 'NASA Science: Ingenuity Mars Helicopter mission page',
      url: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
    },
    { label: "NASA: 6 Things to Know About NASA's Ingenuity Mars Helicopter", url: 'https://www.nasa.gov/solar-system/6-things-to-know-about-nasas-ingenuity-mars-helicopter/' },
    { label: 'JPL: Ingenuity landing press kit, quick facts', url: 'https://www.jpl.nasa.gov/news/press_kits/ingenuity/landing/quick_facts/' },
    {
      label: "NASA: NASA's Ingenuity Mars Helicopter Succeeds in Historic First Flight",
      url: 'https://www.nasa.gov/news-release/nasas-ingenuity-mars-helicopter-succeeds-in-historic-first-flight/',
    },
    { label: 'NASA: 120 Years Ago, the First Powered Flight at Kitty Hawk', url: 'https://www.nasa.gov/history/120-years-ago-the-first-powered-flight-at-kitty-hawk/' },
    {
      label: "JPL: NASA's Ingenuity Helicopter to Begin New Demonstration Phase",
      url: 'https://www.jpl.nasa.gov/news/nasas-ingenuity-helicopter-to-begin-new-demonstration-phase/',
    },
    { label: 'NASA Science: Ingenuity Team Spun Up for Upcoming Flight 30', url: 'https://science.nasa.gov/blog/ingenuity-team-spun-up-for-upcoming-flight-30/' },
    {
      label: "JPL: After Three Years on Mars, NASA's Ingenuity Helicopter Mission Ends",
      url: 'https://www.jpl.nasa.gov/news/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/',
    },
    {
      label: 'JPL: NASA Performs First Aircraft Accident Investigation on Another World',
      url: 'https://www.jpl.nasa.gov/news/nasa-performs-first-aircraft-accident-investigation-on-another-world/',
    },
    {
      label: "JPL: NASA's Ingenuity Mars Helicopter Team Says Goodbye … for Now",
      url: 'https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-team-says-goodbye-for-now/',
    },
    { label: 'NASA 3D Resources: Ingenuity Mars Helicopter', url: 'https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/' },
    { label: "NASA Science: Listen to NASA's Ingenuity Mars Helicopter in Flight (the sound of my blades)", url: 'https://science.nasa.gov/resource/listen-to-nasas-ingenuity-mars-helicopter-in-flight/' },
  ],
}
