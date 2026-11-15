import { useEffect, useRef, useState } from 'react'
import { news as item, NewsLine, type News } from './LastLightHud'
import { isNarrow, prefersReducedMotion } from '../../scroll/smoothScroll'
import { Key } from './Key'
import { StageHeading } from './StageHeading'

// "Listen for marsquakes": InSight's seismometer draws a line, and a quake is a wiggle in it.
// What is real (docs/FACTS.md, "Listen for marsquakes"): Mars is "extremely quiet", so the seismometer could pick up
// faint rumbles, while Earth "is quivering constantly from seismic noise created by oceans and weather"; trembling can
// be "caused by forces above the surface, such as wind", and the Wind and Thermal Shield protects the seismometer from
// "high winds". The first marsquake came on 6 April 2019; the biggest, magnitude 5, on 4 May 2022 shook for at least
// six hours. The line, the shapes of the quakes and how often they come are game numbers; the screen says so.

const RATE = 90 // samples of the line a second
const FAINT = 0.36 // a marsquake's height, as a share of the band's half height
const TARGET = 3 // marsquakes to catch before trying Earth
const S_AFTER = 1.4 // seconds from the first, small wave to the bigger one

type Ground = 'mars' | 'earth'
type Stage = 'dome' | 'catch' | 'earth' | 'big' | 'done'

interface Quake {
  id: number
  t0: number
  amp: number
  /** How long the bigger wave rings, seconds. */
  ring: number
  ground: Ground
  big: boolean
  caught: boolean
  passed: boolean
  said: boolean
  /** Its number on the line once caught. */
  n?: number
}

const end = (q: Quake) => q.t0 + S_AFTER + q.ring * 2.2

/** The quake's own wiggle at game time t: a small first wave, then a bigger one that rings down. */
function quakeAt(q: Quake, t: number) {
  const e = t - q.t0
  if (e < 0 || t > end(q)) return 0
  const p = 0.35 * Math.min(1, e / 0.12) * Math.exp(-e / 0.8) * Math.sin(2 * Math.PI * 7.3 * e)
  const s = e < S_AFTER ? 0 : Math.min(1, (e - S_AFTER) / 0.2) * Math.exp(-(e - S_AFTER) / q.ring) * Math.sin(2 * Math.PI * 4.6 * e + 0.7)
  return q.amp * (p + s)
}

const HEADING: Record<Stage, string> = {
  dome: 'Too windy to hear.',
  catch: `Catch ${TARGET} marsquakes.`,
  earth: 'Now try Earth.',
  big: 'Keep listening.',
  done: 'You heard Mars.',
}

/** The game's sound, turned on: what is real about it, and what it is made from (docs/FACTS.md). */
const SOUND_LINE = 'Marsquakes are too slow to hear, so NASA sped one up 60 times. This sound is made from the game’s line.'

// The longest news lines and every heading, sitting invisibly under the shown ones so the controls keep one height
// (on phones that height sets where the line is drawn, so a longer line used to shift it). Keep the longest of any
// new line here.
const RESERVE = [
  'The dome keeps the wind off. Now watch the line for a faint wiggle: a marsquake.',
  'Earth’s ground never stops shaking, from oceans and weather. Can you still find a quake?',
  'Found it, just. On Earth a quake that small gets lost among tiny crackles. Switch back to Mars.',
  'A quake just went by, lost in Earth’s noise. Did you see it? Switch back to Mars.',
  'There was a quake in there, hidden by the wind. Put the dome over the seismometer.',
  'You missed a magnitude 5, like the biggest quake ever detected on another planet.',
  SOUND_LINE,
].map((t) => item('goal', t, 'good'))
const STAGES = Object.values(HEADING)

/** How hard the wind is gusting at game time t, 0.35 to 1 (the same gusts the line shows). */
function gustAt(t: number, ph: number[]) {
  return 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.8 + ph[0])) * (0.5 + 0.5 * Math.sin(t * 1.9 + ph[1]))
}

function SoundIcon({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5 H7.5 L12 5.5 V18.5 L7.5 14.5 H4 Z" />
      {on ? <path d="M15.5 9 A4 4 0 0 1 15.5 15 M18 6.5 A7.5 7.5 0 0 1 18 17.5" /> : <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" />}
    </svg>
  )
}

function DomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17.5 A8 8 0 0 1 20 17.5 Z M2.5 17.5 H21.5" />
    </svg>
  )
}

