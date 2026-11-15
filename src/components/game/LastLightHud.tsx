import { sunlight, type GameState, type Plan } from './dustStormModel'

/** The pieces both Last Light games share: the switches, the ending and the daily news. */

/** A big two-way switch. Up is on. */
export function Lever({
  label,
  cost,
  on,
  warn,
  onToggle,
}: {
  label: string
  /** Power it uses each day while on. */
  cost: number
  on: boolean
  warn?: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="group flex items-center gap-2 rounded-2xl bg-basalt/70 p-2 text-left min-[360px]:gap-3 min-[360px]:p-3 ring-1 ring-sun/20 transition-[transform,box-shadow] duration-150 ease-out hover:ring-sun/45 active:scale-[0.97] sm:gap-4 sm:p-4"
    >
      <span aria-hidden="true" className="relative h-16 w-9 shrink-0 rounded-xl min-[360px]:w-10 bg-black/50 ring-1 ring-sun/25 sm:h-24 sm:w-12">
        <span
          className={`absolute inset-x-1 h-[calc(50%-0.25rem)] rounded-lg transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${on ? 'top-1 translate-y-0 bg-sun shadow-[0_4px_10px_rgb(0_0_0/0.45)]' : 'top-1 translate-y-[calc(100%+0.5rem)] bg-sun/25'}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg font-extrabold leading-tight sm:text-2xl">{label}</span>
        <span className="block text-sm leading-snug sm:text-base">
          <span className="font-bold">{on ? 'On' : 'Off'}</span>
          <span className="text-sun/75">, {cost} a day</span>
        </span>
        {warn && <span className="block text-sm font-bold leading-snug text-frost sm:text-base">{warn}</span>}
      </span>
    </button>
  )
}

export function Ending({
  state,
  headingRef,
  onRetry,
}: {
  state: GameState
  headingRef: React.RefObject<HTMLHeadingElement | null>
  onRetry: () => void
}) {
  const won = state.outcome === 'survived'
  return (
    <div className="max-w-[40rem]">
      <h2 ref={headingRef} tabIndex={-1} className="text-[clamp(2.4rem,9vw,5rem)] outline-none">
        {won ? 'You made it.' : state.outcome === 'no-power' ? 'The battery ran flat.' : 'The electronics froze.'}
      </h2>
      <p className="mt-4 max-w-[40ch] text-lg leading-snug text-sun lg:text-xl">
        {won
          ? `You sent home ${state.data} packets of science. This is close to what happened in July 2007: the team kept the rover as still as they could and waited. Opportunity’s power fell to 128 watt-hours a day, and it made it through.`
          : `Day ${state.sol} was the end of your rover. The real one met a storm that covered all of Mars in June 2018. Its panels could not recharge its batteries, and its last signal reached Earth on 10 June 2018.`}
      </p>
      {!won && (
        <p className="mt-3 max-w-[40ch] text-base text-sun/80">
          In 2007 the team got it through a storm like this one by keeping still and waiting.
        </p>
      )}
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-12 rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]"
      >
        Try again
      </button>
    </div>
  )
}

/** One line of news for the day, most urgent first, early enough to act on. */
export function newsFor(prev: GameState, next: GameState, plan: Plan): string | null {
  const down = (a: number, b: number, at: number) => a >= at && b < at
  const up = (a: number, b: number, at: number) => a < at && b >= at
  const sunA = sunlight(prev.sol)
  const sunB = sunlight(next.sol)
  if (down(prev.battery, next.battery, 20)) return 'Battery low. Switch something off.'
  if (down(prev.warmth, next.warmth, 35)) return 'The electronics are getting cold. Heaters?'
  if (down(prev.battery, next.battery, 50)) return 'Battery at half. What could you switch off?'
  if (next.gust) return 'A gust of wind blew some dust off the panels.'
  if (down(sunA, sunB, 0.75)) return 'The storm is here. Less sunlight reaches the panels.'
  if (down(sunA, sunB, 0.35)) return 'The sky is nearly dark. The panels make very little power.'
  if (up(sunA, sunB, 0.5)) return 'The dust is settling. The sky is getting lighter.'
  if (plan.heaters && up(prev.warmth, next.warmth, 90)) return 'Warm enough. The heaters could rest for a while.'
  return null
}
