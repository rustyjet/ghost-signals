import type { Chapter } from '../types'

// Script: see the approved plan. Every number here has a checked row in docs/FACTS.md.
// The voice is the rover's own, first person. Steps 4-12 are added after the checkpoint.
export const opportunity: Chapter = {
  slug: 'opportunity',
  name: 'Opportunity',
  world: 'mars',
  place: 'Meridiani Planum, Mars',
  tagline: 'Sent to Mars in 2003 to find out if it was ever wet.',
  spine: { before: 'Day', after: 'on Mars' },
  title: { orbit: '-35deg 78deg 7m', target: 'auto', storm: 0 },
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
      orbit: '-60deg 84deg 4.6m',
      target: 'auto',
      storm: 0,
    },
    {
      spine: 1,
      figure: { value: 90, unit: 'days', label: 'the whole plan' },
      heading: 'The plan was short.',
      body: 'Ninety days on Mars. About one kilometre of driving. Then my job would be done.',
      orbit: '25deg 70deg 4.2m',
      target: 'auto',
      storm: 0,
    },
    {
      spine: 48,
      figure: { value: 4, unit: 'mm', label: 'across, each grey berry' },
      heading: 'The ground had berries.',
      body: 'Tiny grey balls lay everywhere. They are hematite, a mineral that forms in water. Mars was once wet.',
      orbit: '15deg 84deg 2.2m',
      target: '-0.05 0.4 0.68',
      storm: 0,
    },
  ],
  interaction: 'dust-storm',
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
    {
      label: 'NASA Photojournal: Discovery Served Up in a Bowl',
      url: 'https://science.nasa.gov/photojournal/discovery-served-up-in-a-bowl',
    },
    {
      label: 'NASA APOD: A Berry Bowl of Martian Spherules',
      url: 'https://science.nasa.gov/image-article/apod-2025-june-22-a-berry-bowl-of-martian-spherules/',
    },
    {
      label: 'NASA 3D Resources: Spirit and Opportunity Rover 3D model',
      url: 'https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/',
    },
  ],
}
