import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, isNarrow, prefersReducedMotion } from '../../../scroll/smoothScroll'
import {
  COST_CORE,
  COST_DRIVE,
  COST_HEATERS,
  COST_RADIO,
  TOTAL_SOLS,
  initialState,
  step,
  sunlight,
  type GameState,
  type Plan,
} from '../dustStormModel'
import { BatteryCell, Ending, SentHome, Lever, newsFor } from '../LastLightHud'
import LastLight from '../LastLight'
import { RoverWorld, type DriveInput, type Status } from './RoverWorld'

/** A game day. Longer than the photo game's, so there is time to drive. */
const SOL_MS = 3000
const MODEL = 'models/opportunity.glb'

type Phase = 'intro' | 'running' | 'paused' | 'over'

const coldShown = (warmth: number) => Math.min(1, Math.max(0, (60 - warmth) / 60))
const stormShown = (sol: number) => (1 - sunlight(sol)) / 0.78

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** "Last Light", driven: steer NASA's Opportunity model across Mars while the storm comes in. */
export default function RoverGame() {
  const [failed, setFailed] = useState(() => !hasWebGL())
  const fail = useCallback(() => setFailed(true), [])
  if (failed) return <LastLight />
  return <Game onFail={fail} />
}

function Game({ onFail }: { onFail: () => void }) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<GameState>(initialState)
  const [plan, setPlan] = useState<Plan>({ heaters: true, radio: true })
  const [news, setNews] = useState('')
  const [delta, setDelta] = useState<{ sol: number; value: number } | null>(null)
  const [found, setFound] = useState(0) // rocks studied since the last sol
  const [loaded, setLoaded] = useState(false)
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)

  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)
  const endingRef = useRef<HTMLHeadingElement>(null)
  const worldRef = useRef<RoverWorld | null>(null)

  const stateRef = useRef(state)
  const planRef = useRef(plan)
  planRef.current = plan
  const foundRef = useRef(0)
  const [gameKey, setGameKey] = useState(0)
  const visibleRef = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const keys = useRef(new Set<string>())
  const stick = useRef<DriveInput | null>(null)
  const warnedIdle = useRef(false)

  // The world: built once, loads the model, falls back to the photo game if anything fails.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let world: RoverWorld
    try {
      world = new RoverWorld(
        canvas,
        {
          onStudied: () => {
            foundRef.current += 1
            setFound(foundRef.current)
            setNews(
              planRef.current.radio
                ? 'Rock studied. The radio will send it home.'
                : 'Rock studied. Switch the radio on to send it home.',
            )
          },
          onStatus: (s: Status) => {
            if (phaseRef.current !== 'running') return
            if (s === 'near') setNews('Stop here. The arm can reach the rock.')
            if (s === 'studying') setNews('Studying the rock. Keep still.')
          },
        },
        { reduced: prefersReducedMotion(), narrow: isNarrow() },
      )
    } catch {
      onFail()
      return
    }
    worldRef.current = world
    world.setPointer(pointerRef.current)
    world.load(MODEL).then(() => setLoaded(true), onFail)
    ;(window as unknown as Record<string, unknown>).__rover = import.meta.env.DEV ? world : undefined
    return () => {
      world.dispose()
      worldRef.current = null
    }
  }, [onFail])

  // Draw only while on screen and not paused; pause the game when it scrolls away or the tab hides.
  const syncRunning = useCallback(() => {
    worldRef.current?.setRunning(visibleRef.current && phaseRef.current !== 'paused' && !document.hidden)
  }, [])
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const pause = () => setPhase((p) => (p === 'running' ? 'paused' : p))
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting
        if (e.intersectionRatio < 0.5) pause()
        syncRunning()
      },
      { threshold: [0, 0.5, 1] },
    )
    io.observe(root)
    const onVis = () => {
      if (document.hidden) pause()
      syncRunning()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [syncRunning])
  useEffect(() => {
    syncRunning()
    worldRef.current?.setMode(phase === 'intro' ? 'intro' : phase === 'running' ? 'drive' : 'still')
  }, [phase, syncRunning])

  // What the scene shows follows the game state.
  useEffect(() => {
    worldRef.current?.setLook({
      storm: phase === 'intro' ? 0 : stormShown(state.sol),
      light: phase === 'intro' ? 1 : sunlight(state.sol),
      dust: state.dust,
      heaters: plan.heaters,
    })
  }, [phase, state.sol, state.dust, plan.heaters, loaded])

  // The days tick while the game runs.
  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      const prev = stateRef.current
      const world = worldRef.current
      const day = { drive: world?.takeDriveShare(SOL_MS / 1000) ?? 0, found: foundRef.current }
      foundRef.current = 0
      setFound(0)
      const next = step(prev, planRef.current, day)
      stateRef.current = next
      setState(next)
      onDay(prev, next)
      if (next.outcome !== 'playing') setPhase('over')
    }, SOL_MS)
    return () => window.clearInterval(id)
    // onDay only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function onDay(prev: GameState, next: GameState) {
    const world = worldRef.current
    setDelta({ sol: next.sol, value: Math.round(next.battery) - Math.round(prev.battery) })

    if (next.sent) {
      world?.sendPacket()
    }
    if (next.gust) world?.gust()

    let line = newsFor(prev, next, planRef.current)
    if (!line && next.sent) line = 'A finding left the antenna for Earth.'
    if (!line && planRef.current.radio && !next.sent && !warnedIdle.current) {
      warnedIdle.current = true
      line = 'The radio has nothing to send yet. Find a rock, or switch it off.'
    }
    if (line) setNews(line)

    if (next.outcome === 'no-power' || next.outcome === 'too-cold') signalLost()
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
    foundRef.current = 0
    warnedIdle.current = false
    setFound(0)
    setState(fresh)
    setPlan({ heaters: true, radio: true })
    setDelta(null)
    setNews('Drive to the marked rock and stop beside it. A storm is building to the south.')
    worldRef.current?.reset()
    worldRef.current?.takeDriveShare(1)
    setPhase('running')
    viewRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (phase === 'over') endingRef.current?.focus({ preventScroll: true })
  }, [phase])

  // Driving input: keys while the game has focus, or the touch stick.
  const pushInput = useCallback(() => {
    const k = keys.current
    const fromKeys: DriveInput = {
      throttle: (k.has('up') ? 1 : 0) - (k.has('down') ? 1 : 0),
      steer: (k.has('right') ? 1 : 0) - (k.has('left') ? 1 : 0),
    }
    worldRef.current?.setInput(stick.current ?? fromKeys)
  }, [])
  const keyName = (e: React.KeyboardEvent) =>
    ({ ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' })[
      e.code
    ]
  function onKeyDown(e: React.KeyboardEvent) {
    if (phase !== 'running' || e.altKey || e.ctrlKey || e.metaKey) return
    const k = keyName(e)
    if (!k) return
    e.preventDefault() // only while driving: the page doesn't scroll under the rover
    keys.current.add(k)
    pushInput()
  }
  function onKeyUp(e: React.KeyboardEvent) {
    const k = keyName(e)
    if (!k) return
    keys.current.delete(k)
    pushInput()
  }
  function releaseKeys() {
    keys.current.clear()
    pushInput()
  }

  // Dev only: jump the game to any state, to check how each moment looks.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__lastLight = {
      set: (s: Partial<GameState>) => {
        stateRef.current = { ...stateRef.current, ...s }
        setState(stateRef.current)
      },
      delta: (value: number) => setDelta({ sol: Math.random(), value }),
      gust: () => worldRef.current?.gust(),
      packet: () => worldRef.current?.sendPacket(),
    }
  })

  const cold = coldShown(state.warmth)
  const lowBattery = state.battery < 20
  const waiting = state.stored + found
  const spend = COST_CORE + (plan.heaters ? COST_HEATERS : 0) + (plan.radio ? COST_RADIO : 0)

  return (
    <section
      ref={rootRef}
      aria-label="Last Light, a dust storm driving game"
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) releaseKeys()
      }}
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-basalt [container-type:size]"
    >
      {/* The 3D view. Focusable, so the arrow keys drive only when the player chose to. */}
      <div
        ref={viewRef}
        tabIndex={phase === 'running' ? 0 : -1}
        role="application"
        aria-label="Opportunity on Mars. Arrow keys or W A S D drive."
        className="absolute inset-0 outline-none focus-visible:shadow-[inset_0_0_0_3px_var(--color-sun)]"
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
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
        {/* Out of the story's dark at the top; dark ground for the controls at the bottom */}
        <div className="absolute inset-x-0 top-0 h-[14svh] bg-gradient-to-b from-basalt to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-basalt from-20% via-basalt/70 to-transparent lg:h-[40%]" />

        {/* Points at the rock when it is off screen */}
        <div ref={pointerRef} className="absolute left-0 top-0 opacity-0 transition-opacity duration-200">
          <svg width="34" height="34" viewBox="0 0 34 34">
            <path d="M8 6 L28 17 L8 28 L13 17 Z" fill="var(--color-sun)" stroke="var(--color-basalt)" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>

        <div ref={curtainRef} className="absolute inset-0 bg-black" style={{ clipPath: 'inset(100% 0 0 0)' }} />
      </div>

      {/* The day of the storm, where the story kept its counter */}
      <p
        className={`absolute left-5 top-5 font-display text-[clamp(0.95rem,4.8vw,1.125rem)] font-bold leading-tight text-sun transition-opacity duration-500 md:left-10 md:text-lg lg:top-8 lg:text-2xl ${phase === 'intro' ? 'opacity-0' : 'opacity-100'}`}
      >
        Day <span className="tabular-nums">{state.sol}</span> of {TOTAL_SOLS}
        {phase === 'paused' && <span className="text-sun/70">, paused</span>}
      </p>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:pb-10 [&_button]:pointer-events-auto">
        <div className="mx-auto max-w-6xl">
          {phase === 'intro' && <Intro ready={loaded} onStart={start} />}

          {phase !== 'intro' && (
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
              <div className="relative">
                {phase === 'over' ? (
                  <Ending state={state} headingRef={endingRef} onRetry={start} />
                ) : (
                  <p aria-live="polite" className="min-h-[2.8em] max-w-[34ch] text-base leading-snug text-sun sm:text-lg lg:text-xl">
                    {news}
                  </p>
                )}

                <div className={`mt-4 flex items-end gap-6 sm:gap-12 ${phase === 'over' ? 'hidden' : ''}`}>
                  <div>
                    <p className="relative inline-block font-display text-[clamp(2.6rem,13vw,5.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em]">
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
                  <SentHome sent={state.data} waiting={waiting} radio={plan.radio} />
                </div>

                {/* The thumb stick rides above the words on the right, over the open ground */}
                {touch && phase === 'running' && (
                  <div className="absolute bottom-full right-0 mb-5 lg:right-auto lg:left-0">
                    <Stick
                      onChange={(v) => {
                        stick.current = v
                        pushInput()
                      }}
                    />
                  </div>
                )}
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
                    <Lever label="Radio" cost={COST_RADIO} on={plan.radio} onToggle={() => setPlan((p) => ({ ...p, radio: !p.radio }))} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-sun/75 sm:text-base">
                      Using {spend} a day, up to {spend + COST_DRIVE} driving.
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

function Intro({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  return (
    <div className="max-w-[40rem]">
      <h2 className="text-[clamp(3rem,13vw,7rem)]">Your turn.</h2>
      <p className="mt-4 max-w-[36ch] text-lg leading-snug text-sun lg:text-xl">
        A dust storm is coming. Drive Opportunity to the marked rocks, study them, and keep it warm and powered for {TOTAL_SOLS} days.
      </p>
      <p className="mt-3 max-w-[40ch] text-base text-sun/80">
        Driving, heaters and the radio all use power. Arrow keys or W A S D drive; on a phone, the stick. The game&rsquo;s numbers are
        simpler than the real rover&rsquo;s.
      </p>
      <button
        type="button"
        onClick={onStart}
        disabled={!ready}
        className="mt-6 min-h-14 rounded-full bg-sun px-7 font-display text-xl font-extrabold text-ink transition-[transform,opacity] duration-150 ease-out hover:bg-sun-bright active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"
      >
        {ready ? 'Start the storm' : 'Landing the rover'}
      </button>
    </div>
  )
}

/** A thumb stick. Up drives forward, sideways steers. Lets go: the rover rolls to a stop. */
function Stick({ onChange }: { onChange: (v: DriveInput | null) => void }) {
  const baseRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const id = useRef<number | null>(null)
  const R = 40

  function move(e: React.PointerEvent) {
    const base = baseRef.current
    if (!base) return
    const r = base.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx *= R / d
      dy *= R / d
    }
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    const dead = (v: number) => (Math.abs(v) < 0.18 ? 0 : v)
    onChange({ throttle: dead(-dy / R), steer: dead(dx / R) })
  }
  function end(e: React.PointerEvent) {
    if (e.pointerId !== id.current) return
    id.current = null
    if (knobRef.current) {
      knobRef.current.style.transition = 'transform 180ms cubic-bezier(0.23, 1, 0.32, 1)'
      knobRef.current.style.transform = ''
    }
    onChange(null)
  }

  return (
    <div
      ref={baseRef}
      aria-hidden="true"
      onPointerDown={(e) => {
        if (id.current !== null) return // one thumb at a time
        id.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        if (knobRef.current) knobRef.current.style.transition = 'none'
        move(e)
      }}
      onPointerMove={(e) => e.pointerId === id.current && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      className="pointer-events-auto relative ml-auto grid h-28 w-28 shrink-0 touch-none select-none place-items-center rounded-full bg-black/35 ring-1 ring-sun/30"
    >
      <div ref={knobRef} className="h-12 w-12 rounded-full bg-sun shadow-[0_4px_10px_rgb(0_0_0/0.45)]" />
    </div>
  )
}
