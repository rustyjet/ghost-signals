import { useEffect, useRef, useState } from 'react'
import DustField from '../DustField'
import { gsap, prefersReducedMotion, useGSAP } from '../../scroll/smoothScroll'
import {
  COST_CORE,
  COST_HEATERS,
  COST_RADIO,
  TOTAL_SOLS,
  initialState,
  step,
  sunlight,
  type GameState,
  type Plan,
} from './dustStormModel'
import { BatteryCell, Ending, Lever, newsFor } from './LastLightHud'

const SOL_MS = 1500
const PHOTO = { clean: 'photos/selfie-clean.webp', dusty: 'photos/selfie-dusty.webp' }

type Phase = 'intro' | 'running' | 'paused' | 'over'

/** How much of the dusty photo shows: the model's dust share (0.1 at the start, at most 0.9) mapped to 0–1. */
const dustShown = (dust: number) => Math.min(1, Math.max(0, (dust - 0.05) / 0.65))
/** 0 = warm enough, 1 = frozen. Frost only starts once the warmth falls below 60. */
const coldShown = (warmth: number) => Math.min(1, Math.max(0, (60 - warmth) / 60))
/** 0 = clear sky, 1 = the darkest the storm gets. */
const stormShown = (sol: number) => (1 - sunlight(sol)) / 0.78

/**
 * "Last Light": keep Opportunity warm and powered through a dust storm.
 * Everything the player needs to know is in the picture: the dust on the real panels, the light, the frost.
 */
