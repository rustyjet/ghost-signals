import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import DustField from '../DustField'
import { loadModelViewer } from '../../lib/modelViewer'
import { isNarrow, prefersReducedMotion } from '../../scroll/smoothScroll'

// "Lift off": spin Ingenuity's blades and hover at 3 metres. Lift grows with air density × speed²
// (NASA Glenn, the lift equation), so in air 100 times thinner the blades must spin 10 times faster.
// Game units, simplified on purpose; the screen says so.

const MARS_RPM = 2400 // blade speed that just lifts it in Mars air (NASA: "around 2,400 rpm")
const MAX_RPM = 2900
const SPIN_UP = 1100 // rpm per second while held
const SPIN_DOWN = 900 // rpm per second after letting go
const G = 3.7 // Mars gravity, m/s² (38% of Earth's)
const BAND = [2.5, 3.5] // the hover band, metres
const HOVER_GOAL = 3 // seconds inside the band
const HARD_LANDING = -1.6 // m/s
const DENSITY = { mars: 1, earth: 100 }

type Air = keyof typeof DENSITY
type ModelScene = { getObjectByName(name: string): { rotateX(a: number): void } | undefined; queueRender(): void }

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB')
const AIRS: Air[] = ['mars', 'earth']
// The blade speed that just lifts it: lift grows with density × speed², so thicker air needs less speed.
const liftRpm = (a: Air) => MARS_RPM / Math.sqrt(DENSITY[a])

type Motion = 'ground' | 'up' | 'hover' | 'down' | 'fast'
const MOTION: Record<Motion, { d: string; word: string }> = {
  ground: { d: 'M4 18 H20 M8 14 V18 M16 14 V18', word: 'On the ground' },
  up: { d: 'M12 19 V6 M6.5 11.5 L12 6 L17.5 11.5', word: 'Going up' },
  hover: { d: 'M5 9.5 H19 M5 14.5 H19', word: 'Hovering' },
  down: { d: 'M12 5 V18 M6.5 12.5 L12 18 L17.5 12.5', word: 'Coming down' },
  fast: { d: 'M12 4 V19 M5.5 12.5 L12 19 L18.5 12.5', word: 'Falling fast' },
}

// Air drawn as dots in a circle: a few for thin Mars air, packed for Earth air (a picture, not to scale).
const DOTS: Record<Air, [number, number][]> = {
  mars: [[9, 9.5], [15, 12.5], [10.5, 16]],
  earth: [[9, 7], [13, 6.5], [16.5, 9], [7, 10.5], [11, 10], [15, 11.5], [18, 13], [8, 14], [12, 13.5], [16, 15.5], [10, 17.5], [14, 18], [6.5, 14.5]],
}

