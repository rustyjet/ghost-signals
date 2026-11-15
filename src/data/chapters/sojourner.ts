import type { Chapter, SceneImage } from '../types'

// Every number has a checked row in docs/FACTS.md ("Sojourner"), every picture a row in docs/CREDITS.md.
// The counter is the day on Mars (sol), landing day being sol 1, as NASA counted it for Pathfinder.
// NASA has no 3D model of Sojourner, so real photos carry the whole chapter: the title and the
// closing step stand on the lander's own panorama, where the real rover is parked at the rock Yogi.

const P = 'photos/'

const galleryGround: SceneImage = {
  id: 'sojourner-ground',
  wide: { src: P + 'sojourner-ground-wide.webp', w: 4400, h: 645 },
  tall: { src: P + 'sojourner-ground-narrow.webp', w: 1400, h: 684 },
  alt: 'A rocky orange plain. Far off in the middle, the small rover sits beside a big rock; the lander’s airbags lie in front.',
  credit: 'NASA/JPL (PIA01466)',
  name: 'The landing site from my lander, with me at the rock Yogi, days 8 to 10',
}
const gallery: SceneImage = {
  id: 'sojourner-pano',
  wide: { src: P + 'sojourner-pano.webp', w: 4400, h: 767 },
  alt: 'A wide view of a rocky orange plain under a butterscotch sky, with the lander’s solar panels and airbags in front and the small rover far off by a big rock.',
  credit: 'NASA/JPL (PIA01466)',
  name: 'The full panorama from my lander, days 8 to 10',
}
const peaks: SceneImage = {
  id: 'sojourner-peaks',
  wide: { src: P + 'sojourner-peaks.webp', w: 3200, h: 1386 },
  alt: 'A plain covered in rocks of every size, under a hazy sky, with two low rounded hills on the horizon.',
  credit: 'NASA/JPL (PIA02405)',
  name: 'Ares Vallis and the Twin Peaks',
}
const deployed: SceneImage = {
  id: 'sojourner-deployed',
  wide: { src: P + 'sojourner-deployed.webp', w: 935, h: 406 },
  alt: 'The little six-wheeled rover, a flat solar panel on top, sitting on orange ground just past the ramp and airbags of its lander.',
  credit: 'NASA/JPL (PIA01551)',
  name: 'Me, just off the ramp, day 2',
}
const tracks: SceneImage = {
  id: 'sojourner-tracks',
  wide: { src: P + 'sojourner-tracks.webp', w: 768, h: 484 },
  alt: 'A black and white view from low down: wheel tracks lead back across the ground to the lander and its crumpled airbags.',
  credit: 'NASA/JPL (PIA00664)',
  name: 'My own camera, looking back along my tracks to the lander',
}
const yogi: SceneImage = {
  id: 'sojourner-yogi',
  wide: { src: P + 'sojourner-yogi.webp', w: 2128, h: 1090 },
  alt: 'The small rover pressed up against a big rounded rock on a rocky orange plain, its wheel tracks curving back toward the camera.',
  credit: 'NASA/JPL (PIA01003)',
  name: 'Me at the rock Yogi (colours enhanced by NASA)',
}
const blueSky: SceneImage = {
  id: 'sojourner-blue-sky',
  wide: { src: P + 'sojourner-blue-sky.webp', w: 2853, h: 643 },
  alt: 'Two dark hills on the horizon under a brown sky. Next to them a small white Sun sits low, with pale blue light around it.',
  credit: 'NASA/JPL (PIA01547)',
  name: 'The Sun low over the Twin Peaks, day 24',
}
const mermaid: SceneImage = {
  id: 'sojourner-mermaid',
  wide: { src: P + 'sojourner-mermaid.webp', w: 910, h: 913 },
  alt: 'The small rover on a patch of sand among scattered rocks, under a wide orange sky.',
  credit: 'NASA/JPL (PIA01549)',
  name: 'Me on Mermaid Dune, day 30',
}
const orbit: SceneImage = {
  id: 'sojourner-orbit',
  wide: { src: P + 'sojourner-orbit.webp', w: 2400, h: 2400 },
  alt: 'Grey, bumpy Martian ground seen from straight above. Near the top, one tiny bright speck: the lander.',
  credit: 'NASA/JPL/Univ. of Arizona/USGS (PIA09105)',
  name: 'My landing site seen from orbit, 21 December 2006',
}

