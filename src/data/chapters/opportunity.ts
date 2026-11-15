import type { Chapter, SceneImage } from '../types'

// Script: see the approved plan. Every number here has a checked row in docs/FACTS.md, and every
// picture a row in docs/CREDITS.md. The voice is the rover's own, first person.

const P = 'photos/'

const eagleGround: SceneImage = {
  id: 'eagle-ground',
  wide: { src: P + 'eagle-crater-wide.webp', w: 6080, h: 820 },
  tall: { src: P + 'eagle-crater-narrow.webp', w: 3114, h: 420 },
  alt: 'Eagle crater, where Opportunity landed: a shallow bowl of dark sand with the empty lander in the middle.',
  credit: 'NASA/JPL/Cornell (PIA05755)',
  name: 'Eagle crater, where I landed',
}
const eagle: SceneImage = {
  id: 'eagle-crater',
  wide: { src: P + 'eagle-crater-photo.webp', w: 5790, h: 1100 },
  alt: "Opportunity's own panorama of Eagle crater: dark rippled sand, the empty airbag lander in the middle, and wheel tracks leading up and out of the crater.",
  credit: 'NASA/JPL/Cornell (PIA05755)',
  name: 'Eagle crater, where I landed',
}
const berries: SceneImage = {
  id: 'berry-bowl',
  wide: { src: P + 'berry-bowl.webp', w: 768, h: 466 },
  alt: 'Close-up of a pale rock covered in tiny grey balls, the "blueberries", with a round spot where the rover brushed the rock clean.',
  credit: 'NASA/JPL/Cornell (PIA05634)',
  name: 'The Berry Bowl',
}
const endurance: SceneImage = {
  id: 'endurance',
  wide: { src: P + 'endurance-horizon.webp', w: 2350, h: 947 },
  alt: 'Black-and-white view across flat rippled plains to the rocky rim of Endurance crater on the horizon.',
  credit: 'NASA/JPL/Cornell (PIA05847)',
  name: 'Endurance crater on the horizon, day 93',
}
const purgatory: SceneImage = {
  id: 'purgatory',
  wide: { src: P + 'purgatory-wide.webp', w: 2686, h: 1300 },
  tall: { src: P + 'purgatory-tall.webp', w: 1670, h: 1600 },
  alt: 'Endless sand ripples under a butterscotch sky, with two deep, churned wheel ruts leading back to the rover.',
  credit: 'NASA/JPL/Cornell (PIA07216)',
  name: "Purgatory Dune, from the 'Rub al Khali' panorama",
}
const sky2007: SceneImage = {
  id: 'sky-2007',
  wide: { src: P + 'sky-2007.webp', w: 800, h: 430 },
  alt: 'Five views of the same horizon from 14 June to 15 July 2007. The sky turns from pale to dark brown as the dust storm thickens.',
  credit: 'NASA/JPL-Caltech/Cornell',
  name: 'The sky darkening, sols 1,205 to 1,235',
}
const dusty: SceneImage = {
  id: 'selfie-dusty',
  wide: { src: P + 'selfie-dusty.webp', w: 2400, h: 2031 },
  alt: "Opportunity's self-portrait in January 2014, looking down on its solar panels coated in reddish dust.",
  credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA17759)',
  name: 'Dusty self-portrait, January 2014',
}
const clean: SceneImage = {
  id: 'selfie-clean',
  wide: { src: P + 'selfie-clean.webp', w: 2400, h: 2031 },
  alt: "Opportunity's self-portrait in March 2014, after the wind: the solar panels are dark and clean again.",
  credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA18079)',
  name: 'Clean self-portrait, March 2014',
}
const marathon: SceneImage = {
  id: 'marathon-map',
  wide: { src: P + 'marathon-map.webp', w: 2600, h: 1964 },
  alt: 'Map from orbit with a yellow line showing my route from Eagle crater, past Victoria crater, to the rim of the huge Endeavour crater.',
  credit: 'NASA/JPL-Caltech/MSSS/NMMNHS (PIA19154)',
  name: 'Map of my marathon route',
}
const sprained: SceneImage = {
  id: 'sprained-ankle',
  wide: { src: P + 'sprained-ankle.webp', w: 7000, h: 722 },
  alt: 'Wide view of the rim of Endeavour crater above Perseverance Valley: two low hills and an orange plain.',
  credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA21723)',
  name: "The 'Sprained Ankle' panorama, June 2017",
}
const lastPicture: SceneImage = {
  id: 'last-picture',
  wide: { src: P + 'last-picture.webp', w: 1024, h: 1024 },
  alt: 'My last picture: grey speckled noise where the Sun should be, and a black band where the rest of the image never arrived.',
  credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA22929)',
  name: 'My last picture',
}
const valleyGround: SceneImage = {
  id: 'valley-ground',
  wide: { src: P + 'perseverance-valley-wide.webp', w: 4838, h: 760 },
  tall: { src: P + 'perseverance-valley-narrow.webp', w: 2546, h: 400 },
  alt: 'Perseverance Valley: pale rock slabs and dark sand running down a shallow valley.',
  credit: 'NASA/JPL-Caltech/Cornell/ASU (PIA22909)',
  name: 'Perseverance Valley, my last panorama',
}

