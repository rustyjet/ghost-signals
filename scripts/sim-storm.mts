import { initialState, step, sunlight, type Plan, type GameState, type Day } from '../src/components/game/dustStormModel.ts'

// Balance check for "Last Light". Run: node scripts/sim-storm.mts
// Each strategy decides the switches and how much to drive each sol. Driving finds a rock about
// every 3 sols of steady driving (rocks are ~28 m apart at 5 m/s, plus ~1 sol to study).

type Strat = (s: GameState, p: Plan) => { plan: Plan; drive: number }
const thermo = (s: GameState, p: Plan) => (s.warmth < 40 ? true : s.warmth > 75 ? false : p.heaters)

const strats: Record<string, Strat> = {
  // The photo game's old strategies (no driving, always something to send)
  stillBothOn: () => ({ plan: { heaters: true, radio: true }, drive: 0 }),
  stillThermoRadio60: (s, p) => ({ plan: { heaters: thermo(s, p), radio: s.battery > 60 }, drive: 0 }),
  // Driving
  alwaysDriveAllOn: () => ({ plan: { heaters: true, radio: true }, drive: 1 }),
  alwaysDriveThermo: (s, p) => ({ plan: { heaters: thermo(s, p), radio: s.stored > 0 }, drive: 1 }),
  driveUntilDark: (s, p) => {
    const dark = sunlight(s.sol + 1) < 0.6
    return { plan: { heaters: thermo(s, p), radio: s.stored > 0 && s.battery > 45 }, drive: dark ? 0 : 1 }
  },
  driveWhenCharged: (s, p) => ({
    plan: { heaters: thermo(s, p), radio: s.stored > 0 && s.battery > 50 },
    drive: s.battery > 55 ? 1 : 0,
  }),
  neverDrive: (s, p) => ({ plan: { heaters: thermo(s, p), radio: false }, drive: 0 }),
}

for (const [name, f] of Object.entries(strats)) {
  let wins = 0, packets = 0, deathSol = 0, deaths = 0
  const why: Record<string, number> = {}
  const still = name.startsWith('still')
  for (let r = 0; r < 2000; r++) {
    let s = initialState()
    let p: Plan = { heaters: true, radio: true }
    let travel = 0
    while (s.outcome === 'playing') {
      const d = f(s, p)
      p = d.plan
      let found = 0
      if (still) found = 1
      else {
        travel += d.drive
        if (travel >= 3) { travel -= 3; found = 1 }
      }
      const day: Day = { drive: d.drive, found }
      s = step(s, p, day)
    }
    why[s.outcome] = (why[s.outcome] ?? 0) + 1
    if (s.outcome === 'survived') { wins++; packets += s.data } else { deaths++; deathSol += s.sol }
  }
  console.log(
    name.padEnd(20),
    'win', (wins / 20).toFixed(0).padStart(3) + '%',
    'packets', (packets / Math.max(1, wins)).toFixed(1).padStart(5),
    'deathSol', (deathSol / Math.max(1, deaths)).toFixed(1).padStart(5),
    JSON.stringify(why),
  )
}
