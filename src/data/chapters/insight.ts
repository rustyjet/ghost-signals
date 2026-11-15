import type { Chapter, SceneImage } from '../types'

// Every number has a checked row in docs/FACTS.md ("InSight"), every picture a row in docs/CREDITS.md.
// The counter is the day on Mars (sol), counted from landing day, sol 0.

const P = 'photos/'

const hollowGround: SceneImage = {
  id: 'insight-ground',
  wide: { src: P + 'insight-ground-wide.webp', w: 3770, h: 432 },
  tall: { src: P + 'insight-ground-narrow.webp', w: 2062, h: 432 },
  alt: 'A flat, reddish plain scattered with small rocks.',
  credit: 'NASA/JPL-Caltech (PIA23140)',
  name: 'Homestead Hollow, where I landed, on my 14th day',
}
// The same panorama with its sky, for the landing step. The ground above stops at the horizon,
// so the 3D lander stands on the plain and not on the stitched haze.
const hollowPano: SceneImage = {
  ...hollowGround,
  id: 'insight-pano',
  wide: { src: P + 'insight-pano.webp', w: 3770, h: 606 },
  tall: undefined,
  alt: 'A flat, reddish plain scattered with small rocks under a pale butterscotch sky.',
}
const selfie: SceneImage = {
  id: 'insight-selfie',
  wide: { src: P + 'insight-selfie-wide.webp', w: 2400, h: 954 },
  tall: { src: P + 'insight-selfie-tall.webp', w: 1200, h: 1662 },
  alt: "InSight's deck seen from above, between its two round solar panels. On the deck sit a copper-coloured box and a white dome, both still clean.",
  credit: 'NASA/JPL-Caltech (PIA22876)',
  name: 'My first selfie, 6 December 2018',
}
const domeArm: SceneImage = {
  id: 'insight-dome-arm',
  wide: { src: P + 'insight-dome-arm.webp', w: 1024, h: 1024 },
  alt: 'Looking down at a white dome sitting on reddish ground. Above it hangs the claw at the end of the robot arm.',
  credit: 'NASA/JPL-Caltech (PIA23177)',
  name: 'The dome over my seismometer, day 110',
}
const domeClean: SceneImage = {
  id: 'insight-dome-clean',
  wide: { src: P + 'insight-dome-clean.webp', w: 1024, h: 1024 },
  alt: 'A clean, pale dome sitting on dark ground, with a curving horizon and grey clouds in the sky behind it.',
  credit: 'NASA/JPL-Caltech (PIA23180)',
  name: 'My seismometer under its dome, day 145',
}
const domeDusty: SceneImage = {
  id: 'insight-dome-dusty',
  wide: { src: P + 'insight-dome-dusty.webp', w: 1024, h: 1024 },
  alt: 'The same dome in the same spot, now coated in reddish dust, like the ground and the cable around it.',
  credit: 'NASA/JPL-Caltech (PIA25680)',
  name: 'One of my last pictures, day 1,436',
}
const moleOut: SceneImage = {
  id: 'insight-mole-out',
  wide: { src: P + 'insight-mole-out.webp', w: 1024, h: 1024 },
  alt: 'A silver tube, the heat probe, sticking out of the ground at a slant beside a small square scoop held by the robot arm.',
  credit: 'NASA/JPL-Caltech (PIA23213)',
  name: 'My heat probe, halfway back out of its hole, day 325',
}
const moleRest: SceneImage = {
  id: 'insight-mole-rest',
  wide: { src: P + 'insight-mole-rest.webp', w: 1012, h: 1012 },
  alt: 'The robot arm pressing its square scoop into orange soil. Under the scoop the probe is buried, with only its striped cable showing.',
  credit: 'NASA/JPL-Caltech (PIA24263)',
  name: 'Where my heat probe came to rest, day 754',
}
const dustyPanel: SceneImage = {
  id: 'insight-dusty-panel',
  wide: { src: P + 'insight-dusty-panel.webp', w: 1024, h: 1024 },
  alt: 'The robot arm hangs over one of the round solar panels. The panel is so covered in orange dust that it looks like the ground.',
  credit: 'NASA/JPL-Caltech (PIA25286)',
  name: 'My arm over a dusty solar panel, day 1,211',
}
const sunset: SceneImage = {
  id: 'insight-sunset',
  wide: { src: P + 'insight-sunset.webp', w: 1024, h: 1024 },
  alt: 'A small, pale sun going down over a flat, dark horizon. The edge of a solar panel and the folded arm are in the corner.',
  credit: 'NASA/JPL-Caltech (PIA23202)',
  name: 'Sunset from my deck, day 145',
}

