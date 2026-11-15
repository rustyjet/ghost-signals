import { useEffect, useRef, useState } from 'react'
import { news as item, NewsLine, type News } from './LastLightHud'
import { isNarrow, prefersReducedMotion } from '../../scroll/smoothScroll'
import { Key } from './Key'
import { StageHeading } from './StageHeading'
import { drawSojourner, WHEEL_R, WHEELS, type RoverLook } from './sojournerDraw'
import { dist, headingTo, pxPerMetre, rockAt, rocksOnGround, toGround, toPhoto, type Lens, type Pt, type Rock } from './driveGround'

// "Plan my drive": Sojourner could not be steered live. What is real (docs/FACTS.md, "Plan my drive"): commands took
// 10 to 15 minutes to reach Mars; drivers sent a day's commands at a time, choosing spots on the lander's stereo
// photos; in the first days the rover mostly made "blind" moves, counting wheel turns, and a bumper touch stopped a
// drive; drivers only saw where it really got to in the lander's photos at the end of the day. On day 3 it was beside
// Barnacle Bill; on day 6 its left rear wheel drove up onto Yogi, and it got the wheel off on day 7. The two photos
// are the lander's own, from day 3 (PIA00660) and days 8 to 10 (PIA00751), lined up on each other. The rover's
// outline, the drive, its speed and how much it slips are drawn for the game; the screen says so.

/** The day 3 photo (and the days 8 to 10 photo, cut and scaled to sit exactly on it), in px. */
const PHOTO = { w: 1028, h: 840 }
/** The lander camera, tuned by eye so the rover, Barnacle Bill and Yogi come out the right size. */
const LENS: Lens = { horizon: -12, cx: 560, f: 1081, h: 1.5 }

/** Rocks the rover must not drive into, at their foot on the day 3 photo. Pebbles it could roll over are left out. */
const ROCKS: Rock[] = rocksOnGround(LENS, [
  { x: 835, y: 265, rx: 122, name: 'Yogi' },
  { x: 168, y: 548, rx: 78, name: 'Barnacle Bill' },
  { x: 355, y: 245, rx: 50 },
  { x: 433, y: 335, rx: 34 },
  { x: 412, y: 362, rx: 26 },
  { x: 495, y: 290, rx: 24 },
  { x: 262, y: 240, rx: 22 },
  { x: 787, y: 335, rx: 30 },
  { x: 857, y: 362, rx: 36 },
  { x: 960, y: 515, rx: 24 },
  { x: 182, y: 455, rx: 28 },
  { x: 30, y: 445, rx: 30 },
  { x: 405, y: 95, rx: 70 },
  { x: 950, y: 68, rx: 50 },
  { x: 125, y: 145, rx: 26 },
  { x: 65, y: 215, rx: 24 },
])
const YOGI = ROCKS[0]
const BILL = ROCKS[1]
/** Yogi's outline in the day 3 photo. It stands taller than the rover and hides the ground behind it, so a spot
    inside this outline is Yogi itself or ground nobody can see: no stops there, and driving into it is hitting Yogi. */
const YOGI_OUTLINE: Pt[] = [
  { x: 703, y: 282 }, { x: 706, y: 180 }, { x: 716, y: 120 }, { x: 746, y: 96 }, { x: 800, y: 82 }, { x: 880, y: 86 },
  { x: 926, y: 104 }, { x: 952, y: 140 }, { x: 964, y: 200 }, { x: 964, y: 268 }, { x: 932, y: 288 }, { x: 780, y: 294 },
]
function inside(poly: Pt[], p: Pt) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}

/** Where the real rover stood in the day 3 photo, on the ground under its middle, and which way it faced (0 = away
    from the camera): fitted to its panel's corners and the wheels you can see, in the photo's own pixels. */
const START = { p: toGround(LENS, { x: 423.7, y: 615.3 }), heading: (198.2 * Math.PI) / 180 }
/** The same for the days 8 to 10 photo, at Yogi (fitted to its panel's corners). Park inside this ring; at the end
    the rover drives to its middle and turns to this heading, so the drawing lands on the real rover as that photo
    comes up. */
const REAL_SPOT = toGround(LENS, { x: 655, y: 272 })
const REAL_HEADING = (-94 * Math.PI) / 180
const RING = { c: REAL_SPOT, r: 0.32 }
/** The lander's camera looks steeply down, and the game's ground mapping treats it as level. On the ground that is
    close enough, but things standing up come out too short near the bottom of the photo and too tall near the top.
    So the drawn rover's heights are corrected by how far up the photo it stands, fitted to the real rover in both
    photos: at the start they show at 0.62, at Yogi at 1.6. */
function cameraFix(row: number) {
  const e = Math.min(1.2, Math.max(-0.2, (615.3 - row) / (615.3 - 272)))
  return { tall: 0.62 + (1.6 - 0.62) * e, size: 1 }
}
/** The rover's size for bumping into things, and how far apart its wheel tracks are (the drawing is in
    sojournerDraw.ts, sized on the real rover in the day 3 photo, so it sits on it at the start). */
const ROVER = { r: 0.23, track: 0.2 }

const FIRST_DAY = 3
const REAL_DAY = 6
const MAX_STOPS = 3
const SPEED = 0.5 // m a second in the game (the real rover: about 1 cm a second)
const TURN = 2.4 // radians a second
const DELAY = 2.6 // seconds the commands take to reach Mars, in the game (really 10 to 15 minutes)
const NIGHT = 1.1 // seconds of night between days
const STEER = 9 // how fast the front and rear wheels swing in or straighten (per second, eased)

/** Small bumps in the ground under each wheel, from a fixed pattern of where it is, so the rover rocks over the same
    stones every time it passes. Drawing only: the photo's ground has no height data. */
const bumpAt = (g: Pt) => 0.006 * (Math.sin(g.x * 23 + g.y * 7) + 0.6 * Math.sin(g.x * 11 - g.y * 19) + 0.4 * Math.sin(g.y * 31 + g.x * 3))

type Phase = 'plan' | 'send' | 'drive' | 'night' | 'done'
type Bump = { rock: Rock | null; lander: boolean } | null

/** The lander itself (its ramp and an airbag fill the bottom corners): no stops, no driving. */
function onLander(p: Pt) {
  if (p.x < 330) return p.y > 745
  if (p.x > 690) return p.y > 700
  return p.y > 790
}
const offPhoto = (p: Pt) => p.x < 8 || p.x > PHOTO.w - 8 || p.y < 110 || p.y > PHOTO.h - 4

