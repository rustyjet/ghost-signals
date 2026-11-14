import '@google/model-viewer'
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import DustField from '../DustField'
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

export default function RotorLift() {
  const [air, setAir] = useState<Air>('mars')
  const [news, setNews] = useState('Hold the button. The blades take a moment to speed up.')
  const [hovered, setHovered] = useState<Air[]>([])

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const heliRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const bandRef = useRef<HTMLDivElement>(null)
  const bandTimeRef = useRef<HTMLSpanElement>(null)
  const rpmRef = useRef<HTMLSpanElement>(null)
  const altRef = useRef<HTMLSpanElement>(null)
  const holdRef = useRef<HTMLButtonElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const mvRef = useRef<ModelViewerElement>(null)
  const stormRef = useRef(0)

  const held = useRef(false)
  const airRef = useRef<Air>(air)
  airRef.current = air
  const sim = useRef({ rpm: 0, h: 0, v: 0, inBand: 0, airborne: false, liftRpm: 0, said: new Set<string>() })

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
    let raf = 0
    let last = 0
    let visible = false
    let trauma = 0
    let t = 0
    let rotors: ReturnType<ModelScene['getObjectByName']>[] = []
    let scene: ModelScene | null = null

    const layout = () => {
      const narrow = isNarrow()
      const H = root.clientHeight
      // Phones: the ground sits just above the controls, wherever their top edge falls on this screen.
      const hudTop = hudRef.current?.offsetTop ?? H
      const ground = narrow ? Math.min(H * 0.4, hudTop - H * 0.02) : H * 0.64
      k = narrow ? Math.min(H * 0.2, ground * 0.5) : H * 0.32
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

      // The camera follows above 1.2 m, so the ground drops away as it climbs.
      const cam = Math.max(0, s.h - 1.2)
      trauma = Math.max(0, trauma - 1.4 * dt)
      t += dt * 30
      const shake = reduced ? 0 : trauma * trauma
      if (shakeRef.current)
        shakeRef.current.style.transform = shake ? `translate3d(${14 * shake * Math.sin(t * 1.7)}px, ${10 * shake * Math.sin(t * 2.3)}px, 0)` : ''
      world.style.transform = `translate3d(0, ${cam * k}px, 0)`
      heli.style.transform = `translate3d(-50%, ${-s.h * k}px, 0)`
      if (shadowRef.current) {
        const sc = 1 / (1 + s.h * 0.35)
        shadowRef.current.style.transform = `translate(-50%, -50%) scale(${sc})`
        shadowRef.current.style.opacity = String(0.55 * sc)
      }
      if (rpmRef.current) rpmRef.current.textContent = fmt(s.rpm)
      if (altRef.current) altRef.current.textContent = `${Math.max(0, s.h).toFixed(1)} m`

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
        <div ref={worldRef} className="absolute inset-0 will-change-transform">
          {/* Jezero crater floor */}
          <picture>
            <source media="(max-width: 1023px)" srcSet="photos/jezero-ground-narrow.webp" />
            <img
              src="photos/jezero-ground-wide.webp"
              alt=""
              className="absolute inset-x-0 top-[var(--ground)] h-[calc(100%-var(--ground)+40svh)] w-full object-cover object-top [mask-image:linear-gradient(to_bottom,transparent,black_6%)]"
            />
          </picture>

          {/* The hover band, 2.5 to 3.5 metres */}
          <div
            ref={bandRef}
            data-inside="false"
            className="group absolute inset-x-0 top-[calc(var(--ground)-var(--k)*3.5)] h-[var(--k)] border-y border-dashed border-ink/35 bg-ink/5 transition-colors duration-200 data-[inside=true]:border-solid data-[inside=true]:border-sun data-[inside=true]:bg-sun/25"
          >
            <p className="absolute left-5 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-ink md:left-10 lg:text-xl">
              3 m<span ref={bandTimeRef} className="tabular-nums" />
            </p>
          </div>

          <div
            ref={shadowRef}
            className="absolute left-1/2 top-[calc(var(--ground)+var(--k)*0.05)] h-[calc(var(--k)*0.22)] w-[calc(var(--k)*1.1)] rounded-[50%] bg-black/70 blur-[6px] lg:left-[54%]"
            style={{ transform: 'translate(-50%, -50%)', opacity: 0.55 }}
          />
          <div
            ref={heliRef}
            className="absolute left-1/2 top-[calc(var(--ground)-var(--k)*0.85)] h-[calc(var(--k)*1.2)] w-[calc(var(--k)*1.8)] lg:left-[54%]"
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
            <div className="mt-3 flex items-end gap-8 sm:gap-12">
              <p>
                <span ref={rpmRef} className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
                  0
                </span>
                <span className="mt-2 block text-base text-sun/80">turns a minute</span>
              </p>
              <p>
                <span ref={altRef} className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
                  0.0 m
                </span>
                <span className="mt-2 block text-base text-sun/80">off the ground</span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:w-[24rem]">
            <div role="radiogroup" aria-label="Air" className="grid grid-cols-2 gap-1 rounded-full bg-black/40 p-1 ring-1 ring-sun/20">
              {(['mars', 'earth'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={air === a}
                  onClick={() => {
                    setAir(a)
                    sim.current.said.delete(`lift-${a}`)
                    setNews(a === 'earth' ? 'Air as thick as Earth’s. Hold the button and watch the speed.' : 'Back to thin Mars air.')
                  }}
                  className={`min-h-11 rounded-full px-4 font-display text-base font-bold transition-[background-color,color,transform] duration-150 active:scale-[0.97] ${air === a ? 'bg-sun text-ink' : 'text-sun/80 hover:text-sun'}`}
                >
                  {a === 'mars' ? 'Mars air' : 'Earth air'}
                  {hovered.includes(a) && <span className="sr-only"> (hovered)</span>}
                </button>
              ))}
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
              className="min-h-14 touch-none select-none rounded-full bg-sun px-7 font-display text-xl font-extrabold text-ink transition-[transform,background-color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[held=true]:scale-[0.97] data-[held=true]:bg-[#fff1d6] lg:min-h-20 lg:text-2xl"
            >
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
