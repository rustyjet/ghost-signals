import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../../scroll/smoothScroll'
import { sunlight, type GameState, type Plan } from './dustStormModel'

/** The pieces both Last Light games share: the battery, the switches, the ending and the daily news. */

/**
 * The battery as a cell with a terminal nub. The fill tracks the charge as it counts; where the fill passes behind
 * the number, the digits turn dark (a clipped copy), so it reads at every level. Power lost today lingers as a
 * faint band, then drains away. Low turns it orange, always with the word "low" beside it.
 * Sized in em: it takes the font size of its parent.
 */
export function BatteryCell({ value, instantKey }: { value: number; /** Change it to jump to `value` with no animation (a new game). */ instantKey: number }) {
  const shown = useRef({ level: value })
  const ghost = useRef({ level: value })
  const rootRef = useRef<HTMLSpanElement>(null)
  const baseRef = useRef<HTMLSpanElement>(null)
  const inkRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)

  // Clip from the right: the inner edge sits 0.07em inside the outline
  const clip = (level: number) => `inset(0 calc(0.07em + (100% - 0.14em) * ${(1 - Math.min(100, Math.max(0, level)) / 100).toFixed(4)}) 0 0)`
  function draw() {
    const n = String(Math.round(shown.current.level))
    if (baseRef.current) baseRef.current.textContent = n
    if (inkRef.current) inkRef.current.textContent = n
    if (fillRef.current) fillRef.current.style.clipPath = clip(shown.current.level)
    if (ghostRef.current) ghostRef.current.style.clipPath = clip(Math.max(ghost.current.level, shown.current.level))
    rootRef.current?.setAttribute('aria-label', `Battery ${n} percent`)
  }

  // A new game: no counting, no drain band
  useLayoutEffect(() => {
    gsap.killTweensOf([shown.current, ghost.current])
    shown.current.level = ghost.current.level = value
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instantKey])

  // Each day: count to the new charge; a loss leaves its band for a moment, then it drains
  useLayoutEffect(() => {
    const reduced = prefersReducedMotion()
    const from = shown.current.level
    gsap.killTweensOf([shown.current, ghost.current])
    if (reduced) {
      shown.current.level = ghost.current.level = value
      draw()
      return
    }
    if (value < from) ghost.current.level = Math.max(ghost.current.level, from)
    else ghost.current.level = value
    gsap.to(shown.current, { level: value, duration: 0.6, ease: 'power3.out', onUpdate: draw })
    if (value < from) gsap.to(ghost.current, { level: value, delay: 0.45, duration: 0.55, ease: 'power2.inOut', onUpdate: draw })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const low = value < 20
  return (
    <span ref={rootRef} role="img" className={`inline-flex items-center align-bottom ${low ? 'text-warn' : 'text-sun'}`}>
      <span className="relative block h-[1.06em] w-[2.55em] rounded-[0.2em] bg-black/40 shadow-[inset_0_0_0_0.055em_currentColor]">
        {/* Power lost today, draining away */}
        <span ref={ghostRef} aria-hidden="true" className="absolute inset-0">
          <span className="absolute inset-[0.07em] rounded-[0.13em] bg-current opacity-30" />
        </span>
        {/* The number on the empty part of the cell */}
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="text-[0.78em] leading-none tabular-nums">
            <span ref={baseRef} />
            <span className="text-[0.45em]">%</span>
          </span>
        </span>
        {/* The charge, with the same number in dark where it covers it */}
        <span ref={fillRef} aria-hidden="true" className="absolute inset-0">
          <span className="absolute inset-[0.07em] rounded-[0.13em] bg-current" />
          <span className="absolute inset-0 grid place-items-center text-ink">
            <span className="text-[0.78em] leading-none tabular-nums">
              <span ref={inkRef} />
              <span className="text-[0.45em]">%</span>
            </span>
          </span>
        </span>
      </span>
      {/* Terminal nub */}
      <span aria-hidden="true" className="ml-[0.045em] block h-[0.4em] w-[0.1em] rounded-r-[0.07em] bg-current" />
    </span>
  )
}

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
