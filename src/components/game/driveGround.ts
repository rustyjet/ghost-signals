// The ground in a lander photo, for "Plan my drive" (Sojourner). The lander's camera looks out over flat ground,
// so a spot on the photo can be turned into a spot on the ground and back: the further up the photo (towards the
// horizon), the further away. Straight lines on flat ground stay straight in the photo, so a drive between two
// waypoints is a straight line on both. All of this is drawing for the game, tuned by eye to the photo.

/** How the photo's camera sees the ground, in the photo's own pixels. */
export interface Lens {
  /** Height of the horizon line, px from the top of the photo. */
  horizon: number
  /** Where the camera points across the photo, px from the left. */
  cx: number
  /** Focal length in px: how big a metre looks one metre away. */
  f: number
  /** Camera height above the ground, m. */
  h: number
}

export interface Pt {
  x: number
  y: number
}

/** A rock the rover must not drive into: its foot on the photo (px) and its half width there (px). */
export interface RockSpot {
  x: number
  y: number
  rx: number
  name?: string
}

/** A rock on the ground: centre (m) and radius (m). */
export interface Rock {
  X: number
  Z: number
  R: number
  name?: string
  /** Its foot on the photo, for drawing. */
  spot: RockSpot
}

/** Photo px → ground m (X across, Z away from the camera). Only below the horizon. */
export function toGround(lens: Lens, p: Pt): Pt {
  const dy = Math.max(1, p.y - lens.horizon)
  const Z = (lens.h * lens.f) / dy
  return { x: ((p.x - lens.cx) * Z) / lens.f, y: Z }
}

/** Ground m → photo px; `up` lifts the point that many metres off the ground (the rover's deck). */
export function toPhoto(lens: Lens, g: Pt, up = 0): Pt {
  const Z = Math.max(0.05, g.y)
  return { x: lens.cx + (g.x * lens.f) / Z, y: lens.horizon + ((lens.h - up) * lens.f) / Z }
}

/** How many photo px one metre is, at a spot on the ground. */
export const pxPerMetre = (lens: Lens, g: Pt) => lens.f / Math.max(0.05, g.y)

export function rocksOnGround(lens: Lens, spots: RockSpot[]): Rock[] {
  return spots.map((s) => {
    const c = toGround(lens, s)
    return { X: c.x, Z: c.y, R: s.rx / pxPerMetre(lens, c), name: s.name, spot: s }
  })
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

/** The first rock whose edge the rover (radius r) would touch at ground point p. */
export function rockAt(rocks: Rock[], p: Pt, r: number, skip?: Rock): Rock | null {
  for (const k of rocks) {
    if (k === skip) continue
    if (Math.hypot(p.x - k.X, p.y - k.Z) < k.R + r) return k
  }
  return null
}

/** The four corners of the rover's footprint on the ground (m), centred on p, facing `heading` (radians, 0 = away). */
export function footprint(p: Pt, heading: number, length: number, width: number): Pt[] {
  const fx = Math.sin(heading)
  const fz = Math.cos(heading)
  const sx = Math.cos(heading)
  const sz = -Math.sin(heading)
  const l = length / 2
  const w = width / 2
  return [
    { x: p.x + fx * l + sx * w, y: p.y + fz * l + sz * w },
    { x: p.x + fx * l - sx * w, y: p.y + fz * l - sz * w },
    { x: p.x - fx * l - sx * w, y: p.y - fz * l - sz * w },
    { x: p.x - fx * l + sx * w, y: p.y - fz * l + sz * w },
  ]
}

/** Heading (radians, 0 = straight away from the camera) from a to b on the ground. */
export const headingTo = (a: Pt, b: Pt) => Math.atan2(b.x - a.x, b.y - a.y)