export default function LastLight() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<GameState>(initialState)
  const [plan, setPlan] = useState<Plan>({ heaters: true, radio: true })
  const [news, setNews] = useState('')
  const [delta, setDelta] = useState<{ sol: number; value: number } | null>(null)

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const gustRef = useRef<HTMLImageElement>(null)
  const wipeRef = useRef<HTMLSpanElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)
  const sentRef = useRef<HTMLSpanElement>(null)
  const endingRef = useRef<HTMLHeadingElement>(null)

  // The tick reads refs so each day is computed exactly once, outside React's render.
  const stateRef = useRef(state)
  const planRef = useRef(plan)
  planRef.current = plan
  const stormRef = useRef(0)
  const trauma = useRef(0)
  const [gameKey, setGameKey] = useState(0)

  // Scroll: the deck comes up out of the dark as the section arrives, scrubbed and reversible.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '[data-zoom]',
        { scale: 1.42 },
        { scale: 1.22, ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'top top', scrub: true } },
      )
    },
    { scope: rootRef },
  )

  // The days tick while the game runs.
  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      const prev = stateRef.current
      const next = step(prev, planRef.current)
      stateRef.current = next
      setState(next)
      onDay(prev, next)
      if (next.outcome !== 'playing') setPhase('over')
    }, SOL_MS)
    return () => window.clearInterval(id)
    // onDay only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Scrolling away or switching tabs pauses the storm, so nobody loses a game they weren't watching.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const pause = () => setPhase((p) => (p === 'running' ? 'paused' : p))
    const io = new IntersectionObserver(([e]) => e.intersectionRatio < 0.5 && pause(), { threshold: [0, 0.5, 1] })
    io.observe(root)
    const onVis = () => document.hidden && pause()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // The storm thickens the air in the dust field.
  useEffect(() => {
    stormRef.current = phase === 'intro' ? 0.05 : stormShown(state.sol)
  }, [phase, state.sol])

  // Camera shake from decaying trauma (visual only: the photo moves, nothing in the game does).
  function shake(amount: number) {
    if (prefersReducedMotion() || !shakeRef.current) return
    const was = trauma.current
    trauma.current = Math.min(1, was + amount)
    if (was > 0) return
    let t = 0
    let last = performance.now()
    const el = shakeRef.current
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      trauma.current = Math.max(0, trauma.current - 1.4 * dt)
      t += dt * 30
      const s = trauma.current * trauma.current
      el.style.transform = trauma.current
        ? `translate3d(${18 * s * Math.sin(t * 1.7)}px, ${12 * s * Math.sin(t * 2.3)}px, 0) rotate(${0.6 * s * Math.sin(t * 1.1)}deg)`
        : ''
      if (trauma.current > 0) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  /** Everything one day changes: the numbers, the news, and the feedback for gusts and packets. */
  function onDay(prev: GameState, next: GameState) {
    const reduced = prefersReducedMotion()
    const d = Math.round(next.battery) - Math.round(prev.battery)
    setDelta({ sol: next.sol, value: d })


    if (next.data > prev.data && sentRef.current && !reduced) {
      gsap.fromTo(sentRef.current, { scale: 1.25 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' })
    }

    if (next.gust) gust(dustShown(prev.dust))

    const line = newsFor(prev, next, planRef.current)
    if (line) setNews(line)

    if (next.outcome === 'no-power' || next.outcome === 'too-cold') signalLost()
  }

  /** A gust: the old, dustier picture is swept off left to right, the way the wind cleaned the real panels. */
  function gust(before: number) {
    const img = gustRef.current
    const line = wipeRef.current
    if (!img || !line) return
    shake(0.45)
    stormRef.current = Math.min(1, stormRef.current + 0.6)
    if (prefersReducedMotion()) return
    gsap.killTweensOf([img, line])
    gsap.set(img, { opacity: before, clipPath: 'inset(0 0 0 0%)' })
    gsap.to(img, { clipPath: 'inset(0 0 0 100%)', duration: 0.9, ease: 'power2.inOut' })
    gsap.fromTo(line, { left: '0%', opacity: 1 }, { left: '100%', duration: 0.9, ease: 'power2.inOut' })
    gsap.to(line, { opacity: 0, duration: 0.2, delay: 0.75 })
  }

  /** The picture stops arriving from the bottom up, in rows, like Opportunity's last picture. */
  function signalLost() {
    const el = curtainRef.current
    if (!el) return
    const reduced = prefersReducedMotion()
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: reduced ? 0 : 2.2, ease: 'steps(14)', delay: reduced ? 0 : 0.4 },
    )
  }

  function start() {
    gsap.killTweensOf(curtainRef.current)
    gsap.set(curtainRef.current, { clipPath: 'inset(100% 0 0 0)' })
    const fresh = initialState()
    stateRef.current = fresh
    setGameKey((k) => k + 1)
    setState(fresh)
    setPlan({ heaters: true, radio: true })
    setDelta(null)
    setNews('The sky is clear. A storm is building to the south.')
    setPhase('running')
  }

  useEffect(() => {
    if (phase === 'over') endingRef.current?.focus({ preventScroll: true })
  }, [phase])

  // Dev only: jump the game to any state, to check how each moment looks.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__lastLight = {
      set: (s: Partial<GameState>) => {
        stateRef.current = { ...stateRef.current, ...s }
        setState(stateRef.current)
      },
      gust: () => gust(dustShown(stateRef.current.dust)),
    }
  })

  const storm = phase === 'intro' ? 0 : stormShown(state.sol)
  const cold = coldShown(state.warmth)
  const dust = dustShown(state.dust)
  const lowBattery = state.battery < 20
  const spend = COST_CORE + (plan.heaters ? COST_HEATERS : 0) + (plan.radio ? COST_RADIO : 0)

  return (
    <section
      ref={rootRef}
      aria-label="Last Light, a dust storm game"
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-basalt"
    >
      {/* The deck. Zoom (scrubbed on scroll) and shake live on separate wrappers so they never fight. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div data-zoom="" className="absolute inset-0 will-change-transform" style={{ transform: 'scale(1.22)' }}>
          <div ref={shakeRef} className="absolute inset-0">
            <img src={PHOTO.clean} alt="" className="absolute inset-0 h-full w-full object-cover object-[10%_45%] lg:object-[50%_58%]" />
            <img
              src={PHOTO.dusty}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[10%_45%] lg:object-[50%_58%] transition-opacity duration-[1400ms] ease-linear"
              style={{ opacity: dust }}
            />
            <img
              ref={gustRef}
              src={PHOTO.dusty}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[10%_45%] lg:object-[50%_58%]"
              style={{ opacity: 0 }}
            />
          </div>
        </div>
        <span ref={wipeRef} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-sun opacity-0 shadow-[0_0_14px_rgb(0_0_0/0.5)]" />

        {/* Storm light: less sun, browner and darker */}
        <div
          className="absolute inset-0 bg-mars-storm transition-opacity duration-[1400ms] ease-linear"
          style={{ opacity: storm * 0.6 }}
        />
        {/* Cold: the colour drains, frost grows in from the edges */}
        <div
          className="absolute inset-0 bg-frost mix-blend-color transition-opacity duration-[1400ms] ease-linear"
          style={{ opacity: cold * 0.75 }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-linear"
          style={{
            opacity: cold,
            background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 40%, rgb(168 198 214 / 0.55) 78%, rgb(226 238 244 / 0.9) 100%)',
          }}
        />
        <DustField stormRef={stormRef} className="absolute inset-0 h-full w-full" />

        {/* Out of the story's dark at the top; dark ground for the controls at the bottom */}
        <div className="absolute inset-x-0 top-0 h-[30svh] bg-gradient-to-b from-basalt to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-basalt from-25% via-basalt/75 to-transparent lg:h-[52%]" />

        <div ref={curtainRef} className="absolute inset-0 bg-black" style={{ clipPath: 'inset(100% 0 0 0)' }} />
      </div>

      {/* The day of the storm, where the story kept its counter */}
      <p
        className={`absolute left-5 top-5 font-display text-[clamp(0.95rem,4.8vw,1.125rem)] font-bold leading-tight text-sun transition-opacity duration-500 md:left-10 md:text-lg lg:top-8 lg:text-2xl ${phase === 'intro' ? 'opacity-0' : 'opacity-100'}`}
      >
        Day <span className="tabular-nums">{state.sol}</span> of {TOTAL_SOLS}
        {phase === 'paused' && <span className="text-sun/70">, paused</span>}
      </p>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">
          {phase === 'intro' && <Intro onStart={start} />}

          {phase !== 'intro' && (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
              <div>
                {phase === 'over' ? (
                  <Ending state={state} headingRef={endingRef} onRetry={start} />
                ) : (
                  <p aria-live="polite" className="min-h-[2.8em] max-w-[34ch] text-base leading-snug text-sun sm:text-lg lg:text-xl">
                    {news}
                  </p>
                )}

                <div className={`mt-4 flex items-end gap-8 sm:gap-12 ${phase === 'over' ? 'hidden' : ''}`}>
                  <div>
                    <p className="relative inline-block font-display text-[clamp(3rem,13vw,5.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em]">
                      <BatteryCell value={state.battery} instantKey={gameKey} />
                      {delta && phase !== 'over' && (
                        <span
                          key={delta.sol}
                          aria-hidden="true"
                          className={`absolute -top-[0.3em] left-full ml-2 text-[0.32em] font-bold tabular-nums motion-safe:animate-[rise_1.1s_cubic-bezier(0.23,1,0.32,1)_forwards] ${delta.value >= 0 ? 'text-sun' : 'text-warn'}`}
                        >
                          {delta.value >= 0 ? '+' : '−'}
                          {Math.abs(delta.value)}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-base text-sun/80">
                      battery
                      {lowBattery ? (
                        <span className="font-bold text-warn">, low</span>
                      ) : (
                        delta && delta.value > 0 && <span className="text-sun">, charging</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-[clamp(2rem,8vw,3.25rem)] font-extrabold leading-[0.85] tabular-nums">
                      <span ref={sentRef} className="inline-block origin-bottom-left">
                        {state.data}
                      </span>
                    </p>
                    <p className="mt-2 text-base text-sun/80">sent home</p>
                  </div>
                </div>
              </div>

              {phase !== 'over' && (
                <div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[30rem]">
                    <Lever
                      label="Heaters"
                      cost={COST_HEATERS}
                      on={plan.heaters}
                      warn={cold > 0.45 && !plan.heaters ? 'Getting cold' : undefined}
                      onToggle={() => setPlan((p) => ({ ...p, heaters: !p.heaters }))}
                    />
                    <Lever
                      label="Radio"
                      cost={COST_RADIO}
                      on={plan.radio}
                      onToggle={() => setPlan((p) => ({ ...p, radio: !p.radio }))}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-sun/75 sm:text-base">
                      Using {spend} a day.<span className="hidden sm:inline"> The computer always uses {COST_CORE}.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setPhase((p) => (p === 'running' ? 'paused' : 'running'))}
                      className="min-h-11 shrink-0 rounded-full px-4 font-display text-lg font-bold text-sun underline decoration-sun/40 underline-offset-[6px] transition-[text-decoration-color,transform] duration-150 hover:decoration-sun active:scale-[0.97]"
                    >
                      {phase === 'running' ? 'Pause' : 'Keep going'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-[40rem]">
      <h2 className="text-[clamp(3rem,13vw,7rem)]">
        Your turn.
      </h2>
      <p className="mt-4 max-w-[36ch] text-lg leading-snug text-sun lg:text-xl">
        A dust storm is coming, and nobody can wipe the solar panels. Keep Opportunity warm and powered for {TOTAL_SOLS} days.
      </p>
      <p className="mt-3 max-w-[40ch] text-base text-sun/80">
        Heaters keep it warm. The radio sends science home. Both use power. The game's numbers are simpler than the real rover's.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-6 min-h-14 rounded-full bg-sun px-7 font-display text-xl font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]"
      >
        Start the storm
      </button>
    </div>
  )
}

