export type World = 'moon' | 'mars' | 'deep'

export interface Source {
  label: string
  url: string
}

/** One first-person story card. `text` is imagined narration built on real mission facts. */
export interface StoryBeat {
  heading: string
  text: string
  image?: { src: string; alt: string; credit: string }
}

/** A numbered pin on the 3D model (or on the fallback photo). */
export interface Hotspot {
  id: string
  name: string
  /** What this part did and what science it made possible. */
  text: string
  /** model-viewer surface position "x y z" in metres, model space. */
  position?: string
  normal?: string
  /** Fallback placement on the photo, in percent from the top-left. */
  photoXY?: [number, number]
}

export interface QuickFact {
  label: string
  value: string
}

/**
 * One screen of the pinned scroll scene. It shows either a story beat or a part of the machine,
 * and tells the camera and sky where to be.
 */
export interface SceneStep {
  kind: 'title' | 'beat' | 'part'
  /** Beat heading or hotspot id. Unused for the title step. */
  ref?: string
  /** Where in the mission we are, shown top-left. Must be a sourced date or figure. */
  marker: string
  /** model-viewer camera-orbit, e.g. "-35deg 70deg 4m" */
  orbit: string
  /** model-viewer camera-target "x y z" in metres, or "auto" */
  target: string
  /** 0 = clear sky, 1 = full dust storm */
  storm: number
}

export type InteractionId = 'dust-storm' | 'laser-ranging' | 'rotor-lift' | 'quake-spotter'

export interface Chapter {
  slug: string
  name: string
  /** Short line shown on the tuner when the signal locks. */
  callSign: string
  world: World
  /** Dial position of this beacon on the hub tuner, 0-100. */
  frequency: number
  status: string
  model?: { src: string; alt: string; credit: string; cameraOrbit?: string }
  photo?: { src: string; alt: string; credit: string }
  hotspots: Hotspot[]
  beats: StoryBeat[]
  /** The scroll scene, in order. */
  scene: SceneStep[]
  /** One line under the name on the title screen. */
  tagline: string
  interaction?: InteractionId
  learned: string
  stillMatters: string
  quickFacts: QuickFact[]
  sources: Source[]
}