// The longest news lines, sitting invisibly under the shown one so the controls keep one height (on phones that
// height sets the photo's size, so a line that grew used to shift the photo). Keep the longest of any new line here.
const RESERVE = [
  'You can’t steer me live. Pick spots on the lander’s photo to plan my whole drive, then send it.',
  'That’s Yogi, or ground hidden behind it. Pick a spot in the ring beside it.',
  'Sending. Real commands took 10 to 15 minutes to reach me. Here, a few seconds.',
  'In the ring on day 12. The real me reached Yogi on day 6, and drove a wheel right up onto it.',
  'My wheel drove up onto Yogi. The real me did that too, on day 6. Back me off and try again.',
  'Not in the ring yet. I slip a little, and I only know where I am by counting wheel turns.',
  'On day 4 a real driver wrote: “We should take the time to learn how to drive on Mars.”',
  'My gyro drifted left when I turned. Aim a little to the right, and keep the last drive short.',
  'Here’s the lander’s real photo from days 8 to 10: the real me beside Yogi, with my real tracks.',
].map((t) => item('goal', t, 'good'))
const STAGES = ['Drive me to Yogi.', 'Day 10. Not there yet.', 'Parked at Yogi.']

const HEADING = (phase: Phase, day: number) => (phase === 'done' ? 'Parked at Yogi.' : day === FIRST_DAY ? 'Drive me to Yogi.' : `Day ${day}. Not there yet.`)

function DishIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19.5 L9 13.5 M4.5 9 A8 8 0 0 0 15 19.5 Z M14.5 4.5 A5 5 0 0 1 19.5 9.5 M14.5 1.5 A8 8 0 0 1 22.5 9.5" />
    </svg>
  )
}

