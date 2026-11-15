// Sojourner drawn on the lander's photo, for "Plan my drive". NASA has no 3D model of the rover, so it is built
// here from a few simple 3D shapes, in metres, and projected with the photo's own camera, so it keeps the right size
// and perspective wherever it drives. What the drawing follows (docs/FACTS.md, "Plan my drive"): six wheels on a
// rocker-bogie; the front and rear wheels steer, so it turns in place; wheels 13 cm across; a solar panel of
// 13 strings of 18 cells; the APXS sensor on an arm at the rear. No antenna: where it sat is not checked. Sizes are NASA's (about 28 cm tall, 13 cm wheels), placed by fitting the drawing to the real rover's panel corners
// and wheels in both lander photos.

import type { Pt } from './driveGround'

/** The six wheel hubs in the rover's own frame (u forward, v to its right), m: left front, middle, rear, then right. */
export const WHEELS: { u: number; v: number }[] = [
  { u: 0.33, v: -0.2 },
  { u: -0.08, v: -0.2 },
  { u: -0.24, v: -0.2 },
  { u: 0.33, v: 0.2 },
  { u: -0.08, v: 0.2 },
  { u: -0.24, v: 0.2 },
]
export const WHEEL_R = 0.065
const WHEEL_W = 0.055
const PANEL = { l: 0.3, w: 0.2, up: 0.27, thick: 0.02 }
const BODY = { l: 0.19, w: 0.13, lo: 0.1, hi: 0.25 }

export interface RoverLook {
  /** How far each side's wheels have turned, radians. */
  spinL: number
  spinR: number
  /** 0 = wheels straight; 1 = front and rear wheels set for a turn in place. */
  steer: number
  /** Ground height under each wheel (the bumps), m, in WHEELS order. */
  ground: number[]
  /** Extra lift of each wheel (a wheel up on Yogi), m. */
  lift: number[]
  /** The APXS arm: 0 folded under the rear, 1 reaching out behind. */
  arm: number
  /** The panel's frame lights up as the day's commands arrive, 0..1. */
  glow: number
  /** The sensor touching a rock: a pulse phase that counts up, 0 = no pulse. */
  touch: number
  /** Body dip at the end of a move, radians of pitch. */
  dip: number
}

export interface RoverColours {
  sun: string
  bright: string
  ink: string
}

type Project = (g: Pt, up?: number) => Pt
type V3 = { x: number; z: number; up: number }

/** Lower convex hull + upper hull of screen points (monotone chain). */
function hull(pts: Pt[]) {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y)
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lo: Pt[] = []
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop()
    lo.push(q)
  }
  const hi: Pt[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop()
    hi.push(q)
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1))
}

/**
 * Draw the rover at ground point `p`, facing `heading` (radians, 0 = straight away from the camera).
 * `project(ground, up)` puts a point `up` metres above the ground on screen; `metre` is screen px per metre at the
 * rover; `camH` the camera's height (it stands at ground 0, 0); `size` scales the rover across the ground (the
 * caller's correction for the photo's camera, see DrivePlan).
 */
