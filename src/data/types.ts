export type World = 'moon' | 'mars' | 'deep'

export interface Source {
  label: string
  url: string
}

export interface Photo {
  src: string
  alt: string
  credit: string
  /** Short name used in the picture credits, e.g. "My tracks out of the sand trap". */
  name?: string
}

/** The big number on a step. It counts up from zero when the step arrives. */
export interface Figure {
  value: number
  decimals?: number
  /** Short unit set beside the number, e.g. "m", "km", "days". */
  unit?: string
  /** One short line under the number saying what it is. */
  label: string
}

/**
 * One screen of the story. The machine speaks in the first person.
 * Limits (checked by scripts/check-copy.mjs): heading at most 5 words, body at most 150 characters.
 */
export interface Step {
  /** Value of the chapter's running counter (e.g. day on Mars) at this moment. Must be sourced. */
  spine: number
  /** True once the machine has gone silent: the counter stops and says so. */
  silent?: boolean
  figure?: Figure
  heading: string
  body: string
  /** model-viewer camera-orbit, e.g. "-35deg 70deg 4m" */
  orbit: string
  /** model-viewer camera-target "x y z" in metres, or "auto" */
  target: string
  /** 0 = clear sky, 1 = full dust storm */
  storm: number
  /** Index into the chapter's grounds: which real panorama the machine stands on. Defaults to 0. */
  ground?: number
  /** A real NASA photo shown with the words. */
  photo?: Photo
}

/** A real NASA panorama used as the ground behind the 3D model. */
export interface Ground {
  /** Wide crop for screens 1024 px and up, and a smaller one for phones. */
  wide: string
  narrow: string
  credit: string
  /** Short name used in the picture credits. */
  name: string
}

export type InteractionId = 'dust-storm' | 'laser-ranging' | 'rotor-lift'

export interface Chapter {
  slug: string
  name: string
  world: World
  /** Where the machine is, shown on the title screen. */
  place: string
  /** One line under the name on the title screen. */
  tagline: string
  /** How the running counter reads, e.g. { before: 'Day', after: 'on Mars' }. */
  spine: { before: string; after: string; /** Replaces `after` once the machine is silent. */ silentAfter?: string }
  /** Camera and sky for the title screen. */
  title: { orbit: string; target: string; storm: number }
  model: Photo
  grounds: Ground[]
  steps: Step[]
  interaction?: InteractionId
  /** What the machine leaves behind, after the story and the game. Facts follow the same rules. */
  closing?: { heading: string; body: string }
  sources: Source[]
}