export default function DrivePlan() {
  const [phase, setPhase] = useState<Phase>('plan')
  const [day, setDay] = useState(FIRST_DAY)
  const [stops, setStops] = useState(0)
  const [news, setNews] = useState<News>(() =>
    item('path', 'You can’t steer me live. Pick spots on the lander’s photo to plan my whole drive, then send it.'),
  )
  const [said, setSaid] = useState('')
  const [keying, setKeying] = useState(false)

  const rootRef = useRef<HTMLElement>(null)
  const shakeRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const yogiImgRef = useRef<HTMLImageElement>(null)
  const nightRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)
  const pulseRef = useRef<HTMLSpanElement>(null)

  // Everything the loop reads lives in refs, so a drive never re-renders React.
  const sim = useRef({
    t: 0,
    phase: 'plan' as Phase,
    phaseT: 0,
    day: FIRST_DAY,
    pose: { p: { ...START.p }, heading: START.heading },
    /** Where today's plan starts, and its stops (ground m). */
    from: { ...START.p },
    stops: [] as Pt[],
    // The drive under way: which stop, turning or rolling, and where this leg really ends (slips included)
    leg: 0,
    turning: true,
    goal: { heading: 0, left: 0 },
    bump: null as Bump,
    /** Every wheel track so far: points with the rover's heading there. */
    tracks: [[{ p: { ...START.p }, h: START.heading }]] as { p: Pt; h: number }[][],
    cursor: toGround(LENS, { x: 560, y: 420 }),
    pointer: null as Pt | null,
    flash: null as { rock: Rock | null; t0: number } | null,
    ringPop: -9,
    /** 0 = the day 3 photo with the drawing on it; 1 = the real photo of the rover at Yogi, drawing gone. */
    reveal: 0,
    misses: 0,
    revealTold: false,
    /** The night has passed its middle and the day has counted on. */
    dayTurned: false,
    // How the rover looks while it moves (sojournerDraw.ts)
    spinL: 0,
    spinR: 0,
    steer: 0,
    lift: [0, 0, 0, 0, 0, 0],
    liftTo: [0, 0, 0, 0, 0, 0],
    arm: 0,
    glowT: -9,
    joltT: -9,
    dipT: -9,
    dust: [] as { g: Pt; up: number; vx: number; vz: number; age: number; life: number }[],
    /** Parked: the last moves into place beside Yogi, then the sensor reaches out. */
    end: { moves: [] as ({ turn: number } | { roll: number })[], studyT: -1, told: false },
  })
  const kick = useRef<() => void>(() => {})
  const layout = useRef({ s: 1, ox: 0, oy: 0 })
  const shake = useRef(0)

  function toPhase(p: Phase) {
    sim.current.phase = p
    sim.current.phaseT = 0
    setPhase(p)
  }

  function popDay() {
    if (dayRef.current && !prefersReducedMotion())
      dayRef.current.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }

  /** Why a spot can't be a stop, or null if it can. */
  function refuse(g: Pt): News | null {
    const ph = toPhoto(LENS, g)
    if (onLander(ph)) return item('rock', 'That’s my lander. Pick a spot out on the ground.')
    if (offPhoto(ph)) return item('rock', 'Too far for one day. Pick a spot nearer Yogi.')
    const k = inside(YOGI_OUTLINE, ph) ? YOGI : rockAt(ROCKS, g, 0.04)
    if (k === YOGI) return item('rock', 'That’s Yogi, or ground hidden behind it. Pick a spot in the ring beside it.')
    if (k === BILL) return item('rock', 'That’s Barnacle Bill, the rock I studied first. Pick a spot on the ground.')
    if (k) return item('rock', 'That’s a rock. Pick a spot on the open ground.')
    return null
  }

  function addStop(g: Pt) {
    const s = sim.current
    if (s.phase !== 'plan') return
    if (s.stops.length >= MAX_STOPS) {
      setNews(item('path', `${MAX_STOPS} stops is plenty for one day. Send the plan, or take one back.`))
      return
    }
    const no = refuse(g)
    if (no) {
      setNews(no)
      return
    }
    s.stops.push(g)
    setStops(s.stops.length)
    const inRing = dist(g, RING.c) <= RING.r
    setNews(
      inRing
        ? item('path', `Stop ${s.stops.length} is in the ring. Send the plan when it’s ready.`)
        : item('path', s.stops.length < MAX_STOPS ? `Stop ${s.stops.length} set. Add another, or send the plan.` : `Stop ${s.stops.length} set. Send the plan.`),
    )
    kick.current()
  }

  function undo() {
    const s = sim.current
    if (s.phase !== 'plan' || !s.stops.length) return
    s.stops.pop()
    setStops(s.stops.length)
    setNews(item('path', s.stops.length ? `Stop ${s.stops.length + 1} taken back.` : 'All stops taken back. Tap the ground to plan again.'))
    kick.current()
  }

  function send() {
    const s = sim.current
    if (s.phase !== 'plan' || !s.stops.length) return
    toPhase('send')
    setNews(item('radio', 'Sending. Real commands took 10 to 15 minutes to reach me. Here, a few seconds.'))
    kick.current()
  }

  /** Start the next leg of the drive: turn to face the stop, then roll. The turn always ends a little to the left. */
  function startLeg() {
    const s = sim.current
    const to = s.stops[s.leg]
    const slip = ((2 + Math.random() * 3) * Math.PI) / 180
    s.goal = { heading: headingTo(s.pose.p, to) - slip, left: dist(s.pose.p, to) * (0.94 + Math.random() * 0.12) }
    s.turning = true
    s.tracks.push([{ p: { ...s.pose.p }, h: s.pose.heading }])
  }

  function endDay() {
    const s = sim.current
    const parked = !s.bump && dist(s.pose.p, RING.c) <= RING.r
    if (parked) {
      toPhase('done')
      s.ringPop = s.t
      // Into the real rover's place: face (or back) towards the middle of the ring, roll there, turn the way the real
      // rover stands, so the sensor on its back is towards Yogi
      const d = dist(s.pose.p, REAL_SPOT)
      const moves: ({ turn: number } | { roll: number })[] = []
      if (d > 0.03) {
        const toward = headingTo(s.pose.p, REAL_SPOT)
        const off = Math.atan2(Math.sin(toward - s.pose.heading), Math.cos(toward - s.pose.heading))
        const back = Math.abs(off) > Math.PI / 2
        moves.push({ turn: back ? toward + Math.PI : toward }, { roll: back ? -d : d })
      }
      moves.push({ turn: REAL_HEADING })
      s.end = { moves, studyT: -1, told: false }
      shake.current = Math.min(1, shake.current + 0.3)
      setNews(item('goal', `In the ring on day ${s.day}. The real me reached Yogi on day ${REAL_DAY}, and drove a wheel right up onto it.`, 'good'))
      return
    }
    s.misses += 1
    const b = s.bump
    if (b?.rock === YOGI) setNews(item('bump', 'My wheel drove up onto Yogi. The real me did that too, on day 6. Back me off and try again.'))
    else if (b?.lander) setNews(item('bump', 'I bumped into my lander, so I stopped. Plan again tomorrow.'))
    else if (b) setNews(item('bump', 'My bumper touched a rock, so I stopped the drive. Plan again tomorrow.'))
    else if (s.misses === 1)
      setNews(item('sol', 'Not in the ring yet. I slip a little, and I only know where I am by counting wheel turns.'))
    else if (s.misses === 2) setNews(item('sol', 'On day 4 a real driver wrote: “We should take the time to learn how to drive on Mars.”'))
    else if (s.misses === 3) setNews(item('sol', 'My gyro drifted left when I turned. Aim a little to the right, and keep the last drive short.'))
    else setNews(item('sol', 'Drivers only saw where I really got to in the lander’s photos at the end of the day.'))
    s.dayTurned = false
    toPhase('night')
  }

  function nextDay() {
    const s = sim.current
    s.day += 1
    setDay(s.day)
    popDay()
    s.stops = []
    setStops(0)
    s.from = { ...s.pose.p }
    s.bump = null
    s.liftTo = [0, 0, 0, 0, 0, 0] // overnight the wheel comes back down off Yogi
  }

  function again() {
    const s = sim.current
    s.day = FIRST_DAY
    setDay(FIRST_DAY)
    s.pose = { p: { ...START.p }, heading: START.heading }
    s.from = { ...START.p }
    s.stops = []
    setStops(0)
    s.tracks = [[{ p: { ...START.p }, h: START.heading }]]
    s.bump = null
    s.flash = null
    s.misses = 0
    s.reveal = 0
    s.revealTold = false
    s.lift = [0, 0, 0, 0, 0, 0]
    s.liftTo = [0, 0, 0, 0, 0, 0]
    s.arm = 0
    s.steer = 0
    s.dust = []
    s.end = { moves: [], studyT: -1, told: false }
    toPhase('plan')
    setNews(item('path', 'Back to day 3. Plan my drive to Yogi.'))
    kick.current()
  }

  // Keep the handlers the loop calls current
  const fns = useRef({ startLeg, endDay, nextDay })
  fns.current = { startLeg, endDay, nextDay }

  /** Describe a spot for screen readers, from the things around it. */
  function describe(g: Pt) {
    const no = refuse(g)
    if (no) return `Cursor: ${no.text.split('.')[0].toLowerCase()}.`
    if (dist(g, RING.c) <= RING.r) return 'Cursor: inside the ring beside Yogi.'
    const dy = dist(g, { x: YOGI.X, y: YOGI.Z }) - YOGI.R
    const dm = dist(g, sim.current.pose.p)
    return dy < dm ? 'Cursor: on open ground, nearer Yogi than me.' : 'Cursor: on open ground, nearer me than Yogi.'
  }

  const keyingRef = useRef(false)
  keyingRef.current = keying
  const addStopRef = useRef(addStop)
  addStopRef.current = addStop
  const sendRef = useRef(send)
  sendRef.current = send

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!root || !canvas || !ctx) return
    const reduced = prefersReducedMotion()
    const s = sim.current
    const css = getComputedStyle(root)
    const SUN = css.getPropertyValue('--color-sun').trim() || '#f2e2c2'
    const BRIGHT = css.getPropertyValue('--color-sun-bright').trim() || '#fff1d6'
    const INK = css.getPropertyValue('--color-ink').trim() || '#1f140e'
    const WARN = css.getPropertyValue('--color-warn').trim() || '#ff9e6e'
    const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif'

    let w = 0
    let h = 0
    /** Fit the photo: on phones across the top, above the words; on wide screens to the right of them. */
    const place = () => {
      const hud = hudRef.current
      const photo = photoRef.current
      if (!hud || !photo) return
      const W = root.clientWidth
      const H = root.clientHeight
      let sc: number
      let ox: number
      let oy: number
      if (isNarrow()) {
        const room = Math.max(H * 0.3, Math.min(((W * PHOTO.h) / PHOTO.w) * 1.2, H - hud.offsetHeight - 8, H * 0.62))
        sc = Math.max(W / PHOTO.w, room / PHOTO.h)
        // Keep the rover, the ring and Yogi in view: centre on the middle of the drive
        ox = Math.min(0, Math.max(W - sc * PHOTO.w, W / 2 - sc * PHOTO.w * 0.56))
        oy = Math.min(0, Math.max(room - sc * PHOTO.h, room / 2 - sc * PHOTO.h * 0.47))
        root.style.setProperty('--photo-h', `${room}px`)
      } else {
        const left = hud.getBoundingClientRect().right - root.getBoundingClientRect().left + 16
        sc = Math.min((W - left) / PHOTO.w, H / PHOTO.h)
        ox = W - sc * PHOTO.w
        oy = (H - sc * PHOTO.h) / 2
        root.style.removeProperty('--photo-h')
        root.style.setProperty('--photo-left', `${ox}px`)
      }
      layout.current = { s: sc, ox, oy }
      photo.style.transform = `translate3d(${ox}px, ${oy}px, 0) scale(${sc})`
    }
    const resize = () => {
      place()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    // Ground m → screen px
    const scr = (g: Pt, up = 0) => {
      const p = toPhoto(LENS, g, up)
      const L = layout.current
      return { x: L.ox + p.x * L.s, y: L.oy + p.y * L.s }
    }
    const metre = (g: Pt) => pxPerMetre(LENS, g) * layout.current.s
    /** A wheel's spot on the ground, from the rover's pose. */
    const wheelAt = (wh: { u: number; v: number }) => {
      const hd = s.pose.heading
      return { x: s.pose.p.x + Math.sin(hd) * wh.u + Math.cos(hd) * wh.v, y: s.pose.p.y + Math.cos(hd) * wh.u - Math.sin(hd) * wh.v }
    }
    // One soft dust blot, drawn once and stamped for every puff
    const puff = document.createElement('canvas')
    puff.width = puff.height = 48
    {
      const pc = puff.getContext('2d')!
      const g = pc.createRadialGradient(24, 24, 0, 24, 24, 24)
      g.addColorStop(0, 'rgba(226,214,196,1)')
      g.addColorStop(0.5, 'rgba(214,200,180,0.5)')
      g.addColorStop(1, 'rgba(200,186,166,0)')
      pc.fillStyle = g
      pc.fillRect(0, 0, 48, 48)
    }

    function line(pts: Pt[], width: number, color: string, dash: number[] = [], offset = 0) {
      if (pts.length < 2) return
      ctx!.setLineDash(dash)
      ctx!.lineDashOffset = offset
      ctx!.lineWidth = width
      ctx!.strokeStyle = color
      ctx!.beginPath()
      pts.forEach((p, i) => (i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y)))
      ctx!.stroke()
      ctx!.setLineDash([])
    }

    /** A circle on the ground, as the camera sees it. */
    function groundCircle(c: Pt, r: number) {
      const pts: Pt[] = []
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2
        pts.push(scr({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r }))
      }
      return pts
    }

    function label(text: string, at: Pt) {
      const size = isNarrow() ? 12 : 14
      ctx!.font = `800 ${size}px ${FONT}`
      const tw = ctx!.measureText(text).width
      const pw = tw + size * 1.1
      const ph = size * 1.75
      at = { x: Math.min(w - pw / 2 - 6, Math.max(pw / 2 + 6, at.x)), y: at.y }
      ctx!.fillStyle = 'rgba(0,0,0,0.35)'
      ctx!.beginPath()
      ctx!.roundRect(at.x - pw / 2, at.y - ph / 2 + 2, pw, ph, ph * 0.3)
      ctx!.fill()
      ctx!.fillStyle = INK
      ctx!.beginPath()
      ctx!.roundRect(at.x - pw / 2, at.y - ph / 2, pw, ph, ph * 0.3)
      ctx!.fill()
      ctx!.fillStyle = SUN
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      ctx!.fillText(text, at.x, at.y + 1)
    }

    function disc(at: Pt, n: number, faint = false) {
      const r = isNarrow() ? 10 : 12
      ctx!.globalAlpha *= faint ? 0.6 : 1
      ctx!.fillStyle = 'rgba(20,12,8,0.55)'
      ctx!.beginPath()
      ctx!.arc(at.x, at.y + 1.5, r + 2.5, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = BRIGHT
      ctx!.beginPath()
      ctx!.arc(at.x, at.y, r, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = INK
      ctx!.font = `800 ${isNarrow() ? 13 : 15}px ${FONT}`
      ctx!.textAlign = 'center'
      ctx!.textBaseline = 'middle'
      ctx!.fillText(String(n), at.x, at.y + 1)
      ctx!.globalAlpha /= faint ? 0.6 : 1
    }

    function draw() {
      if (!w || !h) return
      ctx!.clearRect(0, 0, w, h)
      ctx!.lineJoin = 'round'
      ctx!.lineCap = 'round'
      const fade = 1 - s.reveal
      if (fade <= 0.001) return
      ctx!.globalAlpha = fade

      // The ring where the real rover parked, with the two rocks named as NASA names them
      const pop = Math.max(0, 1 - (s.t - s.ringPop) / 0.5)
      const ring = groundCircle(RING.c, RING.r * (1 + 0.25 * pop * pop))
      ctx!.fillStyle = s.phase === 'done' ? 'rgba(255,241,214,0.28)' : 'rgba(255,241,214,0.14)'
      ctx!.beginPath()
      ring.forEach((p, i) => (i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y)))
      ctx!.fill()
      line(ring, 5, 'rgba(20,12,8,0.5)')
      line(ring, 2.5, BRIGHT, s.phase === 'done' ? [] : [7, 6])
      label('Yogi', scr({ x: YOGI.X + 0.1, y: YOGI.Z }, 0.62))
      label('Barnacle Bill', scr({ x: BILL.X, y: BILL.Z }, 0.42))

      // Wheel tracks: two dark lines, one under each side, with the marks of the wheel cleats across them where
      // they are near enough to see
      for (const tr of s.tracks) {
        if (tr.length < 2) continue
        for (const side of [-1, 1]) {
          const ground = tr.map(({ p, h: hd }) => ({ x: p.x + side * ROVER.track * Math.cos(hd), y: p.y - side * ROVER.track * Math.sin(hd), hd }))
          line(
            ground.map((g) => scr(g)),
            Math.max(1.5, 0.045 * metre(tr[tr.length - 1].p)),
            'rgba(16,10,6,0.42)',
          )
          let run = 0
          for (let i = 1; i < ground.length; i++) {
            const a = ground[i - 1]
            const b = ground[i]
            const len = dist(a, b)
            if (metre(b) < 160) {
              run = 0
              continue
            }
            for (run += len; run >= 0.045; run -= 0.045) {
              const k = 1 - (run - 0.045) / Math.max(len, 1e-6)
              const at = { x: a.x + (b.x - a.x) * Math.min(1, k), y: a.y + (b.y - a.y) * Math.min(1, k) }
              const cx = Math.cos(b.hd) * 0.025
              const cz = -Math.sin(b.hd) * 0.025
              line([scr({ x: at.x - cx, y: at.y - cz }), scr({ x: at.x + cx, y: at.y + cz })], 1.2, 'rgba(16,10,6,0.35)')
            }
          }
        }
      }

      // Today's plan: a dashed line through numbered stops. It marches while the commands travel to Mars.
      if (s.phase === 'plan' || s.phase === 'send' || s.phase === 'drive') {
        const pts = [s.from, ...s.stops].map((g) => scr(g))
        const march = s.phase === 'send' && !reduced ? -s.phaseT * 40 : 0
        line(pts, 5.5, 'rgba(20,12,8,0.55)')
        line(pts, 2.5, BRIGHT, [8, 7], march)
        // Where the next stop would go: a lighter line to the cursor
        const aim = s.phase === 'plan' && s.stops.length < MAX_STOPS ? (s.pointer ?? (keyingRef.current ? s.cursor : null)) : null
        if (aim) {
          const last = scr(s.stops[s.stops.length - 1] ?? s.from)
          const a = scr(aim)
          const bad = !!refuse(aim)
          line([last, a], 4.5, 'rgba(20,12,8,0.4)')
          line([last, a], 2, bad ? WARN : 'rgba(255,241,214,0.7)', [4, 6])
          const r = Math.max(7, ROVER.r * 0.55 * metre(aim))
          ctx!.lineWidth = 2.5
          ctx!.strokeStyle = bad ? WARN : BRIGHT
          ctx!.beginPath()
          if (bad) {
            ctx!.moveTo(a.x - r * 0.6, a.y - r * 0.6)
            ctx!.lineTo(a.x + r * 0.6, a.y + r * 0.6)
            ctx!.moveTo(a.x + r * 0.6, a.y - r * 0.6)
            ctx!.lineTo(a.x - r * 0.6, a.y + r * 0.6)
          } else ctx!.ellipse(a.x, a.y, r, r * 0.55, 0, 0, Math.PI * 2)
          ctx!.stroke()
        }
        s.stops.forEach((g, i) => disc(scr(g), i + 1, s.phase === 'drive' && i < s.leg))
      }

      // A rock the bumper just touched: its outline in orange, fading
      if (s.flash) {
        const e = (s.t - s.flash.t0) / 1.6
        if (e < 1) {
          const k = s.flash.rock
          ctx!.globalAlpha = fade * (1 - e)
          if (k === YOGI) {
            const L = layout.current
            line([...YOGI_OUTLINE, YOGI_OUTLINE[0]].map((p) => ({ x: L.ox + p.x * L.s, y: L.oy + p.y * L.s })), 3, WARN)
          } else if (k) {
            const c = scr({ x: k.X, y: k.Z })
            const rx = k.R * metre({ x: k.X, y: k.Z })
            ctx!.lineWidth = 3
            ctx!.strokeStyle = WARN
            ctx!.beginPath()
            ctx!.ellipse(c.x, c.y - rx * 0.35, rx * 1.05, rx * 0.75, 0, 0, Math.PI * 2)
            ctx!.stroke()
          }
          ctx!.globalAlpha = fade
        }
      }

      // Dust off the wheels: soft puffs that rise a little, grow and fade
      for (const d of s.dust) {
        const e = d.age / d.life
        const at = scr(d.g, d.up)
        const r = (0.03 + 0.09 * e) * metre(d.g)
        ctx!.globalAlpha = fade * 0.6 * (1 - e) * Math.min(1, d.age * 8)
        ctx!.drawImage(puff, at.x - r, at.y - r, r * 2, r * 2)
      }
      ctx!.globalAlpha = fade

      // Me: drawn from simple shapes in the photo's perspective. A bumper touch jolts me back a little and I settle.
      const je = (s.t - s.joltT) / 0.35
      const jolt = reduced || je >= 1 ? 0 : -0.035 * Math.sin(je * Math.PI) * (1 - je)
      const de = (s.t - s.dipT) / 0.45
      const look: RoverLook = {
        spinL: s.spinL,
        spinR: s.spinR,
        steer: s.steer,
        ground: WHEELS.map((wh) => (reduced ? 0 : bumpAt(wheelAt(wh)))),
        lift: s.lift,
        arm: s.arm,
        glow: Math.max(0, 1 - (s.t - s.glowT) / 0.9),
        touch: s.end.studyT >= 0 && s.arm > 0.98 && !reduced ? ((s.t - s.end.studyT) / 1.2) % 1 : 0,
        dip: reduced || de >= 1 ? 0 : -0.06 * Math.sin(de * Math.PI) * (1 - de),
      }
      const at = { x: s.pose.p.x + Math.sin(s.pose.heading) * jolt, y: s.pose.p.y + Math.cos(s.pose.heading) * jolt }
      const fix = cameraFix(toPhoto(LENS, at).y)
      const roverScr = (g: Pt, up = 0) => {
        const q = scr(g)
        return { x: q.x, y: q.y - up * metre(g) * fix.tall }
      }
      drawSojourner(ctx!, roverScr, metre(at) * fix.size, LENS.h, at, s.pose.heading, look, { sun: SUN, bright: BRIGHT, ink: INK }, fix.size)
      ctx!.globalAlpha = 1
    }

    let raf = 0
    let last = 0
    let visible = false
    let st = 0
    const frame = (now: number) => {
      step(Math.min(0.05, last ? (now - last) / 1000 : 0))
      last = now
      raf = visible ? requestAnimationFrame(frame) : 0
    }

    /** Turning in place: the front and rear wheels swing in first, then the two sides turn opposite ways. True once
        facing `target`. */
    function turnTo(target: number, dt: number) {
      s.steer = Math.min(1, s.steer + (1 - s.steer) * Math.min(1, dt * STEER) + dt)
      let d = target - s.pose.heading
      d = Math.atan2(Math.sin(d), Math.cos(d))
      if (s.steer < 0.97) return false
      const turn = Math.sign(d) * Math.min(Math.abs(d), TURN * dt)
      s.pose.heading += turn
      // the wheels roll round a circle about 0.3 m out: forward on one side, back on the other
      s.spinL += (turn * 0.3) / WHEEL_R
      s.spinR -= (turn * 0.3) / WHEEL_R
      dustRate((Math.abs(turn) * 0.3) / Math.max(dt, 1e-4), dt)
      if (Math.abs(d) <= TURN * dt) {
        s.pose.heading = target
        return true
      }
      return false
    }
    /** The front and rear wheels straighten; true once straight. */
    function straighten(dt: number) {
      s.steer = Math.max(0, s.steer - s.steer * Math.min(1, dt * STEER) - dt)
      return s.steer < 0.03
    }
    /** Puffs off the wheels, as many as the wheels are moving fast (none under reduced motion). */
    let owed = 0
    function dustRate(speed: number, dt: number) {
      owed += Math.min(1, speed / SPEED) * 22 * dt
      const n = Math.floor(owed)
      owed -= n
      kickDust(n)
    }
    function kickDust(n: number) {
      if (reduced) return
      for (let i = 0; i < n && s.dust.length < 90; i++) {
        const wh = WHEELS[Math.floor(Math.random() * 6)]
        const g = wheelAt(wh)
        const a = Math.random() * Math.PI * 2
        const sp = 0.04 + Math.random() * 0.1
        s.dust.push({ g, up: 0.02, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, age: 0, life: 0.8 + Math.random() * 0.7 })
      }
    }

    /** One step: the commands travel, the rover turns and rolls, the night passes, the real photo arrives. */
    function step(dt: number) {
      s.t += dt
      s.phaseT += dt
      if (s.phase === 'send' && s.phaseT >= DELAY) {
        s.leg = 0
        s.phase = 'drive'
        s.phaseT = 0
        setPhase('drive')
        setNews(item('path', 'Driving myself. I count my wheel turns to know where I am.'))
        s.glowT = s.t
        fns.current.startLeg()
      }
      if (s.phase === 'drive') {
        if (s.turning) {
          if (turnTo(s.goal.heading, dt)) s.turning = false
          s.tracks[s.tracks.length - 1].push({ p: { ...s.pose.p }, h: s.pose.heading })
        } else if (!straighten(dt)) {
          // the front and rear wheels straighten before it rolls
        } else {
          const move = Math.min(s.goal.left, SPEED * dt)
          const next = { x: s.pose.p.x + Math.sin(s.pose.heading) * move, y: s.pose.p.y + Math.cos(s.pose.heading) * move }
          const k = inside(YOGI_OUTLINE, toPhoto(LENS, next)) ? YOGI : rockAt(ROCKS, next, ROVER.r)
          const lander = onLander(toPhoto(LENS, next)) || offPhoto(toPhoto(LENS, next))
          if (k || lander) {
            s.bump = { rock: k, lander: !k && lander }
            s.flash = { rock: k, t0: s.t }
            s.joltT = s.t
            kickDust(10)
            // Into Yogi, the wheel nearest it climbs up onto the rock (as the real rover's left rear wheel did)
            if (k === YOGI) {
              const near = WHEELS.map((wh, i) => [i, dist(wheelAt(wh), { x: YOGI.X, y: YOGI.Z })]).sort((a, b) => a[1] - b[1])[0][0]
              s.liftTo = s.liftTo.map((_, i) => (i === near ? 0.07 : 0))
            }
            shake.current = Math.min(1, shake.current + (k === YOGI ? 0.55 : 0.4))
            fns.current.endDay()
          } else {
            s.pose.p = next
            s.goal.left -= move
            s.spinL += move / WHEEL_R
            s.spinR += move / WHEEL_R
            dustRate(move / dt, dt)
            const tr = s.tracks[s.tracks.length - 1]
            const lastPt = tr[tr.length - 1]
            if (dist(lastPt.p, next) > 0.03) tr.push({ p: { ...next }, h: s.pose.heading })
            if (s.goal.left <= 1e-4) {
              tr.push({ p: { ...next }, h: s.pose.heading })
              s.dipT = s.t
              s.leg += 1
              if (s.leg < s.stops.length) fns.current.startLeg()
              else fns.current.endDay()
            }
          }
        }
      }
      // The commands on their way: a light crossing from Earth to Mars over the delay (in steps under reduced motion)
      if (pulseRef.current) {
        const e = s.phase === 'send' ? Math.min(1, s.phaseT / DELAY) : 0
        pulseRef.current.style.left = `${(reduced ? Math.floor(e * 4) / 4 : e) * 100}%`
        pulseRef.current.style.opacity = s.phase === 'send' ? '1' : '0'
      }

      // Parked: the last moves into place, then the sensor on my back reaches out to Yogi and studies it
      if (s.phase === 'done' && s.reveal === 0) {
        const m = s.end.moves[0]
        if (m && 'turn' in m) {
          if (turnTo(m.turn, dt)) s.end.moves.shift()
        } else if (m && 'roll' in m) {
          if (straighten(dt)) {
            const move = Math.sign(m.roll) * Math.min(Math.abs(m.roll), SPEED * 0.6 * dt)
            s.pose.p = { x: s.pose.p.x + Math.sin(s.pose.heading) * move, y: s.pose.p.y + Math.cos(s.pose.heading) * move }
            m.roll -= move
            s.spinL += move / WHEEL_R
            s.spinR += move / WHEEL_R
            dustRate(Math.abs(move) / dt, dt)
            s.tracks[s.tracks.length - 1].push({ p: { ...s.pose.p }, h: s.pose.heading })
            if (Math.abs(m.roll) < 1e-4) {
              s.end.moves.shift()
              s.dipT = s.t
            }
          }
        } else if (straighten(dt)) {
          s.arm = reduced ? 1 : Math.min(1, s.arm + dt / 0.8)
          if (s.arm >= 1 && s.end.studyT < 0) s.end.studyT = s.t
          if (s.end.studyT >= 0 && !s.end.told) {
            s.end.told = true
            setNews(item('goal', 'Now the sensor on my back touches Yogi, to find out what it is made of.', 'good'))
          }
        }
      }

      // The look eases: a wheel up on a rock comes down slowly, the dust drifts and fades
      for (let i = 0; i < 6; i++) s.lift[i] += (s.liftTo[i] - s.lift[i]) * Math.min(1, dt * (s.liftTo[i] > s.lift[i] ? 14 : 3))
      for (const d of s.dust) {
        d.age += dt
        d.g = { x: d.g.x + d.vx * dt, y: d.g.y + d.vz * dt }
        d.vx *= Math.exp(-2 * dt)
        d.vz *= Math.exp(-2 * dt)
        d.up += 0.05 * dt
      }
      s.dust = s.dust.filter((d) => d.age < d.life)

      // Night: the photo darkens, the day counts on, morning brings a new plan
      let dark = 0
      if (s.phase === 'night') {
        const e = s.phaseT / NIGHT
        dark = reduced ? (e < 1 ? 0.45 : 0) : 0.55 * Math.sin(Math.min(1, e) * Math.PI)
        if (e >= 0.5 && !s.dayTurned) {
          s.dayTurned = true
          fns.current.nextDay()
        }
        if (e >= 1) toPhase('plan')
      }
      if (nightRef.current) nightRef.current.style.opacity = dark.toFixed(3)
      // Parked: the real photo of the rover at Yogi comes up and the drawing goes
      if (s.phase === 'done' && s.end.studyT >= 0 && s.t - s.end.studyT > 2.6) {
        s.reveal = reduced ? 1 : Math.min(1, s.reveal + dt / 1.2)
        if (!s.revealTold && s.reveal > 0.5) {
          s.revealTold = true
          setNews(item('goal', 'Here’s the lander’s real photo from days 8 to 10: the real me beside Yogi, with my real tracks.', 'good'))
        }
      }
      if (yogiImgRef.current) yogiImgRef.current.style.opacity = s.reveal.toFixed(3)

      shake.current = Math.max(0, shake.current - 1.6 * dt)
      st += dt * 30
      const sh = reduced ? 0 : shake.current * shake.current
      if (shakeRef.current) shakeRef.current.style.transform = sh > 0.001 ? `translate3d(${(8 * sh * Math.sin(st * 1.7)).toFixed(2)}px, ${(5 * sh * Math.sin(st * 2.3)).toFixed(2)}px, 0)` : ''
      draw()
    }
    kick.current = () => {
      if (!raf && visible) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) kick.current()
      else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(root)
    const ro = new ResizeObserver(resize)
    ro.observe(root)
    if (hudRef.current) ro.observe(hudRef.current)
    resize()

    if (import.meta.env.DEV)
      (window as unknown as Record<string, unknown>).__drive = {
        sim,
        tap: (x: number, y: number) => addStopRef.current(toGround(LENS, { x, y })),
        send: () => sendRef.current(),
        advance: (sec: number) => {
          for (let i = 0; i < sec * 60; i++) step(1 / 60)
        },
      }
    return () => {
      io.disconnect()
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  /** Screen px → ground m, or null above the horizon. */
  function groundAt(e: React.PointerEvent | React.MouseEvent) {
    const r = rootRef.current!.getBoundingClientRect()
    const L = layout.current
    const p = { x: (e.clientX - r.left - L.ox) / L.s, y: (e.clientY - r.top - L.oy) / L.s }
    if (p.y <= LENS.horizon + 2) return null
    return toGround(LENS, p)
  }

  function moveCursor(dx: number, dy: number) {
    const s = sim.current
    const p = toPhoto(LENS, s.cursor)
    const step = 14
    const q = { x: Math.min(PHOTO.w - 10, Math.max(10, p.x + dx * step)), y: Math.min(PHOTO.h - 6, Math.max(112, p.y + dy * step)) }
    s.cursor = toGround(LENS, q)
    setSaid(describe(s.cursor))
    kick.current()
  }

  const busy = phase !== 'plan'
  const canSend = phase === 'plan' && stops > 0

  return (
    <section ref={rootRef} aria-label="Plan my drive, a rover driving game" className="relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-basalt">
      <div ref={shakeRef} className="absolute inset-0">
        {/* The photo's own frame: on phones the top of the screen above the words, fading into them; on wide
            screens the whole height, fading in from its left edge. The drawing is cut by the same frame. */}
        <div className="absolute inset-x-0 top-0 h-[var(--photo-h,100%)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_86%,transparent)] lg:h-full lg:[mask-image:linear-gradient(to_right,transparent_var(--photo-left,40%),black_calc(var(--photo-left,40%)_+_5rem))]">
        {/* The lander's own photos, sized and placed by the script: day 3 in black and white, then (once parked)
            days 8 to 10 in colour, cut to sit exactly on it. */}
        <div ref={photoRef} className="absolute left-0 top-0 origin-top-left" style={{ width: PHOTO.w, height: PHOTO.h }}>
          <img
            src="photos/sojourner-drive-day3.webp"
            width={PHOTO.w}
            height={PHOTO.h}
            draggable={false}
            alt="A black-and-white photo from the lander on day 3: me just off the ramp, the small rock Barnacle Bill at left and the big rock Yogi at upper right."
            className="absolute inset-0 h-full w-full select-none"
          />
          <img
            ref={yogiImgRef}
            src="photos/sojourner-drive-yogi.webp"
            width={PHOTO.w}
            height={PHOTO.h}
            draggable={false}
            alt={phase === 'done' ? 'The same view in colour, days 8 to 10: the real me beside Yogi, with my real tracks leading up to it.' : ''}
            aria-hidden={phase !== 'done'}
            className="absolute inset-0 h-full w-full select-none"
            style={{ opacity: 0 }}
          />
          <div ref={nightRef} aria-hidden="true" className="absolute inset-0 bg-[#0b0705]" style={{ opacity: 0 }} />
        </div>
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        </div>
        {/* The ground is the control: tap or click a spot for a stop, or move a cursor with the arrow keys */}
        <div
          role="application"
          tabIndex={0}
          aria-label="The lander’s photo. Tap the ground to add a stop, or move with the arrow keys and press Enter."
          aria-describedby="drive-said"
          onClick={(e) => {
            const g = groundAt(e)
            if (g) addStop(g)
          }}
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse') return
            sim.current.pointer = groundAt(e)
            kick.current()
          }}
          onPointerLeave={() => {
            sim.current.pointer = null
            kick.current()
          }}
          onFocus={(e) => setKeying(e.currentTarget.matches(':focus-visible'))}
          onBlur={() => setKeying(false)}
          onKeyDown={(e) => {
            const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
            if (d) {
              e.preventDefault()
              setKeying(true)
              moveCursor(d[0] * (e.shiftKey ? 4 : 1), d[1] * (e.shiftKey ? 4 : 1))
            } else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!e.repeat) addStop(sim.current.cursor)
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault()
              undo()
            }
          }}
          className={`absolute inset-x-0 top-0 h-[var(--photo-h,100%)] outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sun lg:left-[var(--photo-left,40%)] lg:h-full ${busy ? 'cursor-progress' : 'cursor-crosshair'}`}
        />
      </div>

      <div ref={hudRef} className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 lg:inset-y-0 lg:right-auto lg:flex lg:w-[min(34rem,36vw)] lg:flex-col lg:justify-end lg:pb-10">
        <StageHeading
          text={HEADING(phase, day)}
          reserve={STAGES}
          className="text-[clamp(2rem,9vw,4rem)] [@media(max-height:760px)_and_(max-width:1023px)]:hidden [@media(max-height:780px)_and_(min-width:1024px)]:text-[2.75rem]"
        />
        <div className="mt-2 grid text-base sm:text-lg">
          {RESERVE.map((r) => (
            <div key={r.text} aria-hidden="true" className="invisible [grid-area:1/1]">
              <NewsLine item={r} className="" />
            </div>
          ))}
          <div className="[grid-area:1/1]">
            <NewsLine item={news} className="" />
          </div>
        </div>
        <p id="drive-said" className="sr-only" aria-live="polite">
          {said}
        </p>

        {/* The day, beside its label on phones (to leave the photo its room), above it on wide screens */}
        <div className="pointer-events-auto mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:mt-5 lg:items-end lg:justify-start lg:gap-x-8">
          <p className="flex items-baseline gap-2.5 lg:block">
            <span ref={dayRef} className="block origin-left whitespace-nowrap font-display text-[clamp(2.2rem,10vw,4.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em] tabular-nums">
              {day}
            </span>
            <span className="block text-base text-sun/80 lg:mt-2">day on Mars</span>
          </p>
          {phase === 'done' ? (
            <button
              type="button"
              onClick={again}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/40 px-4 font-display text-base font-bold text-sun ring-1 ring-sun/25 transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:ring-sun/60"
            >
              Drive it again
            </button>
          ) : (
            <button
              type="button"
              onClick={undo}
              aria-disabled={busy || stops === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/40 px-3.5 sm:px-4 font-display text-base font-bold text-sun ring-1 ring-sun/25 transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.97] aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:ring-sun/60 [@media(hover:hover)_and_(pointer:fine)]:aria-disabled:hover:ring-sun/25"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 5.5 L4 10 L8.5 14.5 M4.5 10 H14.5 A5 5 0 0 1 14.5 20 H10" />
              </svg>
              Undo
            </button>
          )}
        </div>

        {/* The trip the commands make: Earth to Mars, a light crossing while they travel (dim the rest of the time) */}
          <div aria-hidden="true" data-on={phase === 'send'} className={`${phase === 'done' ? 'invisible' : ''} mt-4 flex max-w-[24rem] items-center gap-2.5 text-sm text-sun/70 opacity-55 transition-opacity duration-200 data-[on=true]:opacity-100 lg:mt-6`}>
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#8fb8de] shadow-[0_0_0_2px_rgb(20_12_8/0.6)]" />
            Earth
            <span className="relative h-[2px] flex-1 rounded-full bg-sun/25">
              <span
                ref={pulseRef}
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sun-bright shadow-[0_0_10px_3px_rgb(255_241_214/0.55)]"
                style={{ left: '0%', opacity: 0 }}
              />
            </span>
            Mars
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#c98a5a] shadow-[0_0_0_2px_rgb(20_12_8/0.6)]" />
          </div>
          <button
            type="button"
            onClick={send}
            // Parked: hidden but keeping its room, so the photo does not move as the ending plays
            aria-disabled={!canSend}
            aria-describedby="drive-help"
            className={`${phase === 'done' ? 'invisible' : ''} pointer-events-auto mt-3 inline-flex min-h-12 w-full select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-sun px-5 font-display text-xl font-extrabold text-ink shadow-[0_6px_0_rgb(150_118_80),0_10px_18px_rgb(0_0_0/0.35)] transition-[transform,box-shadow,background-color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] [-webkit-tap-highlight-color:transparent] aria-[disabled=false]:active:translate-y-[5px] aria-[disabled=false]:active:bg-sun-bright aria-[disabled=false]:active:shadow-[0_1px_0_rgb(150_118_80),0_2px_6px_rgb(0_0_0/0.3)] aria-[disabled=false]:active:duration-75 aria-disabled:cursor-default aria-disabled:bg-sun/35 aria-disabled:shadow-none [@media(hover:hover)_and_(pointer:fine)]:aria-[disabled=false]:hover:bg-sun-bright sm:min-h-14 lg:mt-4 lg:min-h-16 lg:w-auto lg:self-start lg:text-2xl`}
          >
            <DishIcon className="h-6 w-6 shrink-0" />
            {phase === 'send' ? 'On its way to Mars' : phase === 'drive' ? 'Driving' : phase === 'night' ? 'Night on Mars' : 'Send my drive'}
          </button>
        {/* How to plan: the keys while keying; where there is a mouse, how to click and how to reach the keys. On
            touch screens the first news line already says to pick spots on the photo. */}
        <div id="drive-help" className="mt-3 grid gap-1.5">
          {/* While it drives, the hint keeps its room (hidden), so the controls do not jump */}
            <p className={`${busy ? 'invisible' : ''} ${keying ? 'block' : 'hidden [@media(hover:hover)_and_(pointer:fine)]:block'} text-sm leading-[2.1] text-sun/80 sm:text-base`}>
              {keying ? (
                <>
                  Move with{' '}
                  <span className="inline-flex gap-1 align-middle">
                    <Key aria-label="left">←</Key>
                    <Key aria-label="up">↑</Key>
                    <Key aria-label="down">↓</Key>
                    <Key aria-label="right">→</Key>
                  </span>
                  , add a stop with <Key className="px-2 align-middle">Enter</Key>, take one back with <Key className="px-2 align-middle">Backspace</Key>.
                </>
              ) : (
                <>
                  Click the ground to add a stop. Or press <Key className="px-2 align-middle">Tab</Key> to use the keys.
                </>
              )}
            </p>
          <p className="text-sm text-sun/60">Real photos from the lander. My rover and the drive are drawn for the game.</p>
        </div>
      </div>
    </section>
  )
}
