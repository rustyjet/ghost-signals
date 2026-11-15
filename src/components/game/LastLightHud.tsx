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

/** Opportunity's dish, drawn: bowl, feed, mast. The arcs show the radio at work. */
export function DishIcon({
  className,
  strokeWidth = 2.7,
  waves = 'off',
  wavesRef,
}: {
  className?: string
  strokeWidth?: number
  /** off: hidden (or driven through wavesRef); pulse: a slow beat while the radio is on (lit, still, with reduced motion) */
  waves?: 'off' | 'pulse'
  wavesRef?: React.Ref<SVGGElement>
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7 A9.5 9.5 0 0 0 17 20 Z" fill="currentColor" fillOpacity="0.18" />
      <path d="M10.5 13.5 L15.5 8.5" />
      <circle cx="16.4" cy="7.6" r="1.4" fill="currentColor" />
      <path d="M9 18.5 L6.5 23 M3.5 23 H11" />
      <g
        ref={wavesRef}
        opacity={waves === 'pulse' ? undefined : 0}
        className={waves === 'pulse' ? 'motion-safe:animate-[signal_2.4s_ease-in-out_infinite]' : undefined}
      >
        <path d="M18.6 4.2 A4.5 4.5 0 0 1 20.4 6" />
        <path d="M19.8 1.4 A8 8 0 0 1 23.2 4.8" />
      </g>
    </svg>
  )
}

/** A thermometer whose level is the rover's warmth (0-100); it eases to each new day's value. */
function Thermometer({ warmth, className }: { warmth: number; className?: string }) {
  const level = Math.min(1, Math.max(0.04, warmth / 100))
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 14.6 V5 a2.5 2.5 0 0 1 5 0 v9.6 a4.5 4.5 0 1 1 -5 0 Z" />
      <circle cx="12" cy="18" r="2.1" fill="currentColor" stroke="none" />
      <rect
        x="11"
        y="5"
        width="2"
        height="12"
        rx="1"
        fill="currentColor"
        stroke="none"
        style={{ transformBox: 'fill-box', transformOrigin: 'bottom', transform: `scaleY(${level})`, transition: 'transform 600ms cubic-bezier(0.23, 1, 0.32, 1)' }}
      />
    </svg>
  )
}

/**
 * A big two-way switch. Up is on. The knob carries what it switches: the heater's thermometer shows the rover's
 * warmth, the radio's dish beats while it is on. The knob is thrown with a small overshoot; the track lights when on.
 */
/**
 * The game's buttons are clicked with a mouse or a finger while the keys drive, and Chrome then often treats a
 * click as keyboard focus and draws the ring, which reads as "selected". So: no ring after a pointer press; the
 * ring comes back when the button itself is used from the keyboard (Space, Enter) or reached with Tab.
 */
const pointerFocus = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => (e.currentTarget.dataset.pointer = 'true'),
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === ' ' || e.key === 'Enter') e.currentTarget.dataset.pointer = 'false'
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => (e.currentTarget.dataset.pointer = 'false'),
}