export const sojourner: Chapter = {
  slug: 'sojourner',
  name: 'Sojourner',
  world: 'mars',
  place: 'Ares Vallis, Mars',
  tagline: 'Built for a week on Mars. It kept going for 83 days.',
  spine: { before: 'Day', after: 'on Mars', silentAfter: 'on Mars, then silence' },
  title: {
    storm: 0,
    scene: {
      kind: 'rover',
      ground: galleryGround,
      from: { orbit: '-25deg 80deg 5m', target: 'auto' },
      to: { orbit: '0deg 80deg 5m', target: 'auto' },
    },
  },
  steps: [
    {
      spine: 1,
      figure: { value: 15, unit: 'bounces', label: 'at least, wrapped in airbags' },
      heading: 'I bounced onto Mars.',
      body: '4 July 1997. Riding on my lander, I bounced across Ares Vallis, one of the rockiest places on Mars.',
      storm: 0,
      scene: { kind: 'photo', image: peaks, from: { x: 0, y: 0.5, zoom: 1.08 }, to: { x: 0.6, y: 0.6, zoom: 1.15 }, narrow: [{ x: 0.3, y: 0.5, zoom: 1 }, { x: 0.62, y: 0.5, zoom: 1.05 }] },
    },
    {
      spine: 2,
      figure: { value: 30, unit: 'cm', label: 'tall, once I stood up' },
      heading: 'Six wheels on soil.',
      body: 'Day 2. I stood up and rolled down a ramp onto Mars. Mission control said it out loud: “We can report visually six wheels on soil.”',
      storm: 0,
      // Wide screens: the camera eases in until the rover stands left of the words.
      scene: { kind: 'photo', image: deployed, from: { x: 0.7, y: 0.5, zoom: 1.3 }, to: { x: 0.9, y: 0.55, zoom: 1.45 }, narrow: [{ x: 0.5, y: 1, zoom: 1.1 }, { x: 0.5, y: 1, zoom: 1.2 }] },
    },
    {
      spine: 2,
      figure: { value: 12, unit: 'years old', label: 'the girl who named me' },
      heading: 'My name means traveller.',
      body: 'A girl won the contest to name me, after Sojourner Truth, an African-American reformer. A sojourner is a traveller who needs the goodwill of others.',
      storm: 0,
      scene: { kind: 'photo', image: deployed, from: { x: 0.9, y: 0.55, zoom: 1.45 }, to: { x: 0.95, y: 0.6, zoom: 1.55 }, narrow: [{ x: 0.5, y: 1, zoom: 1.2 }, { x: 0.5, y: 1, zoom: 1.3 }] },
    },
    {
      spine: 3,
      figure: { value: 1, unit: 'cm', label: 'a second, my top speed' },
      heading: 'Slow, and on my own.',
      body: 'Radio signals took 10 to 15 minutes to reach me. So drivers on Earth planned my moves from pictures, and I steered round rocks myself.',
      storm: 0,
      scene: { kind: 'photo', image: tracks, from: { x: 0.5, y: 0.2, zoom: 1 }, to: { x: 0.5, y: 0.4, zoom: 1.1 } },
    },
    {
      spine: 3,
      figure: { value: 10, unit: 'hours', label: 'to study one rock, about' },
      heading: 'My first rock.',
      body: 'Day 3. I drove to a rock called Barnacle Bill and pressed my instrument against it, to find out what it was made of.',
      storm: 0,
      // Wide screens: the camera follows the panorama until the rover, by its big rock, is left of the words.
      scene: { kind: 'photo', image: gallery, from: { x: 0.62, y: 0.5, zoom: 1 }, to: { x: 0.69, y: 0.5, zoom: 1.15 }, narrow: [{ x: 0.5, y: 0.5, zoom: 1 }, { x: 0.54, y: 0.5, zoom: 1.2 }] },
    },
    {
      spine: 6,
      figure: { value: 1, unit: 'm', label: 'Yogi, a rock taller than me' },
      heading: 'Rocks with cartoon names.',
      body: 'Barnacle Bill, Yogi, Scooby-Doo. Yogi was taller than me. On day 6 I drove one wheel right up onto it.',
      storm: 0,
      scene: { kind: 'photo', image: yogi, from: { x: 0.5, y: 0.3, zoom: 1 }, to: { x: 0.5, y: 0.5, zoom: 1.15 }, narrow: [{ x: 0.84, y: 0.5, zoom: 1 }, { x: 0.84, y: 0.5, zoom: 1.1 }] },
    },
    {
      spine: 7,
      figure: { value: 7, unit: 'days', label: 'the plan for me' },
      heading: 'My week was up.',
      body: 'My plan was seven days, all within about 10 metres of my lander. On day 7 I was still going, so the team kept me driving.',
      storm: 0,
      scene: { kind: 'photo', image: gallery, from: { x: 0.1, y: 0.5, zoom: 1 }, to: { x: 0.4, y: 0.5, zoom: 1 }, narrow: [{ x: 0.3, y: 0.5, zoom: 1 }, { x: 0.45, y: 0.5, zoom: 1 }] },
    },
    {
      spine: 24,
      figure: { value: 8.5, decimals: 1, unit: 'million', label: 'weather readings by my lander' },
      heading: 'The sky turned blue.',
      body: 'Day 24. Low over the Twin Peaks, the sky near the Sun was pale blue. Not from clouds: the dust itself does that.',
      storm: 0,
      // The Sun comes in from the right as the camera travels along the horizon. Phones: the strip is so
      // low that the Sun would sit under the words, so the camera goes close and the blue glow fills the top.
      scene: { kind: 'photo', image: blueSky, from: { x: 0.7, y: 0.5, zoom: 1 }, to: { x: 0.9, y: 0.5, zoom: 1 }, narrow: [{ x: 0.84, y: 1, zoom: 1.8 }, { x: 0.86, y: 1, zoom: 2.1 }] },
    },
    {
      spine: 30,
      figure: { value: 52, unit: 'm', label: 'driven in my first 30 days' },
      heading: 'A month, still driving.',
      body: 'My lander was built to last 30 days. On day 30 we were both still working, and I was up on a sand dune called Mermaid.',
      storm: 0,
      // Wide screens: the rover can't go further left than a third of the screen in this photo, so it
      // rides up into the top-left corner instead, above the shade behind the words.
      scene: { kind: 'photo', image: mermaid, from: { x: 0, y: 0.7, zoom: 1 }, to: { x: 0, y: 0.84, zoom: 1 }, narrow: [{ x: 0.18, y: 0.8, zoom: 1.2 }, { x: 0.2, y: 1, zoom: 1.3 }] },
    },
    {
      spine: 83,
      silent: true,
      figure: { value: 83, unit: 'days', label: 'on Mars, out of 7 planned' },
      heading: 'Then the line went quiet.',
      body: '27 September 1997: my lander sent its last data. I could only talk to Earth through it, so Earth heard no more from me.',
      storm: 0,
      scene: { kind: 'black' },
    },
    {
      spine: 83,
      silent: true,
      figure: { value: 100, unit: 'm', label: 'driven in all, never more than 12 m from my lander' },
      heading: 'Circling a silent lander.',
      body: 'My lander never answered again. NASA thinks I probably kept circling it, trying to call it.',
      storm: 0,
      scene: {
        kind: 'rover',
        ground: galleryGround,
        from: { orbit: '20deg 80deg 5m', target: 'auto' },
        to: { orbit: '-20deg 80deg 5m', target: 'auto' },
      },
    },
    {
      spine: 83,
      silent: true,
      figure: { value: 2006, plain: true, label: 'a camera in orbit found my lander' },
      heading: 'Seen from space.',
      body: 'Nine years later, an orbiter photographed my lander from above. A small shape near it may be me.',
      storm: 0,
      // From the whole frame down to the lander's speck: right of the words on wide screens, above them on phones.
      // Already close enough to see the speck when the words arrive; it stays right of them on wide screens
      // (from 72% to about 80% across) and above them on phones, all the way in.
      scene: { kind: 'photo', image: orbit, from: { x: 0, y: 0.09, zoom: 1.5 }, to: { x: 0.317, y: 0.148, zoom: 3 }, narrow: [{ x: 0.467, y: 0.07, zoom: 1.5 }, { x: 0.473, y: 0.16, zoom: 3 }] },
    },
  ],
  interaction: 'drive-plan',
  sources: [
    { label: 'NASA Science: Mars Pathfinder mission page', url: 'https://science.nasa.gov/mission/mars-pathfinder/' },
    { label: 'NSSDCA: Mars Pathfinder', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1996-068A' },
    { label: 'NSSDCA: Mars Pathfinder Rover', url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=MESURPR' },
    { label: 'NSSDCA: Mars Pathfinder preliminary results', url: 'https://nssdc.gsfc.nasa.gov/planetary/marspath_results.html' },
    { label: 'NASA release 97-174, 8 August 1997 (NSSDCA copy)', url: 'https://nssdc.gsfc.nasa.gov/planetary/text/marspath_review.txt' },
    { label: 'NASA release 97-255: Mars Pathfinder Winds Down After Phenomenal Mission', url: 'https://nssdc.gsfc.nasa.gov/planetary/text/marspath_pr_971104.txt' },
    {
      label: 'NASA History: 25 Years Ago, Mars Pathfinder Launches to Mars to Deploy Sojourner',
      url: 'https://www.nasa.gov/history/25-years-ago-mars-pathfinder-launches-to-mars-to-deploy-sojourner-the-first-planetary-rover-2/',
    },
    { label: 'NASA/JPL On a Mission podcast: First Steps: Sojourner', url: 'https://www.nasa.gov/podcasts/on-a-mission/first-steps-sojourner-s4e2/' },
    { label: 'NASA Space Place: The Mars Rovers: Sojourner', url: 'https://spaceplace.nasa.gov/mars-sojourner/en/' },
    { label: 'JPL Robotics: Mars Pathfinder', url: 'https://www-robotics.jpl.nasa.gov/what-we-do/flight-projects/pathfinder/' },
    { label: 'NASA Photojournal: Mars Pathfinder Landing Site and Surroundings (PIA09105)', url: 'https://photojournal.jpl.nasa.gov/catalog/PIA09105' },
    { label: 'JPL: Sojourner on Mars and Lessons Learned for Future Planetary Rovers (Wilcox and Nguyen)', url: 'https://www-robotics.jpl.nasa.gov/media/documents/ICESpaper.pdf' },
    { label: 'NASA Planetary Data System: Sojourner operations log, sol by sol (H. J. Moore)', url: 'https://planetarydata.jpl.nasa.gov/img/data/mpf/rover/mprv_0001/document/rovevent.asc' },
    { label: 'NASA Planetary Data System: rover operations overview', url: 'https://planetarydata.jpl.nasa.gov/img/data/mpf/rover/mprv_0001/document/roverdoc/uplkdocs/overview/opsvgs.htm' },
    { label: 'NASA Planetary Data System: rover sequence planning report, sol 4', url: 'https://planetarydata.jpl.nasa.gov/img/data/mpf/rover/mprv_0001/document/roverdoc/uplklogs/flight/sol04/sol4up.htm' },
    { label: 'NASA Photojournal: Sojourner, Barnacle Bill and Yogi, sol 3 (PIA00660)', url: 'https://science.nasa.gov/photojournal/sojourner-barnacle-bill-and-yogi/' },
    { label: 'NASA Photojournal: Area of 360 Degree Color Panorama, sols 8 to 10 (PIA00751)', url: 'https://science.nasa.gov/photojournal/area-of-360-degree-color-panorama/' },
    { label: 'NASA Photojournal: Sojourner Does a Wheelie on Yogi, sol 6 (PIA00670)', url: 'https://science.nasa.gov/photojournal/sojourner-does-a-wheelie-on-yogi/' },
  ],
}
