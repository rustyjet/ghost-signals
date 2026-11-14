import { initialState, step, type Plan, type GameState } from '../src/components/game/dustStormModel.ts'
type Strat = (s: GameState, p: Plan) => Plan
const strats: Record<string, Strat> = {
  bothOn: () => ({ heaters: true, radio: true }),
  heatOnly: () => ({ heaters: true, radio: false }),
  nothing: () => ({ heaters: false, radio: false }),
  thermoNoRadio: (s, p) => ({ heaters: s.warmth < 40 ? true : s.warmth > 75 ? false : p.heaters, radio: false }),
  thermoRadio60: (s, p) => ({ heaters: s.warmth < 40 ? true : s.warmth > 75 ? false : p.heaters, radio: s.battery > 60 }),
  thermoRadio40: (s, p) => ({ heaters: s.warmth < 40 ? true : s.warmth > 75 ? false : p.heaters, radio: s.battery > 40 }),
  heatRadio60: (s) => ({ heaters: true, radio: s.battery > 60 }),
}
for (const [name, f] of Object.entries(strats)) {
  let wins = 0, packets = 0, deathSol = 0, deaths = 0; const why: Record<string, number> = {}
  for (let r = 0; r < 2000; r++) {
    let s = initialState(), p: Plan = { heaters: true, radio: true }
    while (s.outcome === 'playing') { p = f(s, p); s = step(s, p) }
    why[s.outcome] = (why[s.outcome] ?? 0) + 1
    if (s.outcome === 'survived') { wins++; packets += s.data } else { deaths++; deathSol += s.sol }
  }
  console.log(name.padEnd(14), 'win', (wins / 20).toFixed(0) + '%', 'packets', (packets / Math.max(1, wins)).toFixed(1), 'deathSol', (deathSol / Math.max(1, deaths)).toFixed(1), JSON.stringify(why))
}
