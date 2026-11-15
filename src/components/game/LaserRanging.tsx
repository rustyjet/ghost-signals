import { useEffect, useRef, useState } from 'react'
import { isNarrow, prefersReducedMotion } from '../../scroll/smoothScroll'
import { Key } from './Key'
import { StageHeading } from './StageHeading'

// "Find the mirrors": fire a laser at the Moon and wait for the light to come back.
// The picture is NASA SVS's LRO near-side Moon with NASA's own numbered Apollo landing sites; the site
// positions below are NASA's dots on that frame (checked against the published coordinates, docs/FACTS.md).
// Real numbers: the round trip takes about 2.5 s and the Moon is about 385,000 km away (NASA). Mirrors
// were left by Apollo 11, 14 (100 corner cubes each) and 15 (300). How often light comes back is a game
// number, far kinder than the real 1 in 25 million; the screen says so.

const TRIP = 2.5 // seconds there and back
const HALF = TRIP / 2
const HIT = 0.03 // how close to a site's dot counts, as a share of the picture's width
const DISC = { x: 0.5, y: 0.5, r: 0.4808 } // the Moon's disc in the picture

interface Site {
  n: number
  x: number
  y: number
  /** Corner cubes left there (NASA). 0: no mirrors. */
  cubes: number
}
const SITES: Site[] = [
  { n: 11, x: 0.6755, y: 0.476, cubes: 100 },
  { n: 12, x: 0.2915, y: 0.5085, cubes: 0 },
  { n: 14, x: 0.3385, y: 0.5125, cubes: 100 },
  { n: 15, x: 0.511, y: 0.2705, cubes: 300 },
  { n: 16, x: 0.6115, y: 0.5565, cubes: 0 },
  { n: 17, x: 0.7175, y: 0.3175, cubes: 0 },
]
const MIRRORS = SITES.filter((s) => s.cubes > 0).length
/** Game odds that light comes back from a pulse that reached a site's mirrors: more mirrors, more light. */
const odds = (s: Site) => (s.cubes >= 300 ? 0.7 : 0.35)

type Target = { kind: 'site'; site: Site } | { kind: 'ground' } | { kind: 'space' }
interface Pulse {
  t0: number
  at: { x: number; y: number }
  target: Target
  back: boolean
  arrived: boolean
}

function targetAt(x: number, y: number): Target {
  let best: Site | null = null
  let bestD = HIT
  for (const s of SITES) {
    const d = Math.hypot(s.x - x, s.y - y)
    if (d < bestD) {
      best = s
      bestD = d
    }
  }
  if (best) return { kind: 'site', site: best }
  return Math.hypot(x - DISC.x, y - DISC.y) < DISC.r ? { kind: 'ground' } : { kind: 'space' }
}

/**
 * One mirror site in the "Mirrors found" row: the panel of corner cubes it left, drawn as dots (a picture, not to
 * scale: Apollo 15's 300 are drawn three times as many as the 100 at 11 and 14). Found: green, with its Apollo
 * number; the cubes light up in a quick wave when light comes back (again on every catch from it). Not found yet:
 * a dashed panel with a question mark, the same for every slot so it gives nothing away.
 */
function MirrorSlot({ site, catchId }: { site?: Site; catchId: number }) {
  const PITCH = 6.5
  if (!site)
    return (
      <span className="flex flex-col items-center gap-1.5">
        <span className="grid h-[40.5px] w-[34px] place-items-center rounded-[5px] border-2 border-dashed border-sun/35 font-display text-sm font-bold text-sun/50">
          ?
        </span>
        <span className="text-sm leading-none text-transparent">.</span>
      </span>
    )
  const cols = site.cubes >= 300 ? 12 : 4
  const rows = 5
  const w = cols * PITCH + 8
  const h = rows * PITCH + 8
  return (
    <span className="flex flex-col items-center gap-1.5">
      <svg key={catchId} viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible">
        <rect x="1" y="1" width={w - 2} height={h - 2} rx="4" fill="rgb(109 255 142 / 0.1)" stroke="var(--color-laser)" strokeWidth="2" />
        {Array.from({ length: cols * rows }, (_, i) => {
          const c = i % cols
          const r = Math.floor(i / cols)
          return (
            <circle
              key={i}
              cx={4 + PITCH / 2 + c * PITCH}
              cy={4 + PITCH / 2 + r * PITCH}
              r="2"
              fill="var(--color-laser)"
              className="opacity-85 motion-safe:animate-[cube-lit_520ms_ease-out_both]"
              style={{ animationDelay: `${(c + r) * 22}ms` }}
            />
          )
        })}
      </svg>
      <span className="whitespace-nowrap text-sm font-bold leading-none text-laser">Apollo {site.n}</span>
    </span>
  )
}