export function drawSojourner(
  ctx: CanvasRenderingContext2D,
  project: Project,
  metre: number,
  camH: number,
  p: Pt,
  heading: number,
  look: RoverLook,
  c: RoverColours,
  size = 1,
) {
  const fx = Math.sin(heading)
  const fz = Math.cos(heading)
  const sx = Math.cos(heading)
  const sz = -Math.sin(heading)
  const at = (u: number, v: number): Pt => ({ x: p.x + (fx * u + sx * v) * size, y: p.y + (fz * u + sz * v) * size })
  const big = metre * 0.6 // the rover's length on screen
  const detail = big > 70
  const lw = Math.min(2.6, Math.max(1.5, metre * 0.0065))
  const casing = 'rgba(20,12,8,0.55)'

  // The body rides on the wheels: its height, pitch and roll come from the six hubs
  const hub = WHEELS.map((_, i) => WHEEL_R + (look.ground[i] ?? 0) + (look.lift[i] ?? 0))
  const avg = (...i: number[]) => i.reduce((a, k) => a + hub[k], 0) / i.length
  const base = avg(0, 1, 2, 3, 4, 5) - WHEEL_R
  const pitch = (avg(0, 3) - avg(2, 5)) / 0.57 + look.dip
  const roll = (avg(3, 4, 5) - avg(0, 1, 2)) / 0.4
  const lift = (u: number, v: number, up: number) => up + base + pitch * u + roll * v
  const P = (u: number, v: number, up: number) => project(at(u, v), lift(u, v, up))
  const world = (u: number, v: number, up: number): V3 => {
    const g = at(u, v)
    return { x: g.x, z: g.y, up }
  }
  // Does a surface at w with normal (nu, nv, nup) in the rover's frame face the camera?
  const facing = (w: V3, nu: number, nv: number, nup: number) => {
    const nx = fx * nu + sx * nv
    const nz = fz * nu + sz * nv
    return nx * -w.x + nup * (camH - w.up) + nz * -w.z > 0
  }
  const dist = (u: number, v: number) => Math.hypot(at(u, v).x, at(u, v).y)

  function poly(pts: Pt[], fill: string | null, stroke: string | null, width = lw) {
    ctx.beginPath()
    pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.lineWidth = width
      ctx.strokeStyle = stroke
      ctx.stroke()
    }
  }
  function seg(a: Pt, b: Pt, color: string, width: number) {
    ctx.lineWidth = width
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }
  const beam = (a: Pt, b: Pt) => {
    seg(a, b, casing, lw + 2.5)
    seg(a, b, c.sun, lw)
  }

  // The ground shadow, a little wider than the panel
  poly(
    [
      [0.4, -0.25],
      [0.4, 0.25],
      [-0.32, 0.25],
      [-0.32, -0.25],
    ].map(([u, v]) => project(at(u + 0.02, v + 0.02), 0)),
    'rgba(10,6,4,0.34)',
    null,
  )

  function wheel(i: number) {
    const { u, v } = WHEELS[i]
    const corner = i % 3 !== 1
    // Turning in place, the front and rear wheels angle onto the circle round the rover's middle
    let th = corner ? Math.atan2(u, -v) : 0
    if (th > Math.PI / 2) th -= Math.PI
    if (th < -Math.PI / 2) th += Math.PI
    th *= look.steer
    const du = Math.cos(th)
    const dv = Math.sin(th)
    const au = -Math.sin(th)
    const av = Math.cos(th)
    const h = hub[i]
    const spin = i < 3 ? look.spinL : look.spinR
    const rim = (side: number, n: number, off = 0) => {
      const out: Pt[] = []
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * Math.PI * 2
        const cu = u + au * side * (WHEEL_W / 2) + du * WHEEL_R * Math.cos(a)
        const cv = v + av * side * (WHEEL_W / 2) + dv * WHEEL_R * Math.cos(a)
        out.push(project(at(cu, cv), h + WHEEL_R * Math.sin(a)))
      }
      return out
    }
    const inner = rim(-1, 18)
    const outer = rim(1, 18)
    const shape = hull([...inner, ...outer])
    poly(shape, null, casing, lw + 2.5)
    poly(shape, 'rgba(36,26,20,0.92)', c.sun, lw)
    // Cleats across the tread, turning with the wheel, where the tread faces the camera
    if (detail) {
      ctx.globalAlpha *= 0.75
      for (let k = 0; k < 14; k++) {
        const a = spin + (k / 14) * Math.PI * 2
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        const w = world(u + du * WHEEL_R * ca, v + dv * WHEEL_R * ca, h + WHEEL_R * sa)
        if (!facing(w, du * ca, dv * ca, sa)) continue
        const pa = project(at(u - au * (WHEEL_W / 2) + du * WHEEL_R * ca, v - av * (WHEEL_W / 2) + dv * WHEEL_R * ca), h + WHEEL_R * sa)
        const pb = project(at(u + au * (WHEEL_W / 2) + du * WHEEL_R * ca, v + av * (WHEEL_W / 2) + dv * WHEEL_R * ca), h + WHEEL_R * sa)
        seg(pa, pb, c.sun, Math.max(1, lw * 0.6))
      }
      ctx.globalAlpha /= 0.75
    }
    // The face on the camera's side, with its hub
    const side = facing(world(u + au * 0.03, v + av * 0.03, h), au, av, 0) ? 1 : -1
    const face = rim(side, 18)
    poly(face, 'rgba(48,36,28,0.95)', c.sun, Math.max(1, lw * 0.8))
    const centre = project(at(u + au * side * (WHEEL_W / 2), v + av * side * (WHEEL_W / 2)), h)
    ctx.fillStyle = c.sun
    ctx.beginPath()
    ctx.arc(centre.x, centre.y, Math.max(1.2, metre * 0.012), 0, Math.PI * 2)
    ctx.fill()
  }

  // The rocker and bogie on one side: front wheel to a pivot on the body, the pivot to the bogie, the bogie to the
  // middle and rear wheels
  function suspension(sideV: number) {
    const ids = sideV < 0 ? [0, 1, 2] : [3, 4, 5]
    const hubAt = (i: number) => project(at(WHEELS[i].u, WHEELS[i].v), hub[i])
    const pivot = P(0.06, sideV * 0.15, 0.17)
    const bogie = P(-0.16, sideV * 0.2, WHEEL_R + 0.07 - base)
    beam(hubAt(ids[0]), pivot)
    beam(pivot, bogie)
    beam(bogie, hubAt(ids[1]))
    beam(bogie, hubAt(ids[2]))
  }

  function body() {
    const faces: [number, number, number][] = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
    ]
    for (const [nu, nv] of faces) {
      const cu = nu * BODY.l
      const cv = nv * BODY.w
      if (!facing(world(cu, cv, BODY.lo), nu, nv, 0)) continue
      const tu = nv !== 0 ? BODY.l : 0
      const tv = nu !== 0 ? BODY.w : 0
      poly(
        [P(cu - tu, cv - tv, BODY.lo), P(cu + tu, cv + tv, BODY.lo), P(cu + tu, cv + tv, BODY.hi), P(cu - tu, cv - tv, BODY.hi)],
        'rgba(54,40,30,0.95)',
        'rgba(255,241,214,0.55)',
        Math.max(1, lw * 0.7),
      )
    }
  }

  // The APXS sensor on its arm at the rear: folded under, or reaching back to touch a rock
  function arm() {
    const e = look.arm
    const root = P(-BODY.l, 0, 0.16)
    const elbow = P(-0.26 - 0.06 * e, 0, 0.13 - 0.01 * e)
    const head = P(-0.29 - 0.17 * e, 0, 0.08 + 0.05 * e)
    beam(root, elbow)
    beam(elbow, head)
    const r = Math.max(2, metre * 0.022)
    ctx.fillStyle = casing
    ctx.beginPath()
    ctx.arc(head.x, head.y + 1, r + 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.sun
    ctx.beginPath()
    ctx.arc(head.x, head.y, r, 0, Math.PI * 2)
    ctx.fill()
    if (look.touch > 0) {
      for (const k of [0, 0.5]) {
        const ph = (look.touch + k) % 1
        ctx.save()
        ctx.globalAlpha *= 1 - ph
        ctx.lineWidth = 2
        ctx.strokeStyle = c.bright
        ctx.beginPath()
        ctx.arc(head.x, head.y, r + metre * 0.14 * ph, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  function panel() {
    const L = PANEL.l
    const W = PANEL.w
    const top = [P(L, -W, PANEL.up), P(L, W, PANEL.up), P(-L, W, PANEL.up), P(-L, -W, PANEL.up)]
    const low = [P(L, -W, PANEL.up - PANEL.thick), P(L, W, PANEL.up - PANEL.thick), P(-L, W, PANEL.up - PANEL.thick), P(-L, -W, PANEL.up - PANEL.thick)]
    // Its edges, where they face the camera
    const edges: [number, number, number, number][] = [
      [0, 1, 1, 0],
      [1, 2, 0, 1],
      [2, 3, -1, 0],
      [3, 0, 0, -1],
    ]
    for (const [a, b, nu, nv] of edges) {
      if (!facing(world(nu * L, nv * W, PANEL.up), nu, nv, 0)) continue
      poly([top[a], top[b], low[b], low[a]], 'rgba(60,46,36,0.95)', null)
    }
    poly(top, null, casing, lw + 3)
    poly(top, 'rgba(26,18,14,0.88)', null)
    // The cells: 18 along, 13 across (fewer lines when it is small, so it does not turn to mush)
    const along = detail ? 18 : big > 40 ? 6 : 0
    const across = detail ? 13 : big > 40 ? 4 : 0
    ctx.globalAlpha *= 0.32
    for (let i = 1; i < along; i++) {
      const u = -L + (2 * L * i) / along
      seg(P(u, -W, PANEL.up), P(u, W, PANEL.up), c.sun, 1)
    }
    for (let i = 1; i < across; i++) {
      const v = -W + (2 * W * i) / across
      seg(P(-L, v, PANEL.up), P(L, v, PANEL.up), c.sun, 1)
    }
    ctx.globalAlpha /= 0.32
    // The frame, glowing for a moment when the day's commands arrive
    if (look.glow > 0.01) {
      ctx.save()
      ctx.shadowColor = `rgba(255,241,214,${0.9 * look.glow})`
      ctx.shadowBlur = 18 * look.glow
      poly(top, null, c.bright, lw + 1.5 * look.glow)
      ctx.restore()
    }
    poly(top, null, c.bright, lw)
    // The front edge bolder, so you can see which way it faces
    seg(top[0], top[1], c.bright, lw * 2)
  }

  // Far side first, then the body, then the near side, the panel over all of it (the camera looks down on it)
  const leftFar = dist(0, -0.2) > dist(0, 0.2)
  const farV = leftFar ? -1 : 1
  const farIds = (leftFar ? [0, 1, 2] : [3, 4, 5]).sort((a, b) => dist(WHEELS[b].u, WHEELS[b].v) - dist(WHEELS[a].u, WHEELS[a].v))
  const nearIds = (leftFar ? [3, 4, 5] : [0, 1, 2]).sort((a, b) => dist(WHEELS[b].u, WHEELS[b].v) - dist(WHEELS[a].u, WHEELS[a].v))
  const rearFar = dist(-0.3, 0) > dist(0.3, 0)
  farIds.forEach(wheel)
  suspension(farV)
  if (rearFar) arm()
  body()
  suspension(-farV)
  nearIds.forEach(wheel)
  if (!rearFar) arm()
  panel()
}
