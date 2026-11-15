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

/**
 * Science sent to Earth, with the radio that sends it. A drawn dish beside the count; the findings waiting on
 * board stand in a small stack, one bar each, and leave from the top when the radio sends one (a light rises from
 * the dish, the count pops). Radio off: the dish dims and the label says so. Sized in em from its own font size.
 */
export function SentHome({ sent, waiting, radio }: { sent: number; waiting: number; radio: boolean }) {
  const countRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const wavesRef = useRef<SVGGElement>(null)
  const last = useRef(sent)

  useLayoutEffect(() => {
    const before = last.current
    last.current = sent
    if (sent <= before) return
    const reduced = prefersReducedMotion()
    // The signal arcs flash in either case; motion only without reduced motion
    if (wavesRef.current) gsap.fromTo(wavesRef.current, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power2.out' })
    if (reduced) return
    if (countRef.current) gsap.fromTo(countRef.current, { scale: 1.22 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' })
    if (dotRef.current)
      gsap.fromTo(
        dotRef.current,
        { y: 0, opacity: 1, scale: 1 },
        { y: '-1.6em', opacity: 0, scale: 0.6, duration: 0.95, ease: 'power2.in' },
      )
  }, [sent])

  const shown = Math.min(waiting, 5)
  return (
    <div>
      <p className="flex items-end gap-[0.18em] font-display text-[clamp(2rem,9vw,4.25rem)] font-extrabold leading-[0.85] text-sun">
        {/* Opportunity's dish, drawn: bowl, feed, mast. Arcs show a send. */}
        <span aria-hidden="true" className={`relative block h-[0.82em] w-[0.82em] shrink-0 transition-opacity duration-300 ${radio ? 'opacity-100' : 'opacity-40'}`}>
          <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7 A9.5 9.5 0 0 0 17 20 Z" fill="currentColor" fillOpacity="0.18" />
            <path d="M10.5 13.5 L15.5 8.5" />
            <circle cx="16.4" cy="7.6" r="1.4" fill="currentColor" />
            <path d="M9 18.5 L6.5 23 M3.5 23 H11" />
            <g ref={wavesRef} opacity="0">
              <path d="M18.6 4.2 A4.5 4.5 0 0 1 20.4 6" />
              <path d="M19.8 1.4 A8 8 0 0 1 23.2 4.8" />
            </g>
          </svg>
          {/* The finding on its way to Earth */}
          <span ref={dotRef} className="absolute left-[64%] top-[22%] block h-[0.14em] w-[0.14em] -translate-x-1/2 rounded-full bg-sun-bright opacity-0 shadow-[0_0_0.12em_rgb(255_241_214/0.8)]" />
        </span>
        <span ref={countRef} className="inline-block origin-bottom-left tabular-nums">
          {sent}
        </span>
        {/* Findings waiting on board: blocks in an open tray, two to a row (five at most drawn; the label has the number) */}
        <span
          aria-hidden="true"
          className={`ml-[0.1em] flex w-[0.56em] flex-wrap-reverse content-start gap-[0.04em] rounded-b-[0.06em] p-[0.05em] shadow-[inset_0.04em_0_0_currentColor,inset_-0.04em_0_0_currentColor,inset_0_-0.04em_0_currentColor] transition-opacity duration-200 ${shown ? 'opacity-90' : 'opacity-0'}`}
        >
          {Array.from({ length: Math.max(shown, 1) }, (_, i) => (
            <span key={i} className={`block h-[0.19em] w-[0.19em] rounded-[0.035em] bg-sun ${shown ? '' : 'invisible'}`} />
          ))}
        </span>
      </p>
      <p className="mt-2 text-base text-sun/80">
        sent home
        {waiting > 0 ? (
          <span className="text-sun">, <span className="whitespace-nowrap">{waiting} to send</span></span>
        ) : (
          !radio && <span>, radio off</span>
        )}
      </p>
    </div>
  )
}