export function Lever({
  label,
  cost,
  on,
  warn,
  icon,
  warmth = 50,
  onToggle,
}: {
  label: string
  /** Power it uses each day while on. */
  cost: number
  on: boolean
  warn?: string
  icon: 'heater' | 'radio'
  /** The heater's thermometer: the rover's warmth, 0-100. */
  warmth?: number
  onToggle: () => void
}) {
  const iconClass = 'h-5 w-5 sm:h-7 sm:w-7'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      {...pointerFocus}
      // The keyboard ring follows the card's own edge (not outside it), so a focused switch never looks bigger
      className={`group flex items-center gap-2 rounded-2xl p-2 text-left ring-1 focus-visible:outline-none! [&:focus-visible:not([data-pointer=true])]:ring-2 [&:focus-visible:not([data-pointer=true])]:ring-sun transition-[transform,background-color,box-shadow] duration-200 ease-out active:scale-[0.97] min-[360px]:gap-3 min-[360px]:p-3 sm:gap-4 sm:p-4 ${on ? 'bg-basalt/85 ring-sun/40 hover:ring-sun/60' : 'bg-basalt/60 ring-sun/15 hover:ring-sun/35'}`}
    >
      <span
        aria-hidden="true"
        className={`relative h-16 w-9 shrink-0 rounded-xl ring-1 transition-[background-color,box-shadow] duration-200 min-[360px]:w-10 sm:h-24 sm:w-14 ${on ? 'bg-sun/20 ring-sun/45' : 'bg-black/50 ring-sun/20'}`}
      >
        <span
          className={`absolute inset-x-1 top-1 grid h-[calc(50%-0.25rem)] place-items-center rounded-lg transition-[transform,background-color,color,box-shadow] duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${on ? 'translate-y-0 bg-sun text-ink shadow-[0_4px_10px_rgb(0_0_0/0.45)]' : 'translate-y-full bg-sun/25 text-sun/75'}`}
        >
          {icon === 'heater' ? (
            <Thermometer warmth={warmth} className={iconClass} />
          ) : (
            <DishIcon className={iconClass} strokeWidth={2.3} waves={on ? 'pulse' : 'off'} />
          )}
        </span>
      </span>
      <span className="min-w-0">
        <span className={`block font-display text-base font-extrabold leading-tight transition-colors duration-200 min-[380px]:text-lg sm:text-2xl ${on ? 'text-sun' : 'text-sun/75'}`}>
          {label}
        </span>
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

/** What a news line is about; it picks the badge drawn beside it. */
export type NewsKind =
  | 'power' | 'cold' | 'warm' | 'sky' | 'gust' | 'rock' | 'radio' | 'pause'
  // Lift off (Ingenuity)
  | 'rotor' | 'up' | 'high' | 'land' | 'bump' | 'goal' | 'air' | 'hover'
  // Find the mirrors (Eagle)
  | 'moon' | 'laser' | 'again' | 'none' | 'past'
  // Listen for marsquakes (InSight)
  | 'quake' | 'dome'
  // Plan my drive (Sojourner)
  | 'path' | 'sol'
/** info: plain; warn: act now (orange); cold: the electronics are cooling (frost); good: a goal reached (cream). Always a badge shape too. */
export type NewsTone = 'info' | 'warn' | 'cold' | 'good'
export interface News {
  id: number
  text: string
  kind: NewsKind
  tone: NewsTone
}
let newsId = 0
/** A new news line. Each gets its own id, so a repeated line still arrives as new. */
export const news = (kind: NewsKind, text: string, tone: NewsTone = 'info'): News => ({ id: ++newsId, text, kind, tone })

/** One line of news for the day, most urgent first, early enough to act on. */
export function newsFor(prev: GameState, next: GameState, plan: Plan): News | null {
  const down = (a: number, b: number, at: number) => a >= at && b < at
  const up = (a: number, b: number, at: number) => a < at && b >= at
  const sunA = sunlight(prev.sol)
  const sunB = sunlight(next.sol)
  if (down(prev.battery, next.battery, 20)) return news('power', 'Battery low. Switch something off.', 'warn')
  if (down(prev.warmth, next.warmth, 35)) return news('cold', 'The electronics are getting cold. Heaters?', 'cold')
  if (down(prev.battery, next.battery, 50)) return news('power', 'Battery at half. What could you switch off?')
  if (next.gust) return news('gust', 'A gust of wind blew some dust off the panels.')
  if (down(sunA, sunB, 0.75)) return news('sky', 'The storm is here. Less sunlight reaches the panels.')
  if (down(sunA, sunB, 0.35)) return news('sky', 'The sky is nearly dark. The panels make very little power.')
  if (up(sunA, sunB, 0.5)) return news('sky', 'The dust is settling. The sky is getting lighter.')
  if (plan.heaters && up(prev.warmth, next.warmth, 90)) return news('warm', 'Warm enough. The heaters could rest for a while.')
  return null
}

/** The badge drawings, one per kind of news, in the same stroke as the dish and thermometer. */
function NewsIcon({ kind, className }: { kind: NewsKind; className?: string }) {
  if (kind === 'radio') return <DishIcon className={className} strokeWidth={2.4} waves="pulse" />
  if (kind === 'cold' || kind === 'warm') return <Thermometer warmth={kind === 'cold' ? 15 : 85} className={className} />
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'power' && (
        <>
          <rect x="2.5" y="7" width="17" height="10" rx="2" />
          <path d="M22 10.5 V13.5" />
          <rect x="5" y="9.5" width="5" height="5" rx="0.8" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'sky' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5 V4.5 M12 19.5 V21.5 M2.5 12 H4.5 M19.5 12 H21.5 M5.3 5.3 L6.7 6.7 M17.3 17.3 L18.7 18.7 M5.3 18.7 L6.7 17.3 M17.3 6.7 L18.7 5.3" />
        </>
      )}
      {kind === 'pause' && (
        <>
          <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" />
          <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'gust' && <path d="M3 8.5 H13.5 A3 3 0 1 0 10.5 5.5 M3 12.5 H18 A3 3 0 1 1 15 15.5 M3 16.5 H9" />}
      {kind === 'rotor' && (
        <>
          <path d="M3.5 12 H20.5 M7.5 4.6 L16.5 19.4" />
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'up' && <path d="M12 19.5 V5 M6 11 L12 5 L18 11" />}
      {kind === 'high' && <path d="M12 4.5 V19 M6 13 L12 19 L18 13" />}
      {kind === 'land' && <path d="M12 3.5 V13.5 M8 9.5 L12 13.5 L16 9.5 M4 19 H20" />}
      {kind === 'bump' && <path d="M4 19 H20 M12 8 V14 M6 10.5 L8.5 14.5 M18 10.5 L15.5 14.5" />}
      {kind === 'moon' && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="9.5" cy="10" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'laser' && (
        <>
          <path d="M5 19 L17 7" />
          <circle cx="18.5" cy="5.5" r="2.2" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'again' && <path d="M17 6 A7 7 0 1 0 19 12 M17 2.5 V6.5 H13" />}
      {kind === 'none' && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M6.5 17.5 L17.5 6.5" />
        </>
      )}
      {kind === 'past' && (
        <>
          <circle cx="9" cy="14" r="5" />
          <path d="M5 4 L20 9.5 M16 6.5 L20 9.5 L16.5 12.5" />
        </>
      )}
      {kind === 'hover' && <path d="M4 9 H20 M4 15 H20 M12 11.5 V12.5" />}
      {kind === 'goal' && <path d="M5 12.5 L10 17 L19 7.5" strokeWidth="3" />}
      {kind === 'quake' && <path d="M2.5 12 H6 L8 8 L10.5 16.5 L13 5.5 L15.5 18 L17.5 9.5 L19 12 H21.5" strokeWidth="2.2" />}
      {kind === 'dome' && <path d="M4 17.5 A8 8 0 0 1 20 17.5 Z M2.5 17.5 H21.5" />}
      {kind === 'path' && (
        <>
          <path d="M4.5 19.5 L9.5 13 L14 15.5 L18.5 7.5" strokeDasharray="0.1 4.2" strokeWidth="2.6" />
          <circle cx="18.5" cy="6" r="2.4" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'sol' && <path d="M2.5 17.5 H21.5 M6.5 17.5 A5.5 5.5 0 0 1 17.5 17.5 M12 5 V7.5 M4.6 9.1 L6.4 10.9 M19.4 9.1 L17.6 10.9" />}
      {kind === 'air' && (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <circle cx="9" cy="9.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="16" r="1.4" fill="currentColor" stroke="none" />
        </>
      )}
      {kind === 'rock' && (
        <>
          <path d="M3.5 18.5 L6.5 11 L11.5 7.5 L17 9 L20.5 18.5 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M9 13.5 L12.5 12 L14.5 14" />
        </>
      )}
    </svg>
  )
}

const BADGE: Record<NewsTone, string> = {
  info: 'bg-black/35 text-sun shadow-[inset_0_0_0_1px_rgb(242_226_194/0.35)]',
  warn: 'bg-warn text-ink',
  cold: 'bg-frost text-ink',
  good: 'bg-sun text-ink',
}
const TEXT: Record<NewsTone, string> = { info: 'text-sun', warn: 'font-bold text-warn', cold: 'font-bold text-frost', good: 'font-bold text-sun' }

/**
 * The rover's news: a drawn badge for what it is about, then the line. Each new line rises in as its blur clears;
 * under reduced motion it only fades. Warnings are orange, cold is frost, each with its own badge shape.
 */
export function NewsLine({ item, className = 'min-h-[2.8em]' }: { item: News | null; className?: string }) {
  return (
    <p
      aria-live="polite"
      className={`${className} max-w-[36ch] text-base leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.6),0_0_18px_rgb(36_24_18/0.9)] sm:text-lg lg:text-xl`}
    >
      {item && (
        <span
          key={item.id}
          className="flex items-start gap-[0.55em] motion-safe:animate-[news-in_340ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-[fade-in_200ms_ease-out]"
        >
          <span aria-hidden="true" className={`mt-[0.02em] grid h-[1.4em] w-[1.4em] shrink-0 place-items-center rounded-full ${BADGE[item.tone]}`}>
            <NewsIcon kind={item.kind} className="h-[0.86em] w-[0.86em]" />
          </span>
          <span className={TEXT[item.tone]}>{item.text}</span>
        </span>
      )}
    </p>
  )
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
          <DishIcon className="h-full w-full" wavesRef={wavesRef} />
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


/**
 * The day of the storm, with the sunlight ahead: one thin bar per day, as tall as that day's sunlight (the same
 * curve the rules use), so the storm shows as a dip you can plan around. Days lived are solid, days ahead faint,
 * today bright with a mark over it. Each new day number rises in; under reduced motion it just changes.
 */
export function DayCounter({ sol, total, paused, hidden }: { sol: number; total: number; paused: boolean; hidden: boolean }) {
  return (
    <div
      className={`absolute left-5 top-5 text-sun transition-opacity duration-500 md:left-10 lg:top-8 ${hidden ? 'opacity-0' : 'opacity-100'}`}
    >
      <p className="font-display font-extrabold leading-none [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
        <span className="text-[clamp(1.35rem,6vw,2.25rem)] tracking-[-0.02em]">
          Day{' '}
          <span
            key={sol}
            className="inline-block tabular-nums motion-safe:animate-[news-in_300ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-[fade-in_200ms_ease-out]"
          >
            {sol}
          </span>
        </span>
        <span className="ml-[0.35em] text-[clamp(0.95rem,4vw,1.25rem)] font-bold text-sun/85">
          of {total}
          {paused && <span className="text-sun">, paused</span>}
        </span>
      </p>
      <div className="mt-2 flex items-end gap-2">
        <div
          role="img"
          aria-label={`Sunlight for each of the ${total} days. The storm is darkest in the middle days.`}
          className="relative flex h-[1.1rem] w-[10rem] items-end gap-px rounded-[4px] bg-basalt/75 px-[3px] pb-[3px] pt-[6px] shadow-[inset_0_0_0_1px_rgb(242_226_194/0.25)] sm:gap-[2px] lg:h-[1.9rem] lg:w-[16rem]"
        >
          {Array.from({ length: total }, (_, i) => {
            const day = i + 1
            const tall = Math.max(0.14, sunlight(day))
            const tone = day === sol ? 'bg-sun-bright' : day < sol ? 'bg-sun/80' : 'bg-sun/40'
            return (
              <span key={day} className="relative flex h-full flex-1 items-end">
                <span className={`block w-full rounded-[1px] transition-colors duration-300 ${tone}`} style={{ height: `${tall * 100}%` }} />
                {day === sol && (
                  <span aria-hidden="true" className="absolute -top-[5px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-sun-bright" />
                )}
              </span>
            )
          })}
        </div>
        <span className="text-xs text-sun [text-shadow:0_1px_2px_rgb(0_0_0/0.6),0_0_10px_rgb(36_24_18/0.9)] lg:text-sm">sunlight</span>
      </div>
    </div>
  )
}


/**
 * Pause and Keep going, with a drawn glyph that swaps (two bars / a triangle) in a quick scale and blur crossfade.
 * Running: a quiet dark button. Paused: nothing moves until it is pressed, so it turns cream and breathes a soft
 * ring (still under reduced motion). The P key does the same while the game has focus.
 */
export function PauseButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  const glyph = 'absolute h-[0.95rem] w-[0.95rem] transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-keyshortcuts="P"
      {...pointerFocus}
      className={`[&[data-pointer=true]]:outline-none! inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 font-display text-lg font-bold transition-[transform,background-color,color,box-shadow] duration-200 ease-out active:scale-[0.97] ${paused ? 'bg-sun text-ink hover:bg-sun-bright motion-safe:animate-[breathe_2.4s_ease-out_infinite]' : 'bg-basalt/70 text-sun shadow-[inset_0_0_0_1px_rgb(242_226_194/0.3)] hover:shadow-[inset_0_0_0_1px_rgb(242_226_194/0.6)]'}`}
    >
      <span
        aria-hidden="true"
        className={`relative grid h-8 w-8 place-items-center rounded-full transition-colors duration-200 ${paused ? 'bg-ink text-sun' : 'bg-sun text-ink'}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${glyph} ${paused ? 'scale-50 opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0'}`}>
          <rect x="5.5" y="4.5" width="4.5" height="15" rx="1.4" />
          <rect x="14" y="4.5" width="4.5" height="15" rx="1.4" />
        </svg>
        <svg viewBox="0 0 24 24" fill="currentColor" className={`${glyph} translate-x-[1px] ${paused ? 'scale-100 opacity-100 blur-0' : 'scale-50 opacity-0 blur-[2px]'}`}>
          <path d="M7.5 5.3 V18.7 A1.2 1.2 0 0 0 9.3 19.7 L19.6 13 A1.2 1.2 0 0 0 19.6 11 L9.3 4.3 A1.2 1.2 0 0 0 7.5 5.3 Z" />
        </svg>
      </span>
      {paused ? 'Keep going' : 'Pause'}
    </button>
  )
}
