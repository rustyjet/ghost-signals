export type World = 'moon' | 'mars' | 'deep'

export interface Source {
  label: string
  url: string
}

/** The 3D model of the machine. */
export interface Model {
  src: string
  alt: string
  credit: string
}

/** One crop of a photo, with its pixel size (so layout never waits for the file to load). */
export interface Picture {
  src: string
  w: number
  h: number
}

/** A real NASA photo used as a scene. Every one is credited in docs/CREDITS.md and on the page. */
export interface SceneImage {
  /** Stable key, e.g. "eagle-crater". Scenes that share an id share one layer, so the picture keeps moving. */
  id: string
  /** Landscape crop for wide screens. */
  wide: Picture
  /** Portrait-friendly crop for phones; falls back to `wide`. */
  tall?: Picture
  alt: string
  credit: string
  /** Short name for the picture credits. */
  name: string
}

/**
 * Where the camera sits on a photo: x and y are 0–1 across the part of the photo that overflows the
 * screen (0 = left/top edge, 1 = right/bottom edge); zoom 1 = just covers the screen.
 */
export interface View {
  x: number
  y: number
  zoom?: number
}

/** model-viewer camera: orbit "θdeg φdeg r m" and target "x y z" in metres, or "auto". */
export interface Camera {
  orbit: string
  target: string
}

/** What fills the screen behind the words for one step. Scrolling moves it from `from` to `to`. */
export type Scene =
  /**
   * The 3D model standing on a real panorama under the world's sky. `hideAbove` hides every part of the
   * model whose centre is higher than that many metres (Eagle without its ascent stage, after it left).
   * A chapter with no model (NASA has none of Sojourner) gets the sky and the panorama alone; the camera
   * swing still slides the ground.
   */
  | { kind: 'rover'; ground: SceneImage; from: Camera; to: Camera; hideAbove?: number }
  /** A photo filling the screen, travelling across it. `narrow` replaces from/to under 1024 px. */
  | { kind: 'photo'; image: SceneImage; from: View; to: View; narrow?: [View, View] }
  /** Two photos of the same view filling the screen; a wipe crosses it from `before` to `after` with the scroll. */
  | { kind: 'compare'; before: SceneImage; after: SceneImage; from: View; to: View; narrow?: [View, View] }
  /** Nothing: the signal is gone. */
  | { kind: 'black' }

/** The big number on a step. It counts up from zero as the step arrives. */
export interface Figure {
  value: number
  decimals?: number
  /** Short unit set beside the number, e.g. "m", "km", "days". */
  unit?: string
  /** One short line under the number saying what it is. */
  label: string
  /** A year or code: no thousands separator (1903, not 1,903). */
  plain?: boolean
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
  /** 0 = clear air, 1 = full dust storm (dust in the air, darker sky). */
  storm: number
  scene: Scene
}

export type InteractionId = 'dust-storm' | 'laser-ranging' | 'rotor-lift' | 'seismometer' | 'drive-plan'

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
  /** The title screen's scene and sky. */
  title: { scene: Scene; storm: number }
  /** The NASA 3D model. Left out only when NASA has none; then the real photos carry the whole chapter. */
  model?: Model
  steps: Step[]
  interaction?: InteractionId
  /** What the machine leaves behind, after the story and the game. Facts follow the same rules. */
  closing?: { heading: string; body: string }
  sources: Source[]
}