export default function Seismometer() {
  const [stage, setStage] = useState<Stage>('dome')
  const [dome, setDome] = useState(false)
  const [ground, setGround] = useState<Ground>('mars')
  const [heard, setHeard] = useState(0)
  const [news, setNews] = useState<News>(() => item('gust', 'Wind is shaking the seismometer. Could you spot a quake in all that?'))
  const [said, setSaid] = useState('')
  const [sound, setSound] = useState(false)

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const quakeBtnRef = useRef<HTMLButtonElement>(null)
  const spaceKeyRef = useRef<HTMLElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const bareRef = useRef<HTMLImageElement>(null)
  const dustRef = useRef<HTMLCanvasElement>(null)
  /** The sound, once turned on: noise for the wind and Earth's crackles, a low rumble for quakes. */
  const audio = useRef<{ ac: AudioContext; wind: GainNode; crackle: GainNode; rumble: GainNode; pitch: OscillatorNode; master: GainNode } | null>(null)
  const soundOn = useRef(false)

  function makeAudio() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    const ac = new Ctor()
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const noise = ac.createBufferSource()
    noise.buffer = buf
    noise.loop = true
    const master = ac.createGain()
    master.gain.value = 0.8
    master.connect(ac.destination)
    const gain = () => {
      const g = ac.createGain()
      g.gain.value = 0
      g.connect(master)
      return g
    }
    // Wind: a soft low hiss
    const wind = gain()
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 520
    noise.connect(lp).connect(wind)
    // Earth's crackles: a brighter hiss
    const crackle = gain()
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1500
    bp.Q.value = 2.5
    noise.connect(bp).connect(crackle)
    // A quake: a deep rumble, a little rougher with some low noise
    const rumble = gain()
    const pitch = ac.createOscillator()
    pitch.type = 'sine'
    pitch.frequency.value = 46
    const second = ac.createOscillator()
    second.type = 'triangle'
    second.frequency.value = 69
    const low = ac.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 180
    pitch.connect(rumble)
    second.connect(low).connect(rumble)
    noise.connect(low)
    noise.start()
    pitch.start()
    second.start()
    return { ac, wind, crackle, rumble, pitch, master }
  }

  function toggleSound() {
    const on = !soundOn.current
    if (on && !audio.current) audio.current = makeAudio()
    const a = audio.current
    if (!a) return
    soundOn.current = on
    setSound(on)
    if (on) {
      void a.ac.resume()
      setNews(item('quake', SOUND_LINE))
    } else void a.ac.suspend()
  }
  useEffect(() => () => void audio.current?.ac.close(), [])
  /** The button and the hint's drawn key sink together while space or Enter is held. */
  function holdKey(on: boolean) {
    const v = on ? 'true' : 'false'
    if (quakeBtnRef.current) quakeBtnRef.current.dataset.held = v
    if (spaceKeyRef.current) spaceKeyRef.current.dataset.held = v
  }

  // Everything the loop reads lives in refs, so the line never re-renders React.
  const game = useRef({
    t: 0,
    dome: false,
    ground: 'mars' as Ground,
    stage: 'dome' as Stage,
    quakes: [] as Quake[],
    next: 2.5, // when the next quake starts
    ids: 0,
    caughtMars: 0,
    earthPassed: 0,
    lastPress: -1,
    pressedInWind: false,
  })
  const kick = useRef<() => void>(() => {})

  function toStage(s: Stage) {
    game.current.stage = s
    setStage(s)
  }

  function popCount() {
    if (countRef.current && !prefersReducedMotion())
      countRef.current.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }

  function putDome(on: boolean) {
    const g = game.current
    if (on === g.dome) return
    g.dome = on
    setDome(on)
    if (on && g.stage === 'dome') {
      toStage('catch')
      setNews(item('dome', 'The dome keeps the wind off. Now watch the line for a faint wiggle: a marsquake.'))
    } else setNews(item(on ? 'dome' : 'gust', on ? 'Dome on. Quiet again.' : 'Dome off. The wind shakes the line again.'))
  }

  function chooseGround(next: Ground) {
    const g = game.current
    if (next === g.ground) return
    g.ground = next
    setGround(next)
    if (next === 'earth') {
      setNews(item('quake', 'Earth’s ground never stops shaking, from oceans and weather. Can you still find a quake?'))
    } else if (g.stage === 'earth' && g.earthPassed > 0) {
      toStage('big')
      // The big one, a little after you get back. No small quake starts until it has gone by.
      g.next = Number.POSITIVE_INFINITY
      g.quakes.push({ id: ++g.ids, t0: g.t + 2.2, amp: 1, ring: 3.2, ground: 'mars', big: true, caught: false, passed: false, said: false })
      setNews(item('quake', 'Back on quiet Mars. Keep watching the line.'))
    } else {
      setNews(item('quake', 'Back on quiet Mars.'))
    }
  }

  function press() {
    const g = game.current
    if (g.t - g.lastPress < 0.25) return
    g.lastPress = g.t
    const q = g.quakes.find((k) => !k.caught && !k.passed && g.t >= k.t0 + 0.2 && g.t <= end(k) + 1)
    if (!q) {
      if (!g.dome) {
        g.pressedInWind = true
        setNews(item('gust', 'That was the wind. Too windy to tell. Put the dome over the seismometer.'))
      } else if (g.ground === 'earth') setNews(item('quake', 'That was Earth’s own shaking, not a quake.'))
      else setNews(item('quake', 'Just the quiet hum of Mars. Wait for a clear wiggle.'))
      return
    }
    q.caught = true
    shake.current = Math.min(1, shake.current + (q.big ? 0.8 : 0.35))
    if (q.ground === 'earth') {
      setNews(item('goal', 'Found it, just. On Earth a quake that small gets lost among tiny crackles. Switch back to Mars.', 'good'))
      return
    }
    g.caughtMars += 1
    q.n = g.caughtMars
    setHeard(g.caughtMars)
    popCount()
    if (q.big) {
      setNews(item('goal', 'Magnitude 5, like 4 May 2022: the biggest quake ever detected on another planet.', 'good'))
    } else if (g.caughtMars === 1) {
      setNews(item('goal', 'A marsquake. InSight felt its first on 6 April 2019.', 'good'))
    } else if (g.stage === 'catch' && g.caughtMars >= TARGET) {
      toStage('earth')
      setNews(item('goal', `${TARGET} marsquakes. Now put the same seismometer on Earth’s ground.`, 'good'))
    } else if (g.stage === 'earth') {
      setNews(item('goal', 'Another marsquake. Now switch to Earth ground and compare.', 'good'))
    } else {
      setNews(item('goal', 'Another. Mars is so quiet that even faint rumbles show.', 'good'))
    }
  }
  const pressRef = useRef(press)
  pressRef.current = press
  const shake = useRef(0)

  /** A quake has gone past the pen and off the line's fresh end. */
  function passed(q: Quake) {
    const g = game.current
    if (q.big) {
      toStage('done')
      setNews(
        q.caught
          ? item('goal', 'In real life it shook for at least six hours. InSight heard 1,319 marsquakes in all.', 'good')
          : item('quake', 'You missed a magnitude 5, like the biggest quake ever detected on another planet.'),
      )
      g.next = g.t + 3
      return
    }
    if (q.ground === 'earth') {
      g.earthPassed += 1
      if (!q.caught) setNews(item('quake', 'A quake just went by, lost in Earth’s noise. Did you see it? Switch back to Mars.'))
      return
    }
    // A Mars quake that ends after you switched to Earth: the Earth lines matter more now
    if (q.caught || g.ground === 'earth') return
    if (!g.dome) {
      if (!g.pressedInWind) setNews(item('gust', 'There was a quake in there, hidden by the wind. Put the dome over the seismometer.'))
    } else setNews(item('quake', 'A quake went by. Press as soon as the line wiggles.'))
  }
  const passedRef = useRef(passed)
  passedRef.current = passed

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return
    const reduced = prefersReducedMotion()
    const g = game.current
    const css = getComputedStyle(root)
    const SUN = css.getPropertyValue('--color-sun').trim() || '#f2e2c2'
    const BRIGHT = css.getPropertyValue('--color-sun-bright').trim() || '#fff1d6'
    const INK = css.getPropertyValue('--color-ink').trim() || '#1f140e'

    // The line's history: one value per sample, newest last.
    const N = RATE * 30
    const vals = new Float32Array(N)
    let head = 0 // index of the next sample to write
    let filled = 0
    let tNext = 0 // game time of the next sample
    // Noise states
    let base = 0
    let gustJ = 0
    let wind = 1 // smoothed: 1 = no dome
    let earth = 0 // smoothed: 1 = Earth's ground
    const ph = Array.from({ length: 6 }, () => Math.random() * Math.PI * 2)
    // Earth's crackles: little bursts all the time
    let crackles: { t0: number; amp: number; dur: number; f: number }[] = []
    let nextCrackle = 0
    // The latest sample's parts, for the scene and the sound: wind, Earth's shaking, quakes
    let windNow = 0
    let earthNow = 0
    let quakeNow = 0

    function sample(t: number) {
      base = base * 0.7 + (Math.random() - 0.5) * 0.05
      gustJ = gustJ * 0.35 + (Math.random() - 0.5) * 1.1
      const gust = gustAt(t, ph)
      let quiver = 0
      if (earth > 0.01) {
        while (nextCrackle <= t) {
          crackles.push({ t0: nextCrackle, amp: 0.22 + Math.random() * 0.4, dur: 0.25 + Math.random() * 0.5, f: 4 + Math.random() * 5 })
          nextCrackle += 0.12 + Math.random() * 0.3
        }
        crackles = crackles.filter((c) => t - c.t0 < c.dur)
        for (const c of crackles) {
          const e = t - c.t0
          quiver += c.amp * Math.sin((Math.PI * e) / c.dur) * Math.sin(2 * Math.PI * c.f * e)
        }
        quiver += 0.32 * Math.sin(t * 1.6 + ph[2]) + 0.2 * Math.sin(t * 2.7 + ph[3])
      } else nextCrackle = t
      let qv = 0
      for (const q of g.quakes) qv += quakeAt(q, t)
      windNow = wind * gust * 0.42 * gustJ
      earthNow = earth * 0.8 * quiver
      quakeNow = qv
      return base + windNow + earthNow + qv
    }

    let w = 0
    let h = 0
    // Dust blowing across the photo: the wind is always there; the dome only stops it shaking the seismometer
    const dctx = dustRef.current?.getContext('2d') ?? null
    let dw = 0
    let dh = 0
    // Soft, faint wisps of dust, each one blot stamped wider than tall, drifting with the gusts
    const motes = Array.from({ length: isNarrow() ? 26 : 44 }, () => ({ x: Math.random(), y: 0.3 + Math.random() * 0.7, v: 0.6 + Math.random() * 0.8, r: 6 + Math.random() * 18, a: 0.1 + Math.random() * 0.16 }))
    const blot = document.createElement('canvas')
    blot.width = blot.height = 48
    {
      const bc = blot.getContext('2d')!
      const gr = bc.createRadialGradient(24, 24, 0, 24, 24, 24)
      gr.addColorStop(0, 'rgba(240, 210, 172, 1)')
      gr.addColorStop(0.5, 'rgba(232, 196, 152, 0.45)')
      gr.addColorStop(1, 'rgba(226, 188, 142, 0)')
      bc.fillStyle = gr
      bc.fillRect(0, 0, 48, 48)
    }
    function drawDust(dt: number) {
      if (!dctx || !dw || !dh) return
      dctx.clearRect(0, 0, dw, dh)
      if (reduced) return
      const gs = gustAt(g.t, ph)
      for (const m of motes) {
        const vx = (0.04 + 0.16 * gs) * m.v // share of the width a second
        m.x += vx * dt
        m.y += Math.sin(g.t * 1.3 + m.v * 9) * 0.01 * dt
        if (m.x > 1.15) {
          m.x = -0.15
          m.y = 0.3 + Math.random() * 0.7
        }
        const r = m.r * (dw / 700)
        dctx.globalAlpha = m.a * (0.45 + 0.55 * gs)
        dctx.drawImage(blot, m.x * dw - r * 2.5, m.y * dh - r * 0.7, r * 5, r * 1.4)
      }
      dctx.globalAlpha = 1
    }
    // Phones: the line sits just above where the words start, and the photo fills the space above it, so the
    // words never lie on the line however short the screen. Wide screens use the classes as written.
    const place = () => {
      const hud = hudRef.current
      if (!hud) return
      if (!isNarrow()) {
        root.style.removeProperty('--line-top')
        root.style.removeProperty('--line-h')
        root.style.removeProperty('--photo-h')
        return
      }
      const H = root.clientHeight
      // Short phones: the line gives up some height (and the photo above it more) before it would touch the words
      const lineH = Math.max(70, Math.min(150, H * 0.17, hud.offsetTop - H * 0.1 - 6))
      const top = Math.max(H * 0.1, Math.min(H * 0.37, hud.offsetTop - lineH - 6))
      root.style.setProperty('--line-top', `${top}px`)
      root.style.setProperty('--line-h', `${lineH}px`)
      root.style.setProperty('--photo-h', `${top + lineH * 0.55}px`)
    }
    const resize = () => {
      place()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const dc = dustRef.current
      if (dc) {
        dw = dc.clientWidth
        dh = dc.clientHeight
        dc.width = Math.round(dw * dpr)
        dc.height = Math.round(dh * dpr)
        dctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      draw()
    }

    const speed = () => (isNarrow() ? 62 : 120) // pixels a second
    const penX = () => w - (isNarrow() ? 46 : 92)
    const armLen = () => (isNarrow() ? 30 : 66)
    let stopHit = -9 // when the pen last hit one of its stops

    function draw() {
      if (!w || !h) return
      ctx!.clearRect(0, 0, w, h)
      const mid = h / 2
      const amp = h * 0.42
      const px = penX()
      const sp = speed()
      // The record: a dark strip under the line, a tick every second scrolling with it, every fifth one stronger,
      // and the pen's two stops, as far as it can swing
      ctx!.fillStyle = 'rgba(14, 9, 6, 0.5)'
      ctx!.fillRect(0, 0, w, h)
      ctx!.strokeStyle = SUN
      ctx!.lineWidth = 1
      for (let T = Math.floor(g.t); ; T--) {
        const x = px - (g.t - T) * sp
        if (x < 0) break
        ctx!.globalAlpha = T % 5 === 0 ? 0.16 : 0.06
        ctx!.beginPath()
        ctx!.moveTo(x, mid - amp)
        ctx!.lineTo(x, mid + amp)
        ctx!.stroke()
      }
      ctx!.globalAlpha = 0.16
      ctx!.setLineDash([2, 6])
      for (const y of [mid - amp, mid + amp]) {
        ctx!.beginPath()
        ctx!.moveTo(0, y)
        ctx!.lineTo(px, y)
        ctx!.stroke()
      }
      ctx!.setLineDash([])
      // The rest line
      ctx!.globalAlpha = 0.18
      ctx!.strokeStyle = SUN
      ctx!.lineWidth = 1
      ctx!.beginPath()
      ctx!.moveTo(0, mid)
      ctx!.lineTo(px, mid)
      ctx!.stroke()
      ctx!.globalAlpha = 1
      const count = Math.min(filled, Math.ceil((px / sp) * RATE) + 2)
      const xAt = (k: number) => px - ((g.t - (tNext - (k + 1) / RATE)) * sp)
      const yAt = (k: number) => mid - Math.max(-1, Math.min(1, vals[(head - 1 - k + N) % N])) * amp
      // The line itself, on a dark casing so it reads over the photo
      const path = (from: number, to: number) => {
        ctx!.beginPath()
        for (let k = from; k <= to && k < count; k++) {
          const x = xAt(k)
          if (k === from) ctx!.moveTo(x, yAt(k))
          else ctx!.lineTo(x, yAt(k))
        }
      }
      ctx!.lineJoin = 'round'
      ctx!.lineCap = 'round'
      // Caught quakes keep a soft band behind them and their number in a disc above, as they scroll away
      ctx!.font = `800 ${isNarrow() ? 13 : 15}px "Bricolage Grotesque Variable", system-ui, sans-serif`
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      for (const q of g.quakes) {
        if (!q.caught) continue
        const x0 = px - (g.t - q.t0) * sp
        const x1 = Math.min(px, px - (g.t - end(q)) * sp)
        if (x1 < 0) continue
        const top = mid - amp * Math.min(1.05, q.amp + 0.12)
        ctx!.fillStyle = 'rgba(242, 226, 194, 0.1)'
        ctx!.beginPath()
        ctx!.roundRect(x0 - 6, top, x1 - x0 + 12, (mid - top) * 2, 8)
        ctx!.fill()
        if (q.n) {
          const r = isNarrow() ? 10 : 12
          const cx = Math.max(r, x0 + (x1 - x0) / 2)
          const cy = Math.max(r + 1, top - r - 4)
          ctx!.fillStyle = BRIGHT
          ctx!.beginPath()
          ctx!.arc(cx, cy, r, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.fillStyle = INK
          ctx!.fillText(String(q.n), cx, cy + 1)
        }
      }
      path(0, count - 1)
      ctx!.strokeStyle = 'rgba(20, 12, 8, 0.55)'
      ctx!.lineWidth = isNarrow() ? 4.5 : 5.5
      ctx!.stroke()
      ctx!.strokeStyle = SUN
      ctx!.lineWidth = isNarrow() ? 2 : 2.5
      ctx!.stroke()
      // The big one: the ink spreads where the pen swings hard
      for (const q of g.quakes) {
        if (!q.big) continue
        const a = Math.max(0, Math.floor((tNext - end(q)) * RATE))
        const b = Math.floor((tNext - q.t0) * RATE)
        if (a >= count || b < 0) continue
        path(a, b)
        ctx!.strokeStyle = 'rgba(255, 241, 214, 0.2)'
        ctx!.lineWidth = isNarrow() ? 7 : 9
        ctx!.stroke()
      }
      // Caught quakes: the line itself drawn bolder and brighter over its band
      for (const q of g.quakes) {
        if (!q.caught) continue
        const a = Math.max(0, Math.floor((tNext - end(q)) * RATE))
        const b = Math.floor((tNext - q.t0) * RATE)
        if (a >= count) continue
        path(a, b)
        ctx!.strokeStyle = BRIGHT
        ctx!.lineWidth = isNarrow() ? 3 : 3.5
        ctx!.stroke()
      }
      // The pen on its arm, swinging from a pivot to the right; it flashes its stop when it hits one
      const y0 = filled ? yAt(0) : mid
      const pv = { x: px + armLen(), y: mid }
      const raw = filled ? vals[(head - 1 + N) % N] : 0
      if (Math.abs(raw) >= 0.99) stopHit = g.t
      const hit = Math.max(0, 1 - (g.t - stopHit) / 0.3)
      if (hit > 0) {
        ctx!.fillStyle = `rgba(255, 241, 214, ${(0.9 * hit).toFixed(3)})`
        const sy = raw > 0 ? mid - amp : mid + amp
        ctx!.fillRect(px - 16, sy - 1.5, 32, 3)
      }
      ctx!.lineCap = 'round'
      ctx!.strokeStyle = 'rgba(20, 12, 8, 0.6)'
      ctx!.lineWidth = isNarrow() ? 5 : 6
      ctx!.beginPath()
      ctx!.moveTo(pv.x, pv.y)
      ctx!.lineTo(px, y0)
      ctx!.stroke()
      ctx!.strokeStyle = SUN
      ctx!.lineWidth = isNarrow() ? 2 : 2.5
      ctx!.stroke()
      ctx!.fillStyle = INK
      ctx!.strokeStyle = SUN
      ctx!.lineWidth = 2
      ctx!.beginPath()
      ctx!.arc(pv.x, pv.y, isNarrow() ? 4.5 : 6, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.stroke()
      ctx!.fillStyle = BRIGHT
      ctx!.beginPath()
      ctx!.arc(px, y0, isNarrow() ? 4 : 5, 0, Math.PI * 2)
      ctx!.fill()
    }

    let raf = 0
    let last = 0
    let visible = false
    let st = 0
    let rumbleEnv = 0
    let windEnv = 0
    let earthEnv = 0
    const frame = (now: number) => {
      step(Math.min(0.05, last ? (now - last) / 1000 : 0))
      last = now
      raf = visible ? requestAnimationFrame(frame) : 0
    }
    /** One step of the game: the line, the quakes, the shake. */
    function step(dt: number) {
      g.t += dt
      wind += ((g.dome ? 0 : 1) - wind) * Math.min(1, dt * 2.5)
      earth += ((g.ground === 'earth' ? 1 : 0) - earth) * Math.min(1, dt * 3)

      // Quakes: one at a time, every few seconds (far more often than on Mars; the screen says so)
      if (g.t >= g.next) {
        const q: Quake = { id: ++g.ids, t0: g.t, amp: FAINT, ring: 0.9, ground: g.ground, big: false, caught: false, passed: false, said: false }
        g.quakes.push(q)
        g.next = end(q) + 1.8 + Math.random() * 2.6
      }
      while (tNext <= g.t) {
        vals[head] = sample(tNext)
        head = (head + 1) % N
        filled = Math.min(N, filled + 1)
        tNext += 1 / RATE
      }
      for (const q of g.quakes) {
        // Screen readers hear when the line wiggles, once the dome is on and on quiet Mars, as a sighted player sees it
        if (!q.said && g.t >= q.t0 + S_AFTER && (q.big || (g.dome && q.ground === 'mars'))) {
          q.said = true
          setSaid(q.big ? 'The line is swinging hard.' : 'The line is wiggling.')
        }
        if (!q.passed && g.t > end(q) + 1) {
          q.passed = true
          passedRef.current(q)
        }
      }
      // Forget quakes that have scrolled off the line
      const keep = (N / RATE) * 0.6
      g.quakes = g.quakes.filter((q) => g.t - end(q) < keep)
      draw()

      // The scene: the ground in the photo trembles with each quake; the bare seismometer shivers in the wind
      // (under the dome it is still); dust keeps blowing across, gusting with the wind.
      let qs = 0
      let bigSig = 0
      for (const q of g.quakes) {
        const v = quakeAt(q, g.t)
        qs += v
        if (q.big) bigSig += v
      }
      if (photoRef.current) photoRef.current.style.transform = reduced ? '' : `translate3d(0, ${(qs * (isNarrow() ? 5 : 8)).toFixed(2)}px, 0)`
      if (bareRef.current) bareRef.current.style.transform = reduced || g.dome ? '' : `translate3d(${(windNow * 7).toFixed(2)}px, ${(windNow * 2).toFixed(2)}px, 0)`
      drawDust(dt)

      // A catch kicks the screen (trauma², summed sines); the big one rocks it with the line itself
      shake.current = Math.max(0, shake.current - 1.5 * dt)
      st += dt * 30
      const kickS = reduced ? 0 : shake.current * shake.current
      const swayY = reduced ? 0 : bigSig * 12
      const swayX = reduced ? 0 : bigSig * 5
      if (shakeRef.current)
        shakeRef.current.style.transform =
          kickS > 0.001 || Math.abs(bigSig) > 0.002
            ? `translate3d(${(9 * kickS * Math.sin(st * 1.7) + swayX).toFixed(2)}px, ${(6 * kickS * Math.sin(st * 2.3) + swayY).toFixed(2)}px, 0)`
            : ''

      // The sound follows the same parts of the line: wind hiss, Earth's crackle, a quake's rumble
      const a = audio.current
      if (a && soundOn.current) {
        const now = a.ac.currentTime
        rumbleEnv = Math.max(Math.abs(quakeNow), rumbleEnv * Math.exp(-dt * 3))
        windEnv = Math.max(Math.abs(windNow), windEnv * Math.exp(-dt * 4))
        earthEnv = Math.max(Math.abs(earthNow), earthEnv * Math.exp(-dt * 5))
        a.wind.gain.setTargetAtTime(Math.min(0.35, windEnv * 0.9), now, 0.05)
        a.crackle.gain.setTargetAtTime(Math.min(0.18, earthEnv * 0.25), now, 0.04)
        a.rumble.gain.setTargetAtTime(Math.min(0.9, rumbleEnv * 1.4), now, 0.04)
        a.pitch.frequency.setTargetAtTime(40 + 22 * Math.min(1, rumbleEnv), now, 0.1)
      }

    }
    kick.current = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    // The line only runs while the game is on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        kick.current()
        if (soundOn.current) void audio.current?.ac.resume()
      } else {
        cancelAnimationFrame(raf)
        raf = 0
        void audio.current?.ac.suspend()
      }
    })
    io.observe(root)
    // The line arrives already full: some quiet, windy history, and the first quake a little after you look
    g.t = 14
    while (tNext <= g.t) {
      vals[head] = sample(tNext)
      head = (head + 1) % N
      filled = Math.min(N, filled + 1)
      tNext += 1 / RATE
    }
    g.next = g.t + 2.5
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    ro.observe(root)
    if (hudRef.current) ro.observe(hudRef.current)
    resize()

    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__seis = { game, press: () => pressRef.current(), advance: (sec: number) => { for (let i = 0; i < sec * 60; i++) step(1 / 60) } }
    return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  const earthOpen = stage === 'earth' || stage === 'big' || stage === 'done'

  return (
    <section ref={rootRef} aria-label="Listen for marsquakes, a seismometer game" className="relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-basalt">
      <div ref={shakeRef} className="absolute inset-0">
        {/* The seismometer, photographed by InSight's arm camera: bare on the ground, then under its dome. The same
            camera, nearly the same spot, so putting the dome on is a crossfade with a small drop. */}
        <div ref={photoRef} className="absolute inset-x-0 top-0 h-[var(--photo-h,42%)] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[min(52vw,100svh)] lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]">
          <img
            ref={bareRef}
            src="photos/insight-seis-bare.webp"
            width={1024}
            height={1024}
            alt="InSight's seismometer, a copper-coloured six-sided box, sitting on the reddish ground with the robot arm's claw just above it."
            className="absolute inset-0 h-full w-full object-cover object-[45%_88%] lg:object-[45%_70%]"
          />
          <img
            src="photos/insight-dome-arm.webp"
            width={1024}
            height={1024}
            alt={dome ? 'The same spot with the white dome now over the seismometer.' : ''}
            aria-hidden={!dome}
            className="absolute inset-0 h-full w-full object-cover object-[45%_80%] transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none lg:object-[45%_62%]"
            style={{ opacity: dome ? 1 : 0, transform: dome ? 'none' : 'translate3d(0,-3%,0) scale(1.03)' }}
          />
          <canvas ref={dustRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        </div>
        {/* Wide screens: a shade at the top so the line reads over the photo */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 hidden h-[45%] bg-gradient-to-b from-basalt/85 to-transparent lg:block" />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-x-0 top-[var(--line-top,37%)] h-[var(--line-h,16%)] w-full [mask-image:linear-gradient(to_right,transparent,black_14%)] lg:top-[4%] lg:h-[22%] [@media(max-height:780px)_and_(min-width:1024px)]:top-[3%] [@media(max-height:780px)_and_(min-width:1024px)]:h-[17%]"
        />
      </div>

      <div ref={hudRef} className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:inset-y-0 lg:right-auto lg:flex lg:w-[min(36rem,44vw)] lg:flex-col lg:justify-end lg:pb-10">
        {/* Short wide screens: a smaller heading, and on the shortest none, so the line above keeps its room */}
        <StageHeading
          text={HEADING[stage]}
          reserve={STAGES}
          reserveClass="lg:hidden"
          className="text-[clamp(2rem,9vw,4rem)] [@media(max-height:760px)_and_(max-width:1023px)]:hidden [@media(max-height:780px)_and_(min-width:1024px)]:text-[2.75rem] [@media(max-height:720px)_and_(min-width:1024px)]:hidden"
        />
        {/* Phones: the news keeps the room of its longest line, so the line above never jumps when the news changes
            (wide screens draw the line at the top, whatever the words below do) */}
        <div className="mt-2 grid text-base sm:text-lg">
          {RESERVE.map((r) => (
            <div key={r.text} aria-hidden="true" className="invisible [grid-area:1/1] lg:hidden">
              <NewsLine item={r} className="" />
            </div>
          ))}
          <div className="[grid-area:1/1]">
            <NewsLine item={news} className="" />
          </div>
        </div>
        <p className="sr-only" aria-live="assertive">
          {said}
        </p>

        {/* The count beside its label on phones (to leave the line its room), above it on wide screens */}
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3 lg:mt-5">
          <p className="flex items-baseline gap-2.5 lg:block">
            <span ref={countRef} className="block origin-left whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
              {heard}
            </span>
            <span className="block whitespace-nowrap text-base text-sun/80 lg:mt-2">{heard === 1 ? 'marsquake heard' : 'marsquakes heard'}</span>
          </p>
          {/* The sound: off until pressed. A round speaker on phones, beside the count; with words from sm up */}
          <button
            type="button"
            aria-pressed={sound}
            onClick={toggleSound}
            className="ml-auto inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-black/40 font-display text-base font-bold text-sun ring-1 ring-sun/25 transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] aria-pressed:bg-sun aria-pressed:text-ink sm:px-4 lg:order-last lg:ml-0 [@media(hover:hover)_and_(pointer:fine)]:hover:ring-sun/60"
          >
            <SoundIcon on={sound} className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only">{sound ? 'Sound on' : 'Hear it'}</span>
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={dome}
              onClick={() => putDome(!dome)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-black/40 px-3 font-display text-base font-bold text-sun ring-1 ring-sun/25 transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.97] aria-pressed:bg-sun aria-pressed:text-ink sm:gap-2 sm:px-4 [@media(hover:hover)_and_(pointer:fine)]:hover:ring-sun/60"
            >
              <DomeIcon className="h-5 w-5" />
              {/* Always as wide as its longer label, so the row never rewraps when it changes */}
              <span className="grid text-left">
                <span aria-hidden="true" className="invisible [grid-area:1/1]">
                  Dome off
                </span>
                <span className="[grid-area:1/1]">{dome ? 'Dome on' : 'Dome off'}</span>
              </span>
            </button>
            {/* Kept in place (hidden) until it opens, so the controls do not grow when it appears */}
            <div
              role="radiogroup"
              aria-label="Ground"
              onKeyDown={(e) => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
                e.preventDefault()
                const next: Ground = ground === 'mars' ? 'earth' : 'mars'
                chooseGround(next)
                e.currentTarget.querySelector<HTMLElement>(`[data-ground="${next}"]`)?.focus()
              }}
              aria-hidden={!earthOpen}
              className={`${earthOpen ? 'motion-safe:animate-[fade-in_300ms_ease-out]' : 'invisible'} grid grid-cols-2 rounded-full bg-black/40 p-1 ring-1 ring-sun/25`}
            >
              {(['mars', 'earth'] as Ground[]).map((gr) => (
                <button
                  key={gr}
                  type="button"
                  role="radio"
                  data-ground={gr}
                  aria-checked={ground === gr}
                  tabIndex={ground === gr ? 0 : -1}
                  onClick={() => chooseGround(gr)}
                  className="min-h-9 rounded-full px-2.5 font-display text-base font-bold text-sun/80 sm:px-3 transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] aria-checked:bg-sun aria-checked:text-ink"
                >
                  {gr === 'mars' ? 'Mars' : 'Earth'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Space and Enter catch on the key going down, not on the button's own click when it comes up, so a quick
            press is never late; the key-up click is cancelled so one press never counts twice. The button and the
            drawn key in the hint both sink while the key is held. */}
        <button
          ref={quakeBtnRef}
          type="button"
          data-held="false"
          aria-describedby="seis-help"
          onPointerDown={(e) => e.currentTarget.focus({ preventScroll: true })}
          onClick={() => {
            press()
            kick.current()
          }}
          onKeyDown={(e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return
            e.preventDefault()
            holdKey(true)
            if (!e.repeat) {
              press()
              kick.current()
            }
          }}
          onKeyUp={(e) => {
            if (e.key !== ' ' && e.key !== 'Enter') return
            e.preventDefault()
            holdKey(false)
          }}
          onBlur={() => holdKey(false)}
          className="mt-5 inline-flex min-h-14 w-full select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-sun px-5 font-display text-xl font-extrabold text-ink shadow-[0_6px_0_rgb(150_118_80),0_10px_18px_rgb(0_0_0/0.35)] transition-[transform,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] active:translate-y-[5px] active:bg-sun-bright active:shadow-[0_1px_0_rgb(150_118_80),0_2px_6px_rgb(0_0_0/0.3)] active:duration-75 data-[held=true]:translate-y-[5px] data-[held=true]:bg-sun-bright data-[held=true]:shadow-[0_1px_0_rgb(150_118_80),0_2px_6px_rgb(0_0_0/0.3)] data-[held=true]:duration-75 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-sun-bright lg:mt-7 lg:min-h-16 lg:w-auto lg:self-start lg:text-2xl [@media(max-height:780px)_and_(min-width:1024px)]:mt-4 [@media(max-height:780px)_and_(min-width:1024px)]:min-h-14 [@media(max-height:780px)_and_(min-width:1024px)]:text-xl"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12 H6 L8 8 L10.5 16.5 L13 5.5 L15.5 18 L17.5 9.5 L19 12 H21.5" />
          </svg>
          That’s a quake
        </button>
        {/* Two separate things, as in Lift off: how to use a keyboard (only where there is a mouse, so most likely a
            keyboard), with a drawn key that sinks while space is held; and the honest note about the game, quieter. */}
        <div id="seis-help" className="mt-3 grid gap-1.5">
          <p className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-sm text-sun/80 sm:text-base [@media(hover:hover)_and_(pointer:fine)]:flex">
            Or click it once, then press
            <Key ref={spaceKeyRef} data-held="false" className="min-w-[4.5rem] px-2.5">
              space
            </Key>
            when the line wiggles
          </p>
          <p className="text-sm text-sun/60">The line is drawn for the game, and real marsquakes came far less often.</p>
        </div>
      </div>
    </section>
  )
}
