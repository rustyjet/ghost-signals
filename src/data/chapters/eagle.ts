import type { Chapter, SceneImage } from '../types'

// Script: see the approved plan, corrected against NASA's own wording (docs/FACTS.md, "Eagle").
// Every number has a checked row there, every picture a row in docs/CREDITS.md.
// The counter is days on the Moon: day 1 is 20 July 1969 (UTC), the day Eagle landed.

const P = 'photos/'

/** Days on the Moon today, counting 20 July 1969 as day 1 (UTC), so the last steps stay true. */
const today = Math.floor((Date.now() - Date.UTC(1969, 6, 20)) / 86_400_000) + 1

const tranquilityGround: SceneImage = {
  id: 'tranquility-ground',
  wide: { src: P + 'tranquility-ground-wide.webp', w: 5200, h: 1082 },
  tall: { src: P + 'tranquility-ground-narrow.webp', w: 2400, h: 1108 },
  alt: 'Tranquility Base: flat grey ground pitted with small craters under a black sky.',
  credit: 'NASA/JSC, Apollo 11 crew panorama (jsc2007e045375)',
  name: 'Tranquility Base, where I landed',
}
const orbit: SceneImage = {
  id: 'eagle-orbit',
  wide: { src: P + 'eagle-orbit.webp', w: 2400, h: 2400 },
  alt: 'Eagle flying alone above the Moon, legs out and gold foil shining, photographed from the command module Columbia.',
  credit: 'NASA/JSC (AS11-44-6581)',
  name: 'Me above the Moon, seen from Columbia',
}
const lmWindow: SceneImage = {
  id: 'eagle-window',
  wide: { src: P + 'eagle-window.webp', w: 2400, h: 2400 },
  alt: 'The view out of Eagle\'s window after landing: flat grey ground to the horizon under a black sky.',
  credit: 'NASA/JSC (AS11-37-5458)',
  name: 'The view from my window after landing',
}
const bootprint: SceneImage = {
  id: 'eagle-bootprint',
  wide: { src: P + 'eagle-bootprint.webp', w: 2400, h: 2410 },
  alt: 'A sharp bootprint pressed into grey lunar dust.',
  credit: 'NASA/JSC (AS11-40-5878)',
  name: 'A bootprint at Tranquility Base',
}
const easep: SceneImage = {
  id: 'eagle-easep',
  wide: { src: P + 'eagle-easep.webp', w: 2400, h: 2400 },
  alt: 'Buzz Aldrin on the grey ground beside the moonquake sensor with its two solar panels; the mirror tray, the flag and Eagle stand behind.',
  credit: 'NASA/JSC (AS11-40-5948)',
  name: 'Buzz with the moonquake sensor and the mirrors',
}
const ascent: SceneImage = {
  id: 'eagle-ascent',
  wide: { src: P + 'eagle-ascent.webp', w: 3000, h: 2896 },
  alt: "Eagle's top half rising to meet Columbia above the grey Moon, with half of the Earth in the black sky behind.",
  credit: 'NASA/JSC (AS11-44-6642)',
  name: 'My top half going home, Earth behind',
}
const laser: SceneImage = {
  id: 'eagle-laser',
  wide: { src: P + 'eagle-laser.webp', w: 3000, h: 1996 },
  alt: "Green laser beams shooting from NASA Goddard's laser ranging station toward the bright Moon at night. (These were aimed at a spacecraft orbiting the Moon.)",
  credit: 'NASA/GSFC/Debbie Mccallum (GSFC_20171208_Archive_e001974)',
  name: 'Lasers fired at the Moon from NASA Goddard, 2010',
}
const moon: SceneImage = {
  id: 'moon-globe',
  wide: { src: P + 'moon.webp', w: 1440, h: 1440 },
  alt: 'The whole Moon, grey with dark patches, on black.',
  credit: 'NASA, photographed by the Apollo 11 crew on the way home (AS11-44-6667)',
  name: 'The Moon, from Apollo 11 on the way home',
}
const plaque: SceneImage = {
  id: 'eagle-plaque',
  wide: { src: P + 'eagle-plaque.webp', w: 2400, h: 2338 },
  alt: "The steel plaque on Eagle's ladder leg, with the two halves of the Earth drawn on it above the words and the astronauts' signatures.",
  credit: 'NASA/JSC (AS11-40-5899)',
  name: 'The plaque on my ladder leg',
}

