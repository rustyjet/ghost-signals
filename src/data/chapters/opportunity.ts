import type { Chapter } from '../types'

// Every fact here has a row in docs/FACTS.md. Narration is imagined; the facts in it are not.
export const opportunity: Chapter = {
  slug: 'opportunity',
  name: 'Opportunity',
  callSign: 'MER-B · Meridiani Planum, Mars',
  world: 'mars',
  frequency: 62,
  status: 'Silent since 10 June 2018',
  model: {
    src: 'models/opportunity.glb',
    alt: '3D model of the Opportunity rover: six wheels, flat solar panels like wings, and a tall camera mast.',
    credit: 'NASA/JPL-Caltech',
    cameraOrbit: '-35deg 70deg auto',
  },
  hotspots: [
    {
      id: 'panels',
      name: 'Solar panels',
      text: 'My only power source. On a clear day they made up to 140 watts. Dust kept settling on them and I had no way to wipe it off. In a 2007 dust storm my power dropped to just 128 watt-hours in a whole day. Sometimes the wind blew the dust away for me.',
      position: '-0.6 0.78 -0.3',
      normal: '0 1 0',
    },
    {
      id: 'mast',
      name: 'Camera mast',
      text: 'My eyes sat about 1.4 metres up, roughly the height of a ten-year-old. I sent home more than 217,000 pictures, including 15 full 360-degree colour panoramas.',
      position: '0.25 1.4 0.55',
      normal: '0 0 1',
    },
    {
      id: 'arm',
      name: 'Robotic arm',
      text: 'My arm held instruments I could press against rocks. One of them, a Mössbauer spectrometer, showed that the little grey balls all around me were made of hematite, a mineral that usually forms in water.',
      position: '-0.05 0.4 0.68',
      normal: '0 0 1',
    },
    {
      id: 'wheels',
      name: 'Six wheels',
      text: 'My top speed was about 3.75 centimetres a second, so driving 100 metres took me about 45 minutes. My best single day was 220 metres, on 20 March 2005.',
      position: '-0.95 0.3 0.2',
      normal: '1 0 0',
    },
  ],
  beats: [
    {
      heading: 'Ninety days',
      text: 'I landed on 24 January 2004 and bounced to a stop inside a small crater called Eagle, on a flat plain called Meridiani Planum. My team built me to work for 90 Martian days and to drive about one kilometre. That was the whole plan.',
    },
    {
      heading: 'Blueberries',
      text: 'Right outside my crater, the ground was covered in tiny grey balls, about 4 millimetres across. My team called them blueberries. My instruments showed they were hematite, a mineral that forms in water. Long ago, water had soaked these rocks. It was acidic and salty, but it was water.',
    },
    {
      heading: 'Waiting for the wind',
      text: 'Dust fell on my solar panels every day. In 2007 a dust storm darkened the sky and my power fell lower than ever. My team switched off almost everything: no driving, few pictures, very little talking. We waited. When the sky cleared, I was still here. Every so often a gust of wind blew my panels clean, like someone opening the curtains.',
    },
    {
      heading: 'The long drive',
      text: 'I kept going for years. I drove to Endeavour Crater, 22 kilometres wide, and found more signs of ancient water at its rim. By the end I had driven 45.16 kilometres, farther than any vehicle had ever driven on another world.',
    },
    {
      heading: 'The last storm',
      text: 'In June 2018 a dust storm wrapped the whole planet. Not enough sunlight reached my panels to charge my batteries. My last signal reached Earth on 10 June 2018. For eight months my team sent more than a thousand commands, hoping I would answer. On 13 February 2019 they said goodbye.',
    },
    {
      heading: 'Still here',
      text: 'I am parked on the western edge of a place called Perseverance Valley. I was meant to last 90 days. I lasted almost 15 years, sixty times longer than planned.',
    },
  ],
  interaction: 'dust-storm',
  learned:
    'Opportunity found hematite "blueberries" and other clues showing that liquid water once soaked the ground at Meridiani Planum. Its evidence suggested Mars may once have been able to support microbial life, though the water there was acidic and salty, which would have made life harder.',
  stillMatters:
    'Opportunity set the record for the longest drive on another world, and it showed that a solar-powered rover could survive years of Martian dust by waiting out storms and catching lucky gusts of wind. A famous line, "My battery is low and it\'s getting dark," was a science journalist\'s way of summing up its last data. The rover never said it, but the line is how many people remember it.',
  quickFacts: [
    { label: 'Launched', value: '7 July 2003' },
    { label: 'Landed', value: '24 Jan 2004, Meridiani Planum' },
    { label: 'Planned life', value: '90 sols (Mars days)' },
    { label: 'Actual life', value: 'Almost 15 years' },
    { label: 'Distance driven', value: '45.16 km' },
    { label: 'Mass', value: '185 kg' },
    { label: 'Last signal', value: '10 June 2018' },
    { label: 'Resting place', value: 'Perseverance Valley' },
  ],
  sources: [
    { label: 'NASA Science: Opportunity mission page', url: 'https://science.nasa.gov/mission/mer-opportunity/' },
    {
      label: "NASA Science: NASA's Opportunity Rover Mission on Mars Comes to End",
      url: 'https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/',
    },
    {
      label: 'NASA NSSDCA: Opportunity spacecraft details',
      url: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A',
    },
    {
      label: "JPL: Mineral in Mars 'Berries' Adds to Water Story",
      url: 'https://www.jpl.nasa.gov/news/mineral-in-mars-berries-adds-to-water-story/',
    },
    {
      label: 'JPL: Mars Rovers Survive Dust Storms, Ready for Next Objectives',
      url: 'https://www.jpl.nasa.gov/news/mars-rovers-survive-dust-storms-ready-for-next-objectives/',
    },
    {
      label: 'NASA 3D Resources: Spirit and Opportunity Rover 3D model',
      url: 'https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/',
    },
  ],
}
