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
      className={`group flex items-center gap-2 rounded-2xl p-2 text-left ring-1 transition-[transform,background-color,box-shadow] duration-200 ease-out active:scale-[0.97] min-[360px]:gap-3 min-[360px]:p-3 sm:gap-4 sm:p-4 ${on ? 'bg-basalt/85 ring-sun/40 hover:ring-sun/60' : 'bg-basalt/60 ring-sun/15 hover:ring-sun/35'}`}
    >
      <span
        aria-hidden="true"
        className={`relative h-16 w-9 shrink-0 rounded-xl ring-1 transition-[background-color,box-shadow] duration-200 min-[360px]:w-10 sm:h-24 sm:w-14 ${on ? 'bg-sun/20 ring-sun/45' : 'bg-black/50 ring-sun/20'}`}
      >
        <span
          className={`absolute inset-x-1 top-1 grid h-[calc(50%-0.25rem)] place-items-center rounded-lg transition-[transform,background-color,color,box-shadow] duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${on ? 'translate-y-0 bg-sun text-ink shadow-[0_4px_10px_rgb(0_0_0/0.45)]' : 'translate-y-[calc(100%+0.5rem)] bg-sun/25 text-sun/75'}`}
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
export type NewsKind = 'power' | 'cold' | 'warm' | 'sky' | 'gust' | 'rock' | 'radio'
/** info: plain; warn: act now (orange); cold: the electronics are cooling (frost). Always a badge shape too. */
export type NewsTone = 'info' | 'warn' | 'cold'
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
      {kind === 'gust' && <path d="M3 8.5 H13.5 A3 3 0 1 0 10.5 5.5 M3 12.5 H18 A3 3 0 1 1 15 15.5 M3 16.5 H9" />}
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
}
const TEXT: Record<NewsTone, string> = { info: 'text-sun', warn: 'font-bold text-warn', cold: 'font-bold text-frost' }

/**
 * The rover's news: a drawn badge for what it is about, then the line. Each new line rises in as its blur clears;
 * under reduced motion it only fades. Warnings are orange, cold is frost, each with its own badge shape.
 */
export function NewsLine({ item }: { item: News | null }) {
  return (
    <p
      aria-live="polite"
      className="min-h-[2.8em] max-w-[36ch] text-base leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.6),0_0_18px_rgb(36_24_18/0.9)] sm:text-lg lg:text-xl"
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