function AirLabel({ air, done }: { air: Air; done: boolean }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-display text-base font-bold min-[380px]:gap-2">
      <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-5 w-5 shrink-0 ${done ? 'hidden min-[380px]:block' : ''}`}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.7" />
        {DOTS[air].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" fill="currentColor" />
        ))}
      </svg>
      {air === 'mars' ? 'Mars air' : 'Earth air'}
      {done && (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
          <path d="M5 12.5 L10 17 L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export default function RotorLift() {
  const [air, setAir] = useState<Air>('mars')
  const [news, setNews] = useState('Hold the button. The blades take a moment to speed up.')
  const [hovered, setHovered] = useState<Air[]>([])

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const farRef = useRef<HTMLDivElement>(null)
  const heliRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)
  const bandTimeRef = useRef<HTMLSpanElement>(null)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const altRef = useRef<HTMLSpanElement>(null)
  const rpmFillRef = useRef<HTMLSpanElement>(null)
  const motionRef = useRef<HTMLSpanElement>(null)
  const motionPathRef = useRef<SVGPathElement>(null)
  const motionWordRef = useRef<HTMLSpanElement>(null)
  const holdRef = useRef<HTMLButtonElement>(null)
  const bladeTopRef = useRef<SVGSVGElement>(null)
  const bladeLowRef = useRef<SVGSVGElement>(null)
  const blurDiscRef = useRef<HTMLSpanElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const mvRef = useRef<ModelViewerElement>(null)
  const stormRef = useRef(0)
  useEffect(() => void loadModelViewer(), [])

  const held = useRef(false)
  const airRef = useRef<Air>(air)
  airRef.current = air
  const sim = useRef({ rpm: 0, h: 0, v: 0, inBand: 0, airborne: false, liftRpm: 0, said: new Set<string>() })

  const liftPct = (liftRpm(air) / MAX_RPM) * 100

  function chooseAir(a: Air) {
    if (a === airRef.current) return
    setAir(a)
    sim.current.said.delete(`lift-${a}`)
    setNews(a === 'earth' ? 'Air as thick as Earth’s. Hold the button and watch the speed.' : 'Back to thin Mars air.')
  }

  function hold(on: boolean) {
    held.current = on
    if (holdRef.current) holdRef.current.dataset.held = String(on)
  }

  useEffect(() => {
    const root = rootRef.current
    const world = worldRef.current
    const heli = heliRef.current
    if (!root || !world || !heli) return
    const reduced = prefersReducedMotion()
    let k = 0 // pixels per metre
    let groundY = 0 // screen y of the ground at rest
    let topMargin = 0 // the camera follows only when the helicopter would pass this
    let raf = 0
    let last = 0
    let visible = false
    let trauma = 0
    let t = 0
    let bladeAngle = 0
    let motion: Motion = 'ground'
    let rotors: ReturnType<ModelScene['getObjectByName']>[] = []
    let scene: ModelScene | null = null

    const layout = () => {
      const narrow = isNarrow()
      const H = root.clientHeight
      // Phones: the ground sits just above the controls, wherever their top edge falls on this screen.
      const hudTop = hudRef.current?.offsetTop ?? H
      const ground = narrow ? Math.min(H * 0.4, hudTop - H * 0.02) : H * 0.64
      // Zoomed out far enough that the ground, the shadow and the 3 m band are all in view at the start:
      // the climb to the band happens on screen, and the camera only follows above it.
      k = narrow ? ground * 0.22 : H * 0.13
      groundY = ground
      topMargin = H * (narrow ? 0.03 : 0.05)
      root.style.setProperty('--k', `${k}px`)
      root.style.setProperty('--ground', `${ground}px`)
    }

    // The rotors are their own parts in NASA's model: find them once it has loaded.
    const findRotors = () => {
      const mv = mvRef.current
      if (!mv) return
      const sym = Object.getOwnPropertySymbols(mv).find((s) => s.description === 'scene')
      scene = sym ? ((mv as unknown as Record<symbol, ModelScene>)[sym] ?? null) : null
      rotors = scene ? [scene.getObjectByName('rotors_01'), scene.getObjectByName('rotors_02')].filter(Boolean) : []
    }
    mvRef.current?.addEventListener('load', findRotors)

    const say = (key: string, line: string, once = true) => {
      const s = sim.current
      if (once && s.said.has(key)) return
      s.said.add(key)
      setNews(line)
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0)
      last = now
      const s = sim.current
      const density = DENSITY[airRef.current]

      // Blades speed up while held and slow down after letting go.
      s.rpm = Math.min(MAX_RPM, Math.max(0, s.rpm + (held.current ? SPIN_UP : -SPIN_DOWN) * dt))
      const lift = density * (s.rpm / MARS_RPM) ** 2 // as a share of the helicopter's weight
      let a = Math.min(3, Math.max(-G, G * (lift - 1))) - 0.9 * s.v
      if (s.h > 8) a = Math.min(a, -1)
      if (s.h <= 0 && a < 0) a = 0
      // The speed at the moment it leaves the ground is the one worth reporting.
      if (s.h <= 0 && a > 0) s.liftRpm = s.rpm
      s.v += a * dt
      s.h += s.v * dt

      if (s.h <= 0) {
        if (s.airborne) {
          if (s.v < HARD_LANDING) {
            trauma = Math.min(1, trauma + 0.6)
            say('hard', 'Bump. A hard landing. Let go a little at a time to come down gently.', false)
          } else say('soft', 'Down gently. That is how Ingenuity landed.', false)
        }
        s.h = 0
        s.v = Math.max(0, s.v)
        s.airborne = false
      } else if (!s.airborne && s.h > 0.03) {
        s.airborne = true
        trauma = Math.min(1, trauma + 0.2)
        say(
          `lift-${airRef.current}`,
          airRef.current === 'mars'
            ? `Lift-off at ${fmt(s.liftRpm)} turns a minute. Now try to hover at 3 metres.`
            : `Lift-off at only ${fmt(s.liftRpm)} turns a minute. Thick air gives the blades much more to push against.`,
        )
      }
      if (!s.airborne && s.rpm > 1500 && airRef.current === 'mars') say('thin', 'Still on the ground. The air is too thin to push against. Keep holding.')
      if (s.h > BAND[1] + 1.5) say('high', 'Too high. Let go a little and it will sink.', true)

      // Hovering in the band counts up; drifting out drains it again, quickly but not all at once.
      const inside = s.h >= BAND[0] && s.h <= BAND[1]
      s.inBand = inside ? s.inBand + dt : Math.max(0, s.inBand - 2 * dt)
      if (bandTimeRef.current) bandTimeRef.current.textContent = s.inBand > 0.05 ? `, ${s.inBand.toFixed(1)} s` : ''
      if (bandRef.current) bandRef.current.dataset.inside = String(inside)
      if (s.inBand >= HOVER_GOAL) {
        const done = airRef.current
        setHovered((h) => (h.includes(done) ? h : [...h, done]))
        say(
          `hover-${done}`,
          done === 'mars'
            ? 'You hovered at 3 metres in Mars air. Ingenuity did that on 19 April 2021. Now switch to Earth air.'
            : 'Hovered in Earth air. Same blades, a tenth of the speed: that is what thin air costs.',
        )
      }

      // The camera follows only once the helicopter would pass the top of the screen; then the ground and the
      // height pole drop away. The far ground moves a fifth as fast, so more distant ground shows as it climbs.
      const heliTop = groundY - (1.05 + s.h) * k // the rotor top, not the frame top
      const cam = Math.max(0, topMargin - heliTop)
      trauma = Math.max(0, trauma - 1.4 * dt)
      t += dt * 30
      const shake = reduced ? 0 : trauma * trauma
      if (shakeRef.current)
        shakeRef.current.style.transform = shake ? `translate3d(${14 * shake * Math.sin(t * 1.7)}px, ${10 * shake * Math.sin(t * 2.3)}px, 0)` : ''
      world.style.transform = `translate3d(0, ${cam}px, 0)`
      // The band's label never sits among the words below: it hides once the band drops behind the controls
      const bandLabel = bandRef.current?.firstElementChild as HTMLElement | null
      if (bandLabel) {
        const bandY = groundY - 3 * k + cam
        const hudTop = hudRef.current?.offsetTop ?? Infinity
        bandLabel.style.opacity = bandY < hudTop - 16 ? '1' : '0'
      }
      if (farRef.current) farRef.current.style.transform = `translate3d(0, ${cam * 0.2}px, 0)`
      heli.style.transform = `translate3d(-50%, ${-s.h * k}px, 0)`
      if (shadowRef.current) {
        const sc = 1 / (1 + s.h * 0.35)
        shadowRef.current.style.transform = `translate(-50%, -50%) scale(${sc})`
        shadowRef.current.style.opacity = String(0.75 * sc)
      }
      if (rpmRef.current) rpmRef.current.textContent = fmt(s.rpm)
      // The button's rotors turn with the real ones (two blades each, turning opposite ways) and blur into a
      // disc as they speed up. Reduced motion: they stay put, only the disc shows the speed.
      const spin = s.rpm / MAX_RPM
      if (!reduced) bladeAngle = (bladeAngle + (s.rpm / MARS_RPM) * 1.6 * 360 * dt) % 360
      bladeTopRef.current?.style.setProperty('transform', `rotate(${bladeAngle}deg)`)
      bladeLowRef.current?.style.setProperty('transform', `rotate(${55 - bladeAngle}deg)`)
      const bladeAlpha = String(1 - 0.75 * spin)
      if (bladeTopRef.current) bladeTopRef.current.style.opacity = bladeAlpha
      if (bladeLowRef.current) bladeLowRef.current.style.opacity = String(0.6 * (1 - 0.75 * spin))
      if (blurDiscRef.current) blurDiscRef.current.style.opacity = String(Math.min(1, spin * 1.2))
      if (altRef.current) altRef.current.textContent = Math.max(0, s.h).toFixed(1)
      if (rpmFillRef.current) {
        rpmFillRef.current.style.transform = `scaleX(${s.rpm / MAX_RPM})`
        rpmFillRef.current.dataset.over = String(s.rpm >= liftRpm(airRef.current))
      }
      // What it is doing, with a little stickiness so the word does not flicker at the edges
      const v = s.v
      const was = motion
      if (!s.airborne) motion = 'ground'
      else if (v < HARD_LANDING * 0.75) motion = 'fast'
      else if (v > (was === 'up' ? 0.1 : 0.2)) motion = 'up'
      else if (v < (was === 'down' || was === 'fast' ? -0.1 : -0.2)) motion = 'down'
      else motion = 'hover'
      if (motion !== was && motionRef.current) {
        motionRef.current.dataset.motion = motion
        motionPathRef.current?.setAttribute('d', MOTION[motion].d)
        if (motionWordRef.current) motionWordRef.current.textContent = MOTION[motion].word
      }

      // Downwash kicks up dust near the ground.
      stormRef.current = (s.rpm / MAX_RPM) * Math.max(0, 1 - s.h / 2) * (airRef.current === 'mars' ? 1 : 0.5)

      // The blades turn: counter-rotating, at a speed the eye can follow.
      if (rotors.length && scene) {
        const turn = (s.rpm / MARS_RPM) * (reduced ? 1 : 4) * Math.PI * 2 * dt
        rotors.forEach((r) => r?.rotateX(turn))
        if (turn) scene.queueRender()
      }

      if (visible) raf = requestAnimationFrame(frame)
    }

    // Only run while on screen.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      } else hold(false)
    })
    io.observe(root)
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__rotor = { sim: sim.current, hold }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(root)
    if (hudRef.current) ro.observe(hudRef.current)
    return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
      mvRef.current?.removeEventListener('load', findRotors)
    }
  }, [])

  return (
    <section
      ref={rootRef}
      aria-label="Lift off, a helicopter game"
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-[linear-gradient(to_bottom,var(--color-mars-sky),var(--color-mars-horizon))]"
    >
      <div ref={shakeRef} aria-hidden="true" className="absolute inset-0">
        {/* Far crater floor: the same NASA photo at a finer scale, in haze. It moves a fifth as fast as the near
            ground, so as the helicopter climbs and the near ground drops away, more distant ground shows behind it. */}
        <div
          ref={farRef}
          className="absolute inset-x-0 top-[calc(var(--ground)-var(--k)*1.35)] h-[calc(100%-var(--ground)+var(--k)*1.35+40svh)] will-change-transform [mask-image:linear-gradient(to_bottom,transparent,black_5%)]"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgb(226 189 143 / 0.6), rgb(226 189 143 / 0.3) 35%, rgb(226 189 143 / 0.15)), url(photos/jezero-ground-wide.webp)',
            backgroundSize: 'auto, 42% auto',
            backgroundRepeat: 'no-repeat, repeat',
            backgroundPosition: 'top, top center',
          }}
        />
        <div ref={worldRef} className="absolute inset-0 will-change-transform">
          {/* Jezero crater floor. Its top edge is the far distance, so it starts above the ground line: the
              helicopter's feet stand inside the ground, not on its hazy horizon. */}
          <picture>
            <source media="(max-width: 1023px)" srcSet="photos/jezero-ground-narrow.webp" />
            <img
              src="photos/jezero-ground-wide.webp"
              alt=""
              className="absolute inset-x-0 top-[calc(var(--ground)-var(--k)*1.2)] h-[calc(100%-var(--ground)+var(--k)*1.2+40svh)] w-full object-cover object-top [mask-image:linear-gradient(to_bottom,transparent,black_6%)]"
            />
          </picture>

          {/* The hover band, 2.5 to 3.5 metres */}
          <div
            ref={bandRef}
            data-inside="false"
            className="group absolute inset-x-0 top-[calc(var(--ground)-var(--k)*3.5)] h-[var(--k)] border-y border-dashed border-ink/35 bg-ink/5 transition-colors duration-200 data-[inside=true]:border-solid data-[inside=true]:border-sun data-[inside=true]:bg-sun/25"
          >
            <p className="absolute right-5 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-ink md:right-10 lg:text-xl">
              3 m<span ref={bandTimeRef} className="tabular-nums" />
            </p>
          </div>

          {/* A height pole standing on the ground beside the helicopter: a mark every half metre, a number every
              metre. It belongs to the world, so once the camera follows, the marks slide past and the climb can be counted. */}
          <div className="absolute left-[calc(50%-var(--k)*1.55)] top-[calc(var(--ground)-var(--k)*8)] h-[calc(var(--k)*8)] w-[2px] rounded-full bg-ink/30 lg:left-[calc(54%-var(--k)*1.55)]">
            {Array.from({ length: 16 }, (_, i) => {
              const m = (i + 1) / 2
              const whole = Number.isInteger(m)
              return (
                <div key={m} className="absolute right-0 flex translate-y-1/2 items-center" style={{ bottom: `calc(var(--k) * ${m})` }}>
                  {whole && (
                    <span className={`mr-1.5 whitespace-nowrap font-display text-sm font-bold tabular-nums lg:text-base ${m === 3 ? 'text-ink' : 'text-ink/65'}`}>
                      {m} m
                    </span>
                  )}
                  <span className={`block rounded-full ${whole ? 'h-[2px] w-3.5 bg-ink/55' : 'h-px w-2 bg-ink/35'}`} />
                </div>
              )
            })}
          </div>

          <div
            ref={shadowRef}
            className="absolute left-1/2 top-[calc(var(--ground)+var(--k)*0.05)] h-[calc(var(--k)*0.4)] w-[calc(var(--k)*2)] rounded-[50%] bg-black/70 blur-[6px] lg:left-[54%]"
            style={{ transform: 'translate(-50%, -50%)', opacity: 0.75 }}
          />
          <div
            ref={heliRef}
            className="absolute left-1/2 top-[calc(var(--ground)-var(--k)*1.7)] h-[calc(var(--k)*2.4)] w-[calc(var(--k)*3.6)] lg:left-[54%]"
            style={{ transform: 'translate3d(-50%, 0, 0)' }}
          >
            <model-viewer
              ref={mvRef}
              src="models/ingenuity.glb"
              alt=""
              camera-orbit="25deg 84deg auto"
              field-of-view="17deg"
              interaction-prompt="none"
              disable-zoom=""
              exposure="1.05"
              tone-mapping="neutral"
              environment-image="neutral"
              style={{ width: '100%', height: '100%', background: 'transparent', pointerEvents: 'none' }}
            />
          </div>
        </div>
      </div>
      <DustField stormRef={stormRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-basalt from-40% via-basalt/80 to-transparent lg:h-[40%] lg:from-20% lg:via-basalt/70" />

      <div ref={hudRef} className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:pb-10">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
          <div>
            <h2 className="text-[clamp(2rem,9vw,5rem)] [@media(max-height:700px)_and_(max-width:1023px)]:hidden">Your turn.</h2>
            <p aria-live="polite" className="mt-2 min-h-[2.8em] max-w-[36ch] text-base leading-snug text-sun sm:text-lg lg:text-xl">
              {news}
            </p>
            {/* The speed carries a track with a lift-off mark for the air you are in (it slides when the air changes);
                the fill brightens once it passes. The height says what the helicopter is doing, and warns in orange
                (with the words) when it is coming down fast enough for a hard landing. */}
            <div className="mt-3 flex items-start gap-5 min-[380px]:gap-8 sm:gap-12">
              <p className="w-[clamp(6.25rem,30vw,12rem)] shrink-0">
                <span ref={rpmRef} className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
                  0
                </span>
                <span className="mt-2 block whitespace-nowrap text-base text-sun/80">turns a minute</span>
                <span aria-hidden="true" className="relative mt-2.5 block h-1.5 rounded-full bg-sun/20">
                  <span
                    ref={rpmFillRef}
                    data-over="false"
                    className="absolute inset-0 origin-left rounded-full bg-sun/60 transition-colors duration-200 data-[over=true]:bg-sun-bright"
                    style={{ transform: 'scaleX(0)' }}
                  />
                  <span
                    className="absolute -inset-y-1.5 w-[3px] -translate-x-1/2 rounded-full bg-sun-bright shadow-[0_0_0_2px_rgb(36_24_18/0.8)] transition-[left] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    style={{ left: `${liftPct}%` }}
                  />
                </span>
                <span aria-hidden="true" className="relative mt-1.5 block h-5">
                  <span
                    className="absolute top-0 whitespace-nowrap text-sm text-sun/80 transition-[left,transform] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                    style={{ left: `${liftPct}%`, transform: liftPct > 50 ? 'translateX(calc(-100% + 2px))' : 'translateX(-2px)' }}
                  >
                    lift-off
                  </span>
                </span>
              </p>
              <p>
                <span className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
                  <span ref={altRef}>0.0</span>
                  <span className="ml-[0.08em] text-[0.42em] font-bold tracking-normal">m</span>
                </span>
                <span className="mt-2 block text-base text-sun/80">off the ground</span>
                <span ref={motionRef} data-motion="ground" className="mt-2 flex items-center gap-1.5 whitespace-nowrap text-sm text-sun/80 data-[motion=fast]:font-bold data-[motion=fast]:text-warn">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
                    <path ref={motionPathRef} d={MOTION.ground.d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span ref={motionWordRef}>{MOTION.ground.word}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:w-[24rem]">
            {/* Narrow phones: once a side is done, its tick takes the place of the drawing so the words fit.
                Two sides, one cream thumb that slides. The thumb is a dark-lettered copy of the labels clipped to
                one half, so the lettering changes colour exactly at the thumb's edge as it slides. Each side draws
                its air: a few dots for thin Mars air, packed dots for Earth air. A tick marks a side you hovered in. */}
            <div
              role="radiogroup"
              aria-label="Air"
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
                e.preventDefault()
                const next: Air = air === 'mars' ? 'earth' : 'mars'
                chooseAir(next)
                e.currentTarget.querySelector<HTMLElement>(`[data-air="${next}"]`)?.focus()
              }}
              className="relative grid grid-cols-2 rounded-full bg-black/40 p-1 ring-1 ring-sun/20"
            >
              {AIRS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  data-air={a}
                  aria-checked={air === a}
                  tabIndex={air === a ? 0 : -1}
                  onClick={() => chooseAir(a)}
                  className="min-h-11 rounded-full px-1.5 text-sun/80 transition-[color,transform] duration-150 active:scale-[0.97] min-[380px]:px-3 [@media(hover:hover)_and_(pointer:fine)]:hover:text-sun"
                >
                  <AirLabel air={a} done={hovered.includes(a)} />
                  {hovered.includes(a) && <span className="sr-only"> (hovered)</span>}
                </button>
              ))}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-1 grid grid-cols-2 rounded-full bg-sun text-ink shadow-[0_2px_8px_rgb(0_0_0/0.35)] transition-[clip-path] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                style={{ clipPath: air === 'mars' ? 'inset(0 50% 0 0 round 999px)' : 'inset(0 0 0 50% round 999px)' }}
              >
                {AIRS.map((a) => (
                  <span key={a} className="grid min-h-11 place-items-center px-1.5 min-[380px]:px-3">
                    <AirLabel air={a} done={hovered.includes(a)} />
                  </span>
                ))}
              </div>
            </div>
            <button
              ref={holdRef}
              type="button"
              data-held="false"
              aria-describedby="rotor-help"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                hold(true)
              }}
              onPointerUp={() => hold(false)}
              onPointerCancel={() => hold(false)}
              onLostPointerCapture={() => hold(false)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  if (!e.repeat) hold(true)
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') hold(false)
              }}
              onBlur={() => hold(false)}
              onContextMenu={(e) => e.preventDefault()}
              className="group/hold mb-1.5 inline-flex min-h-14 touch-none select-none items-center justify-center gap-3 rounded-full bg-sun px-7 font-display text-xl font-extrabold text-ink shadow-[0_6px_0_rgb(150_118_80),0_10px_18px_rgb(0_0_0/0.35)] transition-[transform,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[held=true]:translate-y-[5px] data-[held=true]:bg-sun-bright data-[held=true]:shadow-[0_1px_0_rgb(150_118_80),0_2px_6px_rgb(0_0_0/0.3)] data-[held=true]:duration-75 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sun-bright lg:min-h-20 lg:gap-4 lg:text-2xl"
            >
              {/* Ingenuity's two rotors from above: they turn with the blades in the scene */}
              <span aria-hidden="true" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink lg:h-12 lg:w-12">
                <span
                  ref={blurDiscRef}
                  className="absolute inset-[3px] rounded-full bg-[radial-gradient(circle,rgb(242_226_194/0.15)_20%,rgb(242_226_194/0.5)_62%,rgb(242_226_194/0.12)_72%,transparent_74%)] opacity-0"
                />
                <svg ref={bladeLowRef} viewBox="-12 -12 24 24" className="absolute inset-[3px] opacity-60" style={{ transform: 'rotate(55deg)' }}>
                  <path d="M-10.5 0 L10.5 0" stroke="#f2e2c2" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                <svg ref={bladeTopRef} viewBox="-12 -12 24 24" className="absolute inset-[3px]">
                  <path d="M-10.5 0 L10.5 0" stroke="#f2e2c2" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                <span className="relative h-2 w-2 rounded-full bg-sun ring-2 ring-ink" />
              </span>
              Hold to spin
            </button>
            <p id="rotor-help" className="text-sm text-sun/70 sm:text-base">
              <span className="hidden lg:inline">The space bar works too. </span>The game&rsquo;s numbers are simpler than the real helicopter&rsquo;s.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