export const insight: Chapter = {
  slug: 'insight',
  name: 'InSight',
  world: 'mars',
  place: 'Elysium Planitia, Mars',
  tagline: 'It stayed in one spot for four years and listened to Mars.',
  spine: { before: 'Day', after: 'on Mars', silentAfter: 'on Mars, then silence' },
  title: {
    storm: 0,
    scene: {
      kind: 'rover',
      ground: hollowGround,
      from: { orbit: '-40deg 76deg 9m', target: 'auto' },
      to: { orbit: '-20deg 80deg 7m', target: 'auto' },
    },
  },
  model: {
    src: 'models/insight.glb',
    alt: 'The InSight lander: a flat six-sided deck on three short legs, a round solar panel on each side and a robot arm folded at the front.',
    credit: 'NASA/Brian E. Kumanchik',
  },
  steps: [
    {
      spine: 0,
      figure: { value: 6.5, decimals: 1, unit: 'minutes', label: 'from 19,800 km/h to standing still' },
      heading: 'I landed on a plain.',
      body: '26 November 2018. I came down on Elysium Planitia, a flat, smooth plain near the equator of Mars.',
      storm: 0,
      scene: { kind: 'photo', image: hollowPano, from: { x: 0.1, y: 0.5, zoom: 1 }, to: { x: 0.45, y: 0.5, zoom: 1 } },
    },
    {
      spine: 10,
      figure: { value: 360, unit: 'kg', label: 'all of me' },
      heading: 'I never drove anywhere.',
      body: 'I stayed in one spot. My job was to take the pulse and the temperature of Mars, deep inside it.',
      storm: 0,
      scene: { kind: 'photo', image: selfie, from: { x: 0.5, y: 0.3, zoom: 1.05 }, to: { x: 0.5, y: 0.7, zoom: 1.2 } },
    },
    {
      spine: 110,
      figure: { value: 1.8, decimals: 1, unit: 'm', label: 'my robot arm' },
      heading: 'I put my ear down.',
      body: 'My arm set my seismometer on the ground, the first ever placed on another planet. A dome went over it, against the wind.',
      storm: 0,
      // Wide screens: the claw above the words, the top of the dome below them.
      scene: { kind: 'photo', image: domeArm, from: { x: 0.5, y: 0.38, zoom: 1 }, to: { x: 0.5, y: 0.55, zoom: 1.08 }, narrow: [{ x: 0.45, y: 0.75, zoom: 1.05 }, { x: 0.45, y: 0.9, zoom: 1.15 }] },
    },
    {
      spine: 128,
      figure: { value: 1, unit: 'marsquake', label: 'my first, 6 April 2019' },
      heading: 'Mars is very quiet.',
      body: "Earth's ground shakes all the time from oceans and weather. Mars is still, so on day 128 I felt a faint rumble: a marsquake.",
      storm: 0,
      scene: { kind: 'photo', image: domeClean, from: { x: 0.5, y: 0.3, zoom: 1.05 }, to: { x: 0.5, y: 0.35, zoom: 1.25 } },
    },
    {
      spine: 325,
      figure: { value: 5, unit: 'm', label: 'how deep my heat probe was meant to dig' },
      heading: 'My mole got stuck.',
      body: 'My heat probe was built to hammer itself into the ground. But the soil stuck together, and on day 325 it backed halfway out.',
      storm: 0,
      scene: { kind: 'photo', image: moleOut, from: { x: 0.2, y: 0.4, zoom: 1.1 }, to: { x: 0.25, y: 0.45, zoom: 1.3 }, narrow: [{ x: 0.3, y: 0.3, zoom: 1.05 }, { x: 0.3, y: 0.35, zoom: 1.2 }] },
    },
    {
      spine: 754,
      figure: { value: 500, unit: 'blows', label: 'of the hammer, on the last try' },
      heading: 'We tried for two years.',
      body: 'My arm pressed down on the probe with its scoop. On 9 January 2021, after 500 more blows and no progress, the team stopped.',
      storm: 0,
      scene: { kind: 'photo', image: moleRest, from: { x: 0.45, y: 0.3, zoom: 1.05 }, to: { x: 0.45, y: 0.4, zoom: 1.25 }, narrow: [{ x: 0.45, y: 0.25, zoom: 1.05 }, { x: 0.45, y: 0.3, zoom: 1.2 }] },
    },
    {
      spine: 884,
      figure: { value: 30, unit: 'watt-hours', label: 'more power each day, about' },
      heading: 'I threw sand on myself.',
      body: 'Dust covered my solar panels. At noon, the windiest time, my arm trickled sand into the wind. The sand swept some dust away.',
      storm: 0,
      scene: { kind: 'photo', image: dustyPanel, from: { x: 0.5, y: 0.25, zoom: 1.05 }, to: { x: 0.5, y: 0.5, zoom: 1.2 } },
    },
    {
      spine: 1000,
      figure: { value: 2, unit: 'years', label: 'to measure the core of Mars' },
      heading: 'Quakes showed me inside.',
      body: 'Quake waves showed that the centre of Mars is molten. Measuring the core of Earth took people hundreds of years.',
      storm: 0,
      scene: { kind: 'black' },
    },
    {
      spine: 1222,
      figure: { value: 5, label: 'magnitude: how strong it was' },
      heading: 'The biggest one.',
      body: '4 May 2022. The ground shook for at least six hours: the biggest quake ever detected on another planet.',
      storm: 0,
      scene: { kind: 'photo', image: sunset, from: { x: 0.6, y: 0.2, zoom: 1.05 }, to: { x: 0.6, y: 0.25, zoom: 1.35 } },
    },
    {
      spine: 1436,
      figure: { value: 285, unit: 'watt-hours', label: 'a day near the end, down from 5,000' },
      heading: 'The dust won.',
      body: 'One of my last pictures shows the dome from the same spot as in 2019. Now it is coated in dust, like me.',
      storm: 0,
      scene: { kind: 'compare', before: domeClean, after: domeDusty, from: { x: 0.5, y: 0.3, zoom: 1.05 }, to: { x: 0.5, y: 0.35, zoom: 1.15 } },
    },
    {
      spine: 1436,
      silent: true,
      figure: { value: 1319, unit: 'marsquakes', label: 'heard in all' },
      heading: 'Then I went quiet.',
      body: 'I last spoke to Earth on 15 December 2022. NASA still listens for me, just in case.',
      storm: 0,
      scene: {
        kind: 'rover',
        ground: hollowGround,
        from: { orbit: '-130deg 76deg 9m', target: 'auto' },
        to: { orbit: '-50deg 80deg 7.5m', target: 'auto' },
      },
    },
  ],
  interaction: 'seismometer',
  sources: [
    { label: 'NASA Science: InSight mission page', url: 'https://science.nasa.gov/mission/insight/' },
    { label: 'NASA Science: InSight spacecraft', url: 'https://science.nasa.gov/mission/insight/spacecraft/' },
    { label: 'NSSDCA: InSight', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A' },
    {
      label: 'NASA: NASA InSight Lander Arrives on Martian Surface to Learn What Lies Beneath',
      url: 'https://www.nasa.gov/news-release/nasa-insight-lander-arrives-on-martian-surface-to-learn-what-lies-beneath/',
    },
    { label: 'NASA: SEIS Deployed on Mars', url: 'https://www.nasa.gov/image-article/seis-deployed-mars/' },
    {
      label: "NASA Science: NASA's InSight Detects First Likely 'Quake' on Mars",
      url: 'https://science.nasa.gov/missions/insight/nasas-insight-detects-first-likely-quake-on-mars/',
    },
    { label: "NASA: NASA InSight's 'Mole' Is Out of Sight", url: 'https://www.nasa.gov/centers-and-facilities/jpl/nasa-insights-mole-is-out-of-sight/' },
    { label: "NASA: NASA InSight's 'Mole' Ends Its Journey on Mars", url: 'https://www.nasa.gov/centers-and-facilities/jpl/nasa-insights-mole-ends-its-journey-on-mars/' },
    { label: "NASA: NASA's InSight Mars Lander Gets a Power Boost", url: 'https://www.nasa.gov/centers-and-facilities/jpl/nasas-insight-mars-lander-gets-a-power-boost/' },
    { label: "NASA: NASA's InSight Reveals the Deep Interior of Mars", url: 'https://www.nasa.gov/centers-and-facilities/jpl/nasas-insight-reveals-the-deep-interior-of-mars/' },
    {
      label: "NASA: NASA's InSight Finds Three Big Marsquakes, Thanks to Solar-Panel Dusting",
      url: 'https://www.nasa.gov/missions/insight/nasas-insight-finds-three-big-marsquakes-thanks-to-solar-panel-dusting/',
    },
    { label: "NASA: NASA's InSight Records Monster Quake on Mars", url: 'https://www.nasa.gov/missions/insight/nasas-insight-records-monster-quake-on-mars/' },
    {
      label: "NASA: NASA's InSight Still Hunting Marsquakes as Power Levels Diminish",
      url: 'https://www.nasa.gov/missions/insight/nasas-insight-still-hunting-marsquakes-as-power-levels-diminish/',
    },
    { label: "NASA Science: InSight's power level as of 12 December 2022", url: 'https://science.nasa.gov/blogs/insight/2022/12/12/nasa-insights-power-level-as-of-dec-12-2022/' },
    {
      label: 'NASA: NASA Retires InSight Mars Lander Mission After Years of Science',
      url: 'https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/',
    },
    { label: 'NASA Photojournal: SEIS Deployed on Mars (PIA22956)', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA22956' },
    { label: 'NASA 3D Resources: InSight Cruise Lander', url: 'https://science.nasa.gov/3d-resources/insight-cruise-lander/' },
  ],
}
