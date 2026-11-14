export type World = 'moon' | 'mars' | 'deep'

export interface Source {
  label: string
  url: string
}

export interface Photo {
  src: string
  alt: string
  credit: string
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
  photo?: Photo
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
  spine: { before: string; after: string }
  /** Camera and sky for the title screen. */
  title: { orbit: string; target: string; storm: number }
  model: Photo
  steps: Step[]
  interaction?: InteractionId
  sources: Source[]
}