/** What a pulse fired here would hit, in a few words */
const aimName = (x: number, y: number) => {
  const t = targetAt(x, y)
  return t.kind === 'site' ? `Apollo ${t.site.n}` : t.kind === 'ground' ? 'bare ground' : 'empty space'
}

const where = (x: number, y: number) => {
  const t = targetAt(x, y)
  return t.kind === 'site' ? `Aiming at Apollo ${t.site.n}.` : t.kind === 'ground' ? 'Aiming at bare ground.' : 'Aiming past the Moon.'
}

export default function LaserRanging() {
  const [news, setNews] = useState('Each number marks where an Apollo crew landed. Start with 11: that is where Eagle left its mirrors.')
  const [found, setFound] = useState<number[]>([])
  // Each catch from a site lights its panel again
  const [catches, setCatches] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState(false)
  const [aim, setAim] = useState({ x: 0.5, y: 0.5 })
  const [aimSaid, setAimSaid] = useState('')
  // The hint follows what you are doing: pointing with a mouse, aiming with keys, or waiting for the light
  const [pointing, setPointing] = useState(false)
  const [keying, setKeying] = useState(false)
  const [mouse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const moonRef = useRef<HTMLDivElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const clockRef = useRef<HTMLSpanElement>(null)
  const distRef = useRef<HTMLSpanElement>(null)
  const clockBoxRef = useRef<HTMLSpanElement>(null)
  const outFillRef = useRef<HTMLSpanElement>(null)
  const backFillRef = useRef<HTMLSpanElement>(null)
  const backTrackRef = useRef<HTMLSpanElement>(null)
  const traceRef = useRef<SVGLineElement>(null)
  const headRef = useRef<SVGLineElement>(null)
  const photonRef = useRef<SVGCircleElement>(null)
  const splashRef = useRef<SVGCircleElement>(null)
  const catchRef = useRef<SVGCircleElement>(null)
  const gradRef = useRef<SVGLinearGradientElement>(null)

  const pulse = useRef<Pulse | null>(null)
  const misses = useRef(new Map<number, number>())
  const foundRef = useRef<number[]>([])
  const aimRef = useRef(aim)
  aimRef.current = aim
  const kick = useRef<() => void>(() => {})

  function fire(at = aimRef.current) {
    if (pulse.current) return
    const target = targetAt(at.x, at.y)
    let back = false
    if (target.kind === 'site' && target.site.cubes > 0) {
      // A little mercy: the third empty pulse in a row at the same mirrors always comes back.
      const m = misses.current.get(target.site.n) ?? 0
      back = m >= 2 || Math.random() < odds(target.site)
      misses.current.set(target.site.n, back ? 0 : m + 1)
    }
    pulse.current = { t0: performance.now(), at, target, back, arrived: false }
    setBusy(true)
    setNews('Fired. The light is on its way to the Moon.')
    if (distRef.current) {
      distRef.current.textContent = '?'
      distRef.current.dataset.wait = 'true'
    }
    if (clockBoxRef.current) clockBoxRef.current.dataset.run = 'true'
    outFillRef.current?.style.setProperty('transform', 'scaleX(0)')
    backFillRef.current?.style.setProperty('transform', 'scaleX(0)')
    if (backTrackRef.current) backTrackRef.current.dataset.lost = 'false'
    kick.current()
  }

  function finish(p: Pulse) {
    const t = p.target
    if (p.back && t.kind === 'site') {
      const n = t.site.n
      // The distance comes from the time: it counts up to 385,000 as the light lands, then pops
      const dist = distRef.current
      if (dist) {
        dist.dataset.wait = 'false'
        const pop = () => dist.animate([{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
        if (prefersReducedMotion()) dist.textContent = '385,000'
        else {
          const t0 = performance.now()
          const count = (now: number) => {
            const k = Math.min(1, (now - t0) / 650)
            const v = 385000 * (1 - (1 - k) ** 3)
            dist.textContent = (Math.round(v / 1000) * 1000).toLocaleString('en-GB')
            if (k < 1) requestAnimationFrame(count)
            else pop()
          }
          requestAnimationFrame(count)
        }
      }
      setCatches((c) => ({ ...c, [n]: (c[n] ?? 0) + 1 }))
      const first = !foundRef.current.includes(n)
      const all = first && foundRef.current.length + 1 === MIRRORS
      if (first) {
        foundRef.current = [...foundRef.current, n]
        setFound(foundRef.current)
      }
      setNews(
        all
          ? 'All three found. Real lasers have it far harder: only 1 bit of light in 25 million even reaches Eagle’s mirrors.'
          : !first
            ? 'Light came back again, 2.5 seconds later.'
            : n === 11
              ? 'Light came back after 2.5 seconds, so the Moon is about 385,000 km away. Two more crews left mirrors. Can you find them?'
              : n === 15
                ? 'Apollo 15 left mirrors too: 300 of them, so light comes back more often.'
                : 'Apollo 14 left 100 mirrors, just like Eagle’s.',
      )
    } else if (t.kind === 'site' && t.site.cubes > 0) {
      setNews(`The light reached Apollo ${t.site.n}’s mirrors, but none of it made it back this time. Fire again.`)
    } else if (t.kind === 'site') {
      setNews(`Apollo ${t.site.n} left no mirrors. Nothing came back.`)
    } else if (t.kind === 'ground') {
      setNews('No mirrors there. Nothing came back.')
    } else {
      setNews('That pulse missed the Moon and flew off into space.')
    }
    if (distRef.current && !(p.back && t.kind === 'site')) distRef.current.dataset.wait = 'false'
    if (clockBoxRef.current) clockBoxRef.current.dataset.run = 'false'
    pulse.current = null
    setBusy(false)
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = prefersReducedMotion()
    let raf = 0
    let visible = false
    let trauma = 0
    let last = 0
    let t = 0

    /** Station (where the beam leaves Earth) and target, in section pixels. */
    const geometry = (at: { x: number; y: number }) => {
      const r = root.getBoundingClientRect()
      const m = moonRef.current!.getBoundingClientRect()
      const cx = m.left - r.left + m.width / 2
      // Phones: the beam comes up from just under the Moon, above the words. Wide screens: from the bottom edge.
      const oy = isNarrow() ? Math.min(m.bottom - r.top, (hudRef.current?.offsetTop ?? r.height) - 8) : r.height
      return {
        ox: cx,
        oy,
        tx: m.left - r.left + at.x * m.width,
        ty: m.top - r.top + at.y * m.height,
      }
    }

    const set = (el: SVGElement | null, attrs: Record<string, number | string>) => {
      if (el) for (const k in attrs) el.setAttribute(k, String(attrs[k]))
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0)
      last = now
      const p = pulse.current
      if (p) {
        const e = (now - p.t0) / 1000
        const g = geometry(p.at)
        if (clockRef.current) clockRef.current.textContent = Math.min(e, TRIP).toFixed(2)
        // The stopwatch's two legs: out to the Moon, then back (or, if nothing comes back, a dashed empty leg)
        outFillRef.current?.style.setProperty('transform', `scaleX(${Math.min(1, e / HALF)})`)
        backFillRef.current?.style.setProperty('transform', `scaleX(${p.back ? Math.min(1, Math.max(0, (e - HALF) / HALF)) : 0})`)
        if (backTrackRef.current && !p.back && e >= HALF) backTrackRef.current.dataset.lost = 'true'
        set(gradRef.current, { x1: g.ox, y1: g.oy, x2: g.tx, y2: g.ty })
        set(traceRef.current, { x1: g.ox, y1: g.oy, x2: g.tx, y2: g.ty, opacity: 0.22 })
        const lerp = (k: number) => ({ x: g.ox + (g.tx - g.ox) * k, y: g.oy + (g.ty - g.oy) * k })
        if (e < HALF) {
          // Out: a short bright pulse climbs the trace. Reduced motion: the whole beam shows at once.
          const k = e / HALF
          const a = reduced ? { x: g.ox, y: g.oy } : lerp(Math.max(0, k - 0.14))
          const b = reduced ? { x: g.tx, y: g.ty } : lerp(k)
          set(headRef.current, { x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity: 1 })
        } else {
          set(headRef.current, { opacity: 0 })
          if (!p.arrived) {
            p.arrived = true
            set(splashRef.current, { cx: g.tx, cy: g.ty })
            splashRef.current?.animate(
              [
                { opacity: 0.9, transform: 'scale(0.6)' },
                { opacity: 0, transform: 'scale(1.6)' },
              ],
              { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
            )
          }
          // Back: one dot of light, if any, falls home along the same line.
          if (p.back && e < TRIP) {
            const c = reduced ? { x: g.tx, y: g.ty } : lerp(1 - (e - HALF) / HALF)
            set(photonRef.current, { cx: c.x, cy: c.y, opacity: 1 })
          } else set(photonRef.current, { opacity: 0 })
        }
        if (e >= TRIP) {
          set(traceRef.current, { opacity: 0 })
          set(photonRef.current, { opacity: 0 })
          if (clockRef.current) clockRef.current.textContent = TRIP.toFixed(2)
          if (p.back) {
            trauma = Math.min(1, trauma + 0.35)
            set(catchRef.current, { cx: g.ox, cy: g.oy })
            catchRef.current?.animate(
              [
                { opacity: 1, transform: 'scale(0.5)' },
                { opacity: 0, transform: 'scale(2.2)' },
              ],
              { duration: 600, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
            )
          }
          finishRef.current(p)
        }
      }

      // The catch shakes the view a little: trauma², summed sines, decaying.
      trauma = Math.max(0, trauma - 1.6 * dt)
      t += dt * 30
      const shake = reduced ? 0 : trauma * trauma
      if (shakeRef.current)
        shakeRef.current.style.transform = shake ? `translate3d(${10 * shake * Math.sin(t * 1.7)}px, ${7 * shake * Math.sin(t * 2.3)}px, 0)` : ''

      if (visible && (pulse.current || trauma > 0)) raf = requestAnimationFrame(frame)
      else raf = 0
    }

    kick.current = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    // Only run while on screen; a pulse in flight finishes when the game comes back into view.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick.current()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)

    // Phones: the Moon fills the space above the words, never under them, measured from where the words start.
    const layout = () => {
      const hudTop = hudRef.current?.offsetTop ?? root.clientHeight
      const size = Math.min(root.clientWidth * 1.12, hudTop - root.clientHeight * 0.01 - 12)
      root.style.setProperty('--moon', `${Math.max(160, size)}px`)
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(root)
    if (hudRef.current) ro.observe(hudRef.current)

    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__laser = { pulse, fire, misses }
    return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aimAt(x: number, y: number) {
    const a = { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
    aimRef.current = a
    setAim(a)
    return a
  }

  const pointerAt = (e: React.PointerEvent | React.MouseEvent) => {
    const m = moonRef.current!.getBoundingClientRect()
    return { x: (e.clientX - m.left) / m.width, y: (e.clientY - m.top) / m.height }
  }

  return (
    <section
      ref={rootRef}
      aria-label="Find the mirrors, a laser game"
      className="relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-black"
    >
      <div ref={shakeRef} className="absolute inset-0">
        <div
          ref={moonRef}
          role="application"
          tabIndex={0}
          aria-label="The Moon. Tap a spot, or aim with the arrow keys, then press Enter to fire."
          aria-describedby="laser-aim"
          onClick={(e) => fire(aimAt(pointerAt(e).x, pointerAt(e).y))}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' && !pulse.current) aimAt(pointerAt(e).x, pointerAt(e).y)
          }}
          onPointerEnter={(e) => e.pointerType === 'mouse' && setPointing(true)}
          onPointerLeave={() => setPointing(false)}
          onFocus={(e) => setKeying(e.currentTarget.matches(':focus-visible'))}
          onBlur={() => setKeying(false)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 0.05 : 0.01
            const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
            if (d) {
              e.preventDefault()
              const a = aimAt(aimRef.current.x + d[0], aimRef.current.y + d[1])
              setAimSaid(where(a.x, a.y))
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!e.repeat) fire()
            }
          }}
          className={`absolute left-1/2 top-[1svh] aspect-square w-[var(--moon,min(112vw,62svh))] -translate-x-1/2 ${busy ? 'cursor-progress' : 'cursor-crosshair'} rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-4 focus-visible:ring-offset-black lg:left-auto lg:right-[3vw] lg:top-1/2 lg:h-[min(96svh,60vw)] lg:w-auto lg:-translate-y-1/2 lg:translate-x-0`}
        >
          <img
            src="photos/moon-near.webp"
            width={2000}
            height={2000}
            alt="The near side of the Moon. NASA's numbers mark the six Apollo landing sites: 11, 12, 14, 15, 16 and 17."
            draggable={false}
            className="pointer-events-none h-full w-full select-none"
          />
          {/* Mirrors that have sent light back stay marked */}
          {SITES.filter((s) => found.includes(s.n)).map((s) => (
            <span
              key={s.n}
              aria-hidden="true"
              className="pointer-events-none absolute aspect-square w-[3.2%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-laser bg-laser/30 shadow-[0_1px_3px_rgb(0_0_0/0.75)]"
              style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }}
            />
          ))}
          {/* The aim: where the next pulse will land */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute aspect-square w-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-laser shadow-[0_1px_3px_rgb(0_0_0/0.75),inset_0_1px_3px_rgb(0_0_0/0.75)]"
            style={{ left: `${aim.x * 100}%`, top: `${aim.y * 100}%` }}
          >
            <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-laser shadow-[0_0_0_1.5px_rgb(0_0_0/0.6)]" />
          </span>
        </div>

        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            {/* The beam fades in from the station, so it never starts at a hard edge */}
            <linearGradient ref={gradRef} id="laser-beam" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--color-laser)" stopOpacity="0" />
              <stop offset="0.18" stopColor="var(--color-laser)" />
            </linearGradient>
          </defs>
          {/* Each green mark sits on a dark casing, so it still reads on the bright Moon */}
          <line ref={traceRef} stroke="url(#laser-beam)" strokeWidth="2" opacity="0" />
          <line ref={headRef} stroke="url(#laser-beam)" strokeWidth="4" strokeLinecap="round" opacity="0" style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.7))' }} />
          <circle ref={splashRef} r="18" fill="none" stroke="var(--color-laser)" strokeWidth="3" opacity="0" style={{ transformBox: 'fill-box', transformOrigin: 'center', filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.7))' }} />
          <circle ref={photonRef} r="5" fill="var(--color-laser)" stroke="rgb(0 0 0 / 0.6)" strokeWidth="2" opacity="0" />
          <circle ref={catchRef} r="14" fill="var(--color-laser)" opacity="0" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        </svg>
      </div>

      <div ref={hudRef} className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:inset-y-0 lg:right-auto lg:flex lg:w-[min(36rem,36vw)] lg:flex-col lg:justify-end lg:pb-12">
        {/* The heading is how the hunt is going */}
        <StageHeading
          text={['Find the mirrors.', 'Two more to find.', 'One more to find.', 'All three found.'][found.length] ?? 'All three found.'}
          className="text-[clamp(2rem,min(9vw,8svh),5rem)] [@media(max-height:760px)_and_(max-width:1023px)]:hidden"
        />
        <p aria-live="polite" className="mt-2 min-h-[4.2em] max-w-[36ch] text-base leading-snug text-sun sm:text-lg lg:mt-4 lg:text-xl">
          {news}
        </p>
        <p id="laser-aim" className="sr-only" aria-live="polite">
          {aimSaid}
        </p>
        <div className="mt-3 flex items-end gap-8 sm:gap-12 lg:mt-6">
          <p>
            <span
              ref={clockBoxRef}
              data-run="false"
              className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums transition-colors duration-200 data-[run=true]:text-laser"
            >
              <span ref={clockRef}>0.00</span>
              <span className="ml-[0.12em] text-[0.36em] font-bold tracking-normal">s</span>
            </span>
            <span className="mt-2 block text-base text-sun/80">there and back</span>
            {/* Two legs: out to the Moon, then back home */}
            <span aria-hidden="true" className="mt-2.5 flex h-1.5 gap-1.5">
              <span className="relative flex-1 overflow-hidden rounded-full bg-sun/20">
                <span ref={outFillRef} className="absolute inset-0 origin-left rounded-full bg-laser" style={{ transform: 'scaleX(0)' }} />
              </span>
              <span
                ref={backTrackRef}
                data-lost="false"
                className="relative flex-1 overflow-hidden rounded-full bg-sun/20 data-[lost=true]:bg-transparent data-[lost=true]:bg-[repeating-linear-gradient(90deg,rgb(242_226_194/0.35)_0_5px,transparent_5px_9px)]"
              >
                <span ref={backFillRef} className="absolute inset-0 origin-left rounded-full bg-laser" style={{ transform: 'scaleX(0)' }} />
              </span>
            </span>
          </p>
          <p>
            <span className="block whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
              <span ref={distRef} data-wait="false" className="inline-block origin-left transition-opacity duration-200 data-[wait=true]:opacity-45">?</span>
              <span className="ml-[0.12em] text-[0.36em] font-bold tracking-normal">km</span>
            </span>
            <span className="mt-2 block text-base text-sun/80">to the mirrors</span>
          </p>
        </div>
        {/* Mirrors found: one slot per mirror site, filled in green with its Apollo number once light has come back
            from it. Empty slots don't say where the others are, so the hunt stays a hunt. */}
        <div className="mt-5 lg:mt-7">
          <p className="text-base text-sun/85">
            Mirrors found: <span className="font-bold text-sun">{found.length}</span> of {MIRRORS}
            {found.length > 0 && <span className="sr-only">: {found.map((n) => `Apollo ${n}`).join(', ')}</span>}
          </p>
          <div className="mt-2.5 flex items-end gap-4" aria-hidden="true">
            {Array.from({ length: MIRRORS }, (_, i) => {
              const site = SITES.find((s) => s.n === found[i])
              return <MirrorSlot key={site ? site.n : `empty-${i}`} site={site} catchId={site ? (catches[site.n] ?? 0) : 0} />
            })}
          </div>
        </div>
        {/* How to fire: the Moon itself is the control (there is no separate button that would fire at a stale aim) */}
        <p className="mt-4 flex items-start gap-2 text-base leading-snug text-sun/85 lg:mt-5 [@media(hover:hover)_and_(pointer:fine)]:min-h-[3.4em]">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-[0.2em] size-[1.1em] shrink-0 text-laser" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="7.5" />
            <path d="M12 1.5 V6 M12 18 V22.5 M1.5 12 H6 M18 12 H22.5" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          {busy ? (
            <span>Wait for the light to come back.</span>
          ) : keying ? (
            <span className="leading-[2.1]">
              Aim with{' '}
              <span className="inline-flex gap-1 align-middle">
                <Key aria-label="left">←</Key>
                <Key aria-label="up">↑</Key>
                <Key aria-label="down">↓</Key>
                <Key aria-label="right">→</Key>
              </span>
              , fire with <Key className="px-2 align-middle">Enter</Key>. Hold <Key className="px-2 align-middle">Shift</Key> for bigger steps.
              <span className="block leading-snug text-laser">Aiming at {aimName(aim.x, aim.y)}.</span>
            </span>
          ) : mouse && pointing ? (
            <span>
              Click to fire at <span className="font-bold text-laser">{aimName(aim.x, aim.y)}</span>.
            </span>
          ) : mouse ? (
            <span className="leading-[1.9]">
              Click a spot on the Moon to fire. Or press <Key className="px-2 align-middle">Tab</Key> to use the keys.
            </span>
          ) : (
            <span>Tap a spot on the Moon to fire.</span>
          )}
        </p>
        <p className="mt-2 text-sm text-sun/60">In the game, light comes back far more often than it really does.</p>
      </div>
    </section>
  )
}