export const eagle: Chapter = {
  slug: 'eagle',
  name: 'Eagle',
  world: 'moon',
  place: 'Sea of Tranquility, the Moon',
  tagline: 'The half that stayed on the Moon.',
  spine: { before: 'Day', after: 'on the Moon', silentAfter: 'on the Moon, quiet' },
  title: {
    storm: 0,
    scene: {
      kind: 'rover',
      ground: tranquilityGround,
      from: { orbit: '-35deg 80deg 22m', target: 'auto' },
      to: { orbit: '-20deg 82deg 15m', target: 'auto' },
    },
  },
  model: {
    src: 'models/apollo-lm.glb',
    alt: 'The Apollo lunar module: a gold-wrapped base on four spindly legs, with the angular crew cabin on top.',
    credit: 'NASA/Michael D. Carbajal',
  },
  steps: [
    {
      spine: 1,
      figure: { value: 1202, plain: true, label: 'the alarm on my computer' },
      heading: 'Alarm 1202.',
      body: 'On the way down, my computer warned it had too many jobs at once. Mission Control said keep going, and Neil and Buzz did.',
      storm: 0,
      // Phones: the lander is half the photo's width, so the camera stays wide and centred on it.
      scene: { kind: 'photo', image: orbit, from: { x: 0.6, y: 0.3, zoom: 1.05 }, to: { x: 0.6, y: 0.42, zoom: 1.25 }, narrow: [{ x: 0.7, y: 0.4, zoom: 1 }, { x: 0.7, y: 0.5, zoom: 1.06 }] },
    },
    {
      spine: 1,
      figure: { value: 45, unit: 'seconds', label: 'of fuel left, about' },
      heading: '"The Eagle has landed."',
      body: '20 July 1969. I touched down in the Sea of Tranquility. No Apollo landing ever had less fuel to spare.',
      storm: 0,
      scene: { kind: 'photo', image: lmWindow, from: { x: 0.5, y: 0.35, zoom: 1.05 }, to: { x: 0.5, y: 0.6, zoom: 1.15 } },
      // docs/FACTS.md, Story sounds: Eagle 2
      sound: {
        src: 'audio/apollo11-landing.mp3',
        label: 'Hear the real radio call',
        caption: 'Neil Armstrong on the radio to Houston, 20 July 1969.',
        credit: 'NASA',
        name: "Neil Armstrong's radio call, 20 July 1969",
        url: 'https://nssdc.gsfc.nasa.gov/planetary/sound/index.html',
      },
    },
    {
      spine: 2,
      figure: { value: 151, unit: 'minutes', label: 'walking on the Moon' },
      heading: 'They walked on the Moon.',
      body: 'Neil and Buzz climbed down my ladder and walked for 2 hours 31 minutes. Their footprint trails can still be seen from orbit.',
      storm: 0,
      // Wide screens: the bootprint sits right of the words.
      scene: { kind: 'photo', image: bootprint, from: { x: 0, y: 0.8, zoom: 1.3 }, to: { x: 0.2, y: 0.88, zoom: 1.5 }, narrow: [{ x: 0.7, y: 0.45, zoom: 1.05 }, { x: 0.75, y: 0.7, zoom: 1.3 }] },
    },
    {
      spine: 2,
      figure: { value: 100, unit: 'mirrors', label: 'in one small tray' },
      heading: 'Buzz set down mirrors.',
      body: 'Each of the hundred glass corners sends light straight back where it came from. They need no power at all.',
      storm: 0,
      scene: { kind: 'photo', image: easep, from: { x: 0.5, y: 0.4, zoom: 1.05 }, to: { x: 0.55, y: 0.5, zoom: 1.15 } },
    },
    {
      spine: 2,
      figure: { value: 21, unit: 'hours', label: 'and 36 minutes on the Moon in one piece' },
      heading: 'They took my top half.',
      body: 'My top half was their ride home. I was the launch pad, and I stayed. Buzz remembered seeing the flag fall over in the blast.',
      storm: 0,
      // Wide screens: the ascent stage rises in the left third.
      scene: { kind: 'photo', image: ascent, from: { x: 0.95, y: 0.6, zoom: 1.25 }, to: { x: 1, y: 0.7, zoom: 1.35 }, narrow: [{ x: 0.5, y: 0.42, zoom: 1.04 }, { x: 0.5, y: 0.55, zoom: 1.08 }] },
    },
    {
      spine: 39,
      silent: true,
      heading: 'My moonquake sensor went quiet.',
      body: 'Buzz also left a sensor that felt the ground shake, powered by sunlight. On 27 August 1969 it stopped answering.',
      storm: 0,
      scene: {
        kind: 'photo',
        image: easep,
        // Wide screens: the sensor stays in the left third as the camera moves in.
        from: { x: 1, y: 0.62, zoom: 1.3 },
        to: { x: 0.75, y: 0.68, zoom: 1.6 },
        // Phones: the sensor with both its solar panels (the words say sunlight powered it) fits only this wide.
        narrow: [{ x: 0.3, y: 0.5, zoom: 1 }, { x: 0.31, y: 0.75, zoom: 1.1 }],
      },
    },
    {
      spine: today,
      silent: true,
      figure: { value: 2.5, decimals: 1, unit: 'seconds', label: 'for laser light to reach my mirrors and come back' },
      heading: 'The mirrors kept working.',
      body: 'Scientists on Earth still fire lasers at mirrors like mine. The light bounces straight back.',
      storm: 0,
      scene: { kind: 'photo', image: laser, from: { x: 0.6, y: 0.3, zoom: 1.05 }, to: { x: 0.7, y: 0.4, zoom: 1.15 } },
    },
    {
      spine: today,
      silent: true,
      figure: { value: 3.8, decimals: 1, unit: 'cm', label: 'farther from Earth every year' },
      heading: 'The Moon is leaving.',
      body: 'Those lasers showed the Moon drifting away from Earth, very slowly: about as fast as your fingernails grow.',
      storm: 0,
      scene: { kind: 'photo', image: moon, from: { x: 0.5, y: 0.5, zoom: 1.45 }, to: { x: 0.5, y: 0.5, zoom: 1 } },
    },
    {
      spine: today,
      silent: true,
      heading: 'The words on my leg.',
      body: '"Here men from the planet Earth first set foot upon the Moon, July 1969 A.D. We came in peace for all mankind."',
      storm: 0,
      // Wide screens: the plaque sits left of the words, so both can be read.
      scene: { kind: 'photo', image: plaque, from: { x: 1, y: 0.45, zoom: 1.45 }, to: { x: 0.92, y: 0.5, zoom: 1.6 }, narrow: [{ x: 0.45, y: 0.4, zoom: 1.25 }, { x: 0.45, y: 0.5, zoom: 1.6 }] },
    },
    {
      spine: today,
      silent: true,
      figure: { value: 0, unit: 'watts', label: 'the power my mirrors need' },
      heading: "I'm still on the Moon.",
      body: 'Neil and Buzz went home. I stayed, with the footprints and the mirrors, and lasers from Earth still find them.',
      storm: 0,
      scene: {
        kind: 'rover',
        ground: tranquilityGround,
        from: { orbit: '-120deg 78deg 20m', target: 'auto' },
        to: { orbit: '-40deg 80deg 15m', target: 'auto' },
        hideAbove: 0,
      },
    },
  ],
  // docs/FACTS.md, "Learning lines": Eagle
  learn: 'How a laser and the mirrors left on the Moon measure how far away it is.',
  interaction: 'laser-ranging',
  game: {
    name: 'Find the mirrors',
    photo: {
      src: 'photos/moon-near.webp',
      alt: 'The near side of the Moon, with the Apollo landing sites numbered.',
      credit: "NASA's Scientific Visualization Studio, from LRO (SVS 4731)",
      whole: true,
    },
    fact: 'Laser light takes about 2.5 seconds to reach the mirrors and come back.',
    source: { label: 'NASA: Laser Beams Reflected Between Earth and Moon Boost Science', url: 'https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science/' },
  },
  closing: {
    heading: 'Still answering.',
    body: 'My mirrors need no power. Scientists still fire lasers at them, and the time the light takes tells them how far away the Moon is.',
  },
  sources: [
    { label: 'NSSDCA: Apollo 11 Lunar Module / EASEP', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C' },
    { label: 'NSSDCA: Apollo 11 landing site information', url: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo11info.html' },
    { label: 'NASA History: Apollo 11 Mission Overview', url: 'https://www.nasa.gov/history/apollo-11-mission-overview/' },
    { label: 'NASA History (SP-350): Apollo Expeditions to the Moon, chapter 11.4', url: 'https://www.nasa.gov/wp-content/uploads/static/history/SP-350/ch-11-4.html' },
    { label: 'Apollo Lunar Surface Journal (NASA copy): Apollo 11 landing', url: 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.landing.html' },
    { label: 'Apollo Lunar Surface Journal (NASA copy): Apollo 11 summary', url: 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11.summary.html' },
    { label: 'Apollo Lunar Surface Journal (NASA copy): the condition of the Apollo flags', url: 'https://www.nasa.gov/wp-content/uploads/static/history/alsj/ApolloFlags-Condition.html' },
    { label: 'NASA: The Apollo Experiment That Keeps On Giving', url: 'https://www.nasa.gov/solar-system/the-apollo-experiment-that-keeps-on-giving/' },
    { label: 'NASA: Laser Beams Reflected Between Earth and Moon Boost Science', url: 'https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science/' },
    { label: 'NASA Science: Apollo 11 landing site from LRO', url: 'https://science.nasa.gov/resource/apollo-11-landing-site/' },
    { label: 'NASA History: 50 Years Ago, One Small Step, One Giant Leap', url: 'https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/' },
    { label: 'NASA 3D Resources: Apollo Lunar Module', url: 'https://science.nasa.gov/3d-resources/apollo-lunar-module/' },
    { label: "NASA's Scientific Visualization Studio: Apollo Landing Sites with Moon Phases", url: 'https://svs.gsfc.nasa.gov/4731' },
    { label: 'NSSDCA: Sounds of the Space Age (the landing call)', url: 'https://nssdc.gsfc.nasa.gov/planetary/sound/index.html' },
  ],
}
