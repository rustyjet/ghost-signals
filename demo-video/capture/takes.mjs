// Scroll paths for the long demo's takes. Keyframes: [seconds, scrollY], eased between.
// Positions read off map.mjs contact sheets (1920x1080): chapter steps sit at multiples of 1080.
const open = [[0, 0], [3.5, 0], [5, 1080], [8, 1080]] // title on the 3D model, then the first step
const hl = (y) => [[0, y - 700], [1.5, y], [5, y]] // arrive at one step and hold to read it

export const TAKES = {
  // Title, Earth, Moon, Eagle, Mars, then each Mars stop.
  hub: { url: '', keys: [[0, 0], [5, 0], [8, 900], [10, 900], [13, 2000], [15.5, 2000], [18, 2950], [20.5, 2950], [23, 4000], [24.5, 4000], [27, 5200], [29.5, 5200], [32, 6150], [34.5, 6150], [36.5, 7250], [39, 7250], [41, 8350], [43.5, 8350], [45.5, 9500], [48, 9500]] },
}
const HIGHLIGHTS = {
  opportunity: [10800, 12960], // 5,111 days, June 2018 / I'm still here
  ingenuity: [6480, 8640], // Five flights was the plan / Flight 72
  eagle: [2160, 7560], // "The Eagle has landed." / The mirrors kept working
  insight: [4320, 11880], // Mars is very quiet / The dust won
  sojourner: [7560, 10800], // My week was up / Then my lander stopped
}
for (const [slug, [a, b]] of Object.entries(HIGHLIGHTS)) {
  TAKES[`${slug}-open`] = { url: `#/signal/${slug}`, keys: open }
  TAKES[`${slug}-a`] = { url: `#/signal/${slug}`, keys: hl(a) }
  TAKES[`${slug}-b`] = { url: `#/signal/${slug}`, keys: hl(b) }
}
// "Where every number comes from": the sources list at the end of a chapter.
TAKES.sources = { url: '#/signal/opportunity', keys: [[0, 15000], [4, 15841], [7, 15841]] }
