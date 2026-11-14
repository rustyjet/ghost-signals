// Rules of the "Last Light" dust-storm game, kept free of React so they can be simulated and tuned.
// The numbers are game units, simplified on purpose; the UI says so.

export const TOTAL_SOLS = 40
export const SOLAR_MAX = 40 // battery units a clean panel collects on a clear sol
export const COST_CORE = 3 // computer and clock, always on
export const COST_HEATERS = 6
export const COST_RADIO = 12
export const WARMTH_GAIN = 9 // heaters on
export const WARMTH_LOSS = 8 // heaters off
export const GUST_CHANCE = 0.14
export const GUST_CLEAN = 0.18

export interface Plan {
  heaters: boolean
  radio: boolean
}

export type Outcome = 'playing' | 'survived' | 'no-power' | 'too-cold'

export interface GameState {
  sol: number
  battery: number // 0-100
  warmth: number // 0-100
  dust: number // 0-1, share of the panels covered
  data: number // science packets sent to Earth
  gust: boolean // a wind gust cleaned the panels this sol
  outcome: Outcome
}

export function initialState(): GameState {
  return { sol: 0, battery: 80, warmth: 70, dust: 0.1, data: 0, gust: false, outcome: 'playing' }
}

/** How much sunlight reaches the ground: 1 = clear sky. The storm builds, peaks, then fades. */
export function sunlight(sol: number): number {
  const ramp = (a: number, b: number, t: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
  const darken = ramp(4, 12, sol) // storm arrives
  const clear = ramp(26, 36, sol) // storm fades
  return 1 - 0.78 * darken * (1 - clear)
}

/** Advance one sol with the player's current plan. `rand` returns 0-1 (injectable for tests). */
export function step(s: GameState, plan: Plan, rand: () => number = Math.random): GameState {
  if (s.outcome !== 'playing') return s
  const sol = s.sol + 1
  const sky = sunlight(sol)

  // Dust settles faster the darker the storm; a lucky gust blows some off.
  let dust = s.dust + (1 - sky) * 0.042
  const gust = rand() < GUST_CHANCE
  if (gust) dust -= GUST_CLEAN
  dust = Math.min(0.9, Math.max(0, dust))

  const income = SOLAR_MAX * sky * (1 - dust)
  const spend = COST_CORE + (plan.heaters ? COST_HEATERS : 0) + (plan.radio ? COST_RADIO : 0)
  const battery = Math.min(100, Math.max(0, s.battery + income - spend))
  const warmth = Math.min(100, Math.max(0, s.warmth + (plan.heaters ? WARMTH_GAIN : -WARMTH_LOSS)))
  const data = s.data + (plan.radio ? 1 : 0)

  let outcome: Outcome = 'playing'
  if (battery <= 0) outcome = 'no-power'
  else if (warmth <= 0) outcome = 'too-cold'
  else if (sol >= TOTAL_SOLS) outcome = 'survived'

  return { sol, battery, warmth, dust, data, gust, outcome }
}