export const opportunity: Chapter = {
  slug: 'opportunity',
  name: 'Opportunity',
  world: 'mars',
  place: 'Meridiani Planum, Mars',
  tagline: 'Sent to Mars in 2003 to find out if it was ever wet.',
  spine: { before: 'Day', after: 'on Mars', silentAfter: 'on Mars, then silence' },
  title: {
    storm: 0,
    scene: {
      kind: 'rover',
      ground: eagleGround,
      from: { orbit: '-35deg 78deg 7m', target: 'auto' },
      to: { orbit: '-20deg 82deg 4.2m', target: 'auto' },
    },
  },
  model: {
    src: 'models/opportunity.glb',
    alt: 'The Opportunity rover: six wheels, flat solar panels like wings, and a tall camera mast.',
    credit: 'NASA/JPL-Caltech',
  },
  steps: [
    {
      spine: 1,
      figure: { value: 22, unit: 'm', label: 'across: the crater I rolled into' },
      heading: 'I landed in a hole.',
      body: 'Wrapped in airbags, I bounced across Mars and rolled into a crater 22 metres wide. My team called it a hole in one.',
      storm: 0,
      // Wide screens: the lander stands right of the words here and left of them on the next step, so the
      // pan carries it across between the two. Phones keep the original pan.
      scene: { kind: 'photo', image: eagle, from: { x: 0.25, y: 0.5, zoom: 1.2 }, to: { x: 0.5, y: 0.5, zoom: 1.2 }, narrow: [{ x: 0.28, y: 0.5, zoom: 1.05 }, { x: 0.49, y: 0.5, zoom: 1.05 }] },
    },
    {
      spine: 1,
      figure: { value: 90, unit: 'days', label: 'the whole plan' },
      heading: 'The plan was short.',
      body: 'Ninety days on Mars. About one kilometre of driving. Then my job would be done.',
      storm: 0,
      scene: { kind: 'photo', image: eagle, from: { x: 0.5, y: 0.5, zoom: 1.2 }, to: { x: 0.75, y: 0.5, zoom: 1.2 }, narrow: [{ x: 0.47, y: 0.5, zoom: 1.05 }, { x: 0.72, y: 0.5, zoom: 1.05 }] },
    },
    {
      spine: 48,
      figure: { value: 4, unit: 'mm', label: 'across, each grey berry' },
      heading: 'The ground had berries.',
      body: 'Tiny grey balls lay everywhere. They are hematite, a mineral that forms in water. Mars was once wet.',
      storm: 0,
      scene: {
        kind: 'photo',
        image: berries,
        // The brushed circle sits left of the words on wide screens, and in the middle on phones.
        from: { x: 1, y: 0.45, zoom: 1.35 },
        to: { x: 1, y: 0.65, zoom: 1.45 },
        narrow: [{ x: 0.38, y: 0.5, zoom: 1 }, { x: 0.42, y: 0.5, zoom: 1.2 }],
      },
    },
    {
      spine: 91,
      figure: { value: 91, unit: 'days', label: 'one more than planned' },
      heading: 'Day 91.',
      body: 'My ninety days were up. I was still working, so my team kept me driving.',
      storm: 0,
      scene: { kind: 'photo', image: endurance, from: { x: 0.25, y: 0, zoom: 1.05 }, to: { x: 0.7, y: 0, zoom: 1.12 } },
    },
    {
      spine: 446,
      figure: { value: 30, unit: 'cm', label: 'tall: the sand ripple that trapped me' },
      heading: 'Stuck in the sand.',
      body: 'My wheels sank into a ripple about 30 centimetres tall. Getting out took more than five weeks of careful driving.',
      storm: 0.05,
      // Wide screens: the ripple and my tracks stay right of the words.
      scene: { kind: 'photo', image: purgatory, from: { x: 0.06, y: 0, zoom: 1.06 }, to: { x: 0.1, y: 1, zoom: 1.2 }, narrow: [{ x: 0.5, y: 0, zoom: 1.06 }, { x: 0.5, y: 1, zoom: 1.2 }] },
    },
    {
      spine: 1235,
      figure: { value: 99, unit: '%', label: 'of direct sunlight blocked by dust' },
      heading: '2007. The sky went dark.',
      body: 'A dust storm hid the Sun. My power fell to 128 watt‑hours a day, so I moved as little as I could and waited.',
      storm: 0.8,
      scene: { kind: 'photo', image: sky2007, from: { x: 0, y: 0.4, zoom: 1.15 }, to: { x: 1, y: 0.4, zoom: 1.4 } },
    },
    {
      spine: 3611,
      figure: { value: 620, unit: 'watt‑hours', label: 'a day by April 2014, panels clean again' },
      heading: 'The wind cleaned me.',
      body: 'Dust kept settling on my solar panels. In March 2014 the wind blew most of it off, and my power went up.',
      storm: 0,
      scene: { kind: 'compare', before: dusty, after: clean, from: { x: 0.5, y: 0.2, zoom: 1.22 }, to: { x: 0.5, y: 0.5, zoom: 1.3 }, narrow: [{ x: 0.5, y: 0.6, zoom: 1.28 }, { x: 0.5, y: 0.6, zoom: 1.36 }] },
    },
    {
      spine: 3968,
      figure: { value: 42.195, decimals: 3, unit: 'km', label: 'a marathon, finished 24 March 2015' },
      heading: 'I finished a marathon.',
      body: 'It took me 11 years and two months. The finish line was the rim of Endeavour, a crater 22 kilometres wide.',
      storm: 0,
      // Wide screens: the camera follows the route down the map, keeping it in the left third.
      scene: { kind: 'photo', image: marathon, from: { x: 0.2, y: 0, zoom: 2 }, to: { x: 0.62, y: 0.74, zoom: 2 }, narrow: [{ x: 0.04, y: 0, zoom: 2 }, { x: 0.3, y: 0.78, zoom: 2 }] },
    },
    {
      spine: 5000,
      figure: { value: 14, unit: 'years', label: 'on Mars by Day 5,000' },
      heading: 'I was getting old.',
      body: 'For now, I do not steer with my front wheels. My memory kept forgetting things. I kept going.',
      storm: 0.1,
      scene: { kind: 'photo', image: sprained, from: { x: 0.15, y: 0.5, zoom: 1.05 }, to: { x: 0.7, y: 0.5, zoom: 1.05 } },
    },
    {
      spine: 5111,
      figure: { value: 5111, label: 'days on Mars' },
      heading: 'June 2018. No light.',
      body: 'A storm covered the whole planet. I took one last picture of the Sun. It came out dark, and it never finished sending.',
      storm: 1,
      scene: { kind: 'photo', image: lastPicture, from: { x: 0.5, y: 0, zoom: 1.1 }, to: { x: 0.5, y: 1, zoom: 1.3 } },
    },
    {
      spine: 5111,
      silent: true,
      figure: { value: 1000, unit: '+', label: 'commands sent. No reply.' },
      heading: 'They kept calling.',
      body: 'For eight months my team tried to wake me. They sent their last commands on 12 February 2019.',
      storm: 0.4,
      scene: { kind: 'black' },
    },
    {
      spine: 5111,
      silent: true,
      figure: { value: 45.16, decimals: 2, unit: 'km', label: 'driven in all' },
      heading: "I'm still here.",
      body: 'Parked on the western edge of Perseverance Valley. Built for 90 days. I worked for 5,111.',
      storm: 0.15,
      scene: {
        kind: 'rover',
        ground: valleyGround,
        from: { orbit: '-120deg 76deg 8.5m', target: 'auto' },
        to: { orbit: '-40deg 78deg 7m', target: 'auto' },
      },
    },
  ],
  interaction: 'dust-storm',
  closing: {
    heading: 'What I found.',
    body: 'Rocks that formed in water. Long ago Mars was wet, and it may once have been a place where tiny living things could survive.',
  },
  sources: [
    { label: 'NASA Science: Opportunity mission page', url: 'https://science.nasa.gov/mission/mer-opportunity/' },
    {
      label: "JPL: New Look at 2004's Martian Hole-in-One Site",
      url: 'https://www.jpl.nasa.gov/news/new-look-at-2004s-martian-hole-in-one-site/',
    },
    {
      label: "NASA Science: NASA's Opportunity Rover Mission on Mars Comes to End",
      url: 'https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/',
    },
    { label: 'NASA Photojournal: Opportunity Captures "Lion King" Panorama', url: 'https://science.nasa.gov/photojournal/opportunity-captures-lion-king-panorama' },
    { label: 'NASA Photojournal: Discovery Served Up in a Bowl', url: 'https://science.nasa.gov/photojournal/discovery-served-up-in-a-bowl' },
    {
      label: 'NASA APOD: A Berry Bowl of Martian Spherules',
      url: 'https://science.nasa.gov/image-article/apod-2025-june-22-a-berry-bowl-of-martian-spherules/',
    },
    { label: "NASA Photojournal: 'Endurance' Looms on the Horizon", url: 'https://photojournal.jpl.nasa.gov/catalog/PIA05847' },
    { label: "NASA Photojournal: Looking Back at 'Purgatory Dune'", url: 'https://science.nasa.gov/photojournal/looking-back-at-purgatory-dune' },
    { label: "NASA Photojournal: Opportunity's 'Rub al Khali' Panorama", url: 'https://science.nasa.gov/photojournal/opportunitys-rub-al-khali-panorama/' },
    { label: 'NASA Science: A Darkened Mars Sky (2007)', url: 'https://science.nasa.gov/resource/a-darkened-mars-sky/' },
    {
      label: 'JPL: NASA Mars Rovers Braving Severe Dust Storms (2007)',
      url: 'https://www.jpl.nasa.gov/news/nasa-mars-rovers-braving-severe-dust-storms',
    },
    {
      label: 'NASA Photojournal: Self-Portrait by Opportunity Mars Rover in January 2014',
      url: 'https://science.nasa.gov/photojournal/self-portrait-by-opportunity-mars-rover-in-january-2014',
    },
    {
      label: 'NASA Photojournal: Self-Portrait by Freshly Cleaned Opportunity, March 2014',
      url: 'https://science.nasa.gov/photojournal/self-portrait-by-freshly-cleaned-opportunity-mars-rover-in-march-2014',
    },
    {
      label: "NASA Science: Opportunity Rover's Full Marathon-Length Traverse",
      url: 'https://science.nasa.gov/resource/opportunity-rovers-full-marathon-length-traverse',
    },
    { label: 'JPL: Opportunity Working in "No-Flash" Mode for Now (2014)', url: 'https://www.jpl.nasa.gov/news/opportunity-working-in-no-flash-mode-for-now/' },
    { label: 'JPL: Mars Rover Opportunity on Walkabout Near Rim (2017)', url: 'https://www.jpl.nasa.gov/news/mars-rover-opportunity-on-walkabout-near-rim/' },
    { label: 'NASA Photojournal: Panorama Above Perseverance Valley', url: 'https://science.nasa.gov/photojournal/panorama-above-perseverance-valley-on-mars/' },
    { label: "NASA Photojournal: Opportunity's Last Message", url: 'https://science.nasa.gov/photojournal/opportunitys-last-message' },
    { label: 'NASA Photojournal: Opportunity Legacy Pan (True Color)', url: 'https://science.nasa.gov/photojournal/opportunity-legacy-pan-true-color' },
    {
      label: 'NASA 3D Resources: Spirit and Opportunity Rover 3D model',
      url: 'https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/',
    },
  ],
}
