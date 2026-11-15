import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect } from 'react'
import type { Model, Scene, SceneImage, View, World } from '../../data/types'
import { loadModelViewer } from '../../lib/modelViewer'
import { isNarrow } from '../../scroll/smoothScroll'
import DustField from '../DustField'

/** One stop of the story: what fills the screen, and how much dust is in the air. */
export interface Shot {
  scene: Scene
  storm: number
}

/** Scenes with the same key share one layer, so a photo used by two steps keeps travelling. */
export const sceneKey = (s: Scene): string =>
  s.kind === 'photo' ? s.image.id : s.kind === 'compare' ? `${s.before.id}|${s.after.id}` : s.kind

/** Every picture a list of shots shows, once each (for the credits). */
export function sceneImages(scenes: Scene[]): SceneImage[] {
  const out = new Map<string, SceneImage>()
  for (const s of scenes) {
    const imgs = s.kind === 'photo' ? [s.image] : s.kind === 'compare' ? [s.before, s.after] : s.kind === 'rover' ? [s.ground] : []
    for (const i of imgs) if (!out.has(i.name + i.credit)) out.set(i.name + i.credit, i)
  }
  return [...out.values()]
}

/** How much of the scroll between two steps the cross-fade takes (0–1). Wide, so scenes dissolve rather than cut. */
const FADE = 0.6

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => {
  const u = clamp01(t)
  return u * u * (3 - 2 * u)
}
const lerpView = (a: View, b: View, t: number): View => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, t),
})

type Vec3 = [number, number, number]
const parseOrbit = (o: string) => o.split(/\s+/).map(parseFloat) as [number, number, number]
const parseTarget = (t: string): Vec3 | null => (t === 'auto' ? null : (t.split(/\s+/).map(parseFloat) as Vec3))

/**
 * Drives the backdrop from a scroll position. `f` is the story position: 0 = title, 1 = first step,
 * and so on; fractions are part-way between. Writes styles directly (no React renders while scrolling),
 * and only when a value changes.
 */
export function makeBackdropController(
  el: HTMLElement,
  shots: Shot[],
  opts: { reduced: boolean; model: () => ModelViewerElement | null; autoTarget: () => Vec3; stormRef: React.RefObject<number> },
) {
  const n = shots.length
  const keys = shots.map((s) => sceneKey(s.scene))
  const layers = new Map<string, HTMLElement>()
  el.querySelectorAll<HTMLElement>('[data-layer]').forEach((l) => layers.set(l.dataset.layer!, l))
  const memo = new Map<string, string>()
  const set = (node: HTMLElement, prop: 'opacity' | 'transform' | 'clipPath' | 'zIndex' | 'display' | 'transformOrigin', value: string, id: string) => {
    const k = `${id}:${prop}`
    if (memo.get(k) === value) return
    memo.set(k, value)
    node.style[prop] = value
  }
  let vw = 0
  let vh = 0
  let lastStorm = -1
  let lastOrbit = ''
  let lastTarget = ''
  let lastHide: number | undefined

  /** Show or hide the parts of the 3D model above a height, by reaching into model-viewer's scene. */
  const hideAbove = (mv: ModelViewerElement, above: number | undefined) => {
    if (above === lastHide) return
    type Obj = {
      isMesh?: boolean
      visible: boolean
      geometry?: { boundingBox: { min: Vec; max: Vec } | null; computeBoundingBox(): void }
      matrixWorld: { elements: number[] }
      traverse(cb: (o: Obj) => void): void
    }
    type Vec = { x: number; y: number; z: number }
    const sym = Object.getOwnPropertySymbols(mv).find((s) => s.description === 'scene')
    const scene = sym ? (mv as unknown as Record<symbol, Obj & { queueRender(): void }>)[sym] : null
    if (!scene) return
    let touched = 0
    scene.traverse((o) => {
      if (!o.isMesh || !o.geometry) return
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox
      if (!b) return
      const e = o.matrixWorld.elements
      const cx = (b.min.x + b.max.x) / 2
      const cy = (b.min.y + b.max.y) / 2
      const cz = (b.min.z + b.max.z) / 2
      const y = e[1] * cx + e[5] * cy + e[9] * cz + e[13]
      o.visible = above === undefined || y <= above
      touched++
    })
    if (!touched) return // not loaded yet: try again on the next frame
    lastHide = above
    scene.queueRender()
  }

  /** Size every cover photo to just cover the screen; travel is then pure transforms. */
  const layout = () => {
    vw = window.innerWidth
    vh = window.innerHeight
    const narrow = isNarrow()
    el.querySelectorAll<HTMLImageElement>('img[data-cover]').forEach((img) => {
      const tall = narrow && img.dataset.th
      const w = Number(tall ? img.dataset.tw : img.dataset.ww)
      const h = Number(tall ? img.dataset.th : img.dataset.wh)
      const base = Math.max(vw / w, vh / h)
      img.style.width = `${w * base}px`
      img.style.height = `${h * base}px`
      img.dataset.bw = String(w * base)
      img.dataset.bh = String(h * base)
    })
    memo.clear()
  }

  /** Images load when their scene is near, so the first screen isn't waiting on all of them. */
  const loaded = new Set<string>()
  const load = (key: string) => {
    if (loaded.has(key)) return
    loaded.add(key)
    layers.get(key)?.querySelectorAll<HTMLElement>('[data-src],[data-srcset]').forEach((node) => {
      if (node.dataset.srcset) node.setAttribute('srcset', node.dataset.srcset)
      if (node.dataset.src) node.setAttribute('src', node.dataset.src)
    })
  }

  /** How far through its own stretch of the story a shot is, 0–1. */
  // A shot keeps moving all through the cross-fades on either side of it, so nothing ever sits frozen
  // on screen. Two steps on one photo (`shared`) hand over at the midpoint instead, so the pan is continuous.
  const progress = (s: number, f: number, shared: boolean) => {
    if (opts.reduced) return 1
    if (s === 0) return clamp01(f / 0.5)
    const lead = shared ? 0.5 : 0.5 + FADE / 2
    if (s === n - 1) return clamp01((f - (s - lead)) / (lead + 1))
    return clamp01((f - (s - lead)) / (2 * lead))
  }

  const draw = (s: number, f: number, id: string, shared = false) => {
    const layer = layers.get(keys[s])
    const scene = shots[s].scene
    if (!layer) return
    const u = progress(s, f, shared)
    if (scene.kind === 'photo' || scene.kind === 'compare') {
      // Every photo in the layer travels together (the two halves of a wipe stay lined up).
      const [from, to] = scene.narrow && isNarrow() ? scene.narrow : [scene.from, scene.to]
      const v = lerpView(from, to, u)
      const z = v.zoom ?? 1
      layer.querySelectorAll<HTMLImageElement>('img[data-cover]').forEach((img, i) => {
        const W = Number(img.dataset.bw) * z
        const H = Number(img.dataset.bh) * z
        set(img, 'transform', `translate3d(${(-(W - vw) * v.x).toFixed(1)}px, ${(-(H - vh) * v.y).toFixed(1)}px, 0) scale(${z.toFixed(4)})`, `${id}img${i}`)
      })
      if (scene.kind === 'compare') {
        const after = layer.querySelector<HTMLElement>('[data-after]')
        const line = layer.querySelector<HTMLElement>('[data-wipe]')
        if (!after || !line) return
        const w = opts.reduced ? 1 : smooth((u - 0.15) / 0.6)
        set(after, 'clipPath', `inset(0 ${((1 - w) * 100).toFixed(2)}% 0 0)`, id + 'after')
        set(line, 'transform', `translate3d(${(w * vw).toFixed(1)}px, 0, 0)`, id + 'line')
        set(line, 'opacity', w > 0.01 && w < 0.99 ? '1' : '0', id + 'lineop')
      }
    } else if (scene.kind === 'rover') {
      layer.querySelectorAll<HTMLElement>('[data-ground]').forEach((g) =>
        set(g, 'opacity', g.dataset.ground === scene.ground.id ? '1' : '0', `${id}g${g.dataset.ground}`),
      )
      layer.querySelectorAll<HTMLElement>('[data-ground-title]').forEach((t) =>
        set(t, 'display', s === 0 ? '' : 'none', id + 'title'),
      )
      const c = smooth(u)
      const [t0, p0, r0] = parseOrbit(scene.from.orbit)
      const [t1, p1, r1] = parseOrbit(scene.to.orbit)
      const narrow = isNarrow()
      const theta = lerp(t0, t1, c)
      const orbit = `${theta.toFixed(2)}deg ${lerp(p0, p1, c).toFixed(2)}deg ${(lerp(r0, r1, c) * (narrow ? 1.3 : 1)).toFixed(3)}m`
      const ta = parseTarget(scene.from.target) ?? opts.autoTarget()
      const tb = parseTarget(scene.to.target) ?? opts.autoTarget()
      const target = ta.map((v, k) => `${lerp(v, tb[k], c).toFixed(3)}m`).join(' ')
      const mv = opts.model()
      // After the title the words run down the middle, so on wide screens the machine steps to the right of them.
      if (mv) mv.dataset.aside = s === 0 ? 'false' : 'true'
      if (mv) hideAbove(mv, scene.hideAbove)
      if (mv && (orbit !== lastOrbit || target !== lastTarget)) {
        lastOrbit = orbit
        lastTarget = target
        mv.cameraOrbit = orbit
        mv.cameraTarget = target
        // Before model-viewer has loaded the element has no methods yet; the camera is set on upgrade anyway.
        if (opts.reduced) mv.jumpCameraToGoal?.()
      }
      // The ground slides a little as the camera swings round, so the machine stands somewhere.
      // Never further than the strip's spare width, so its edge never shows.
      layer.querySelectorAll<HTMLImageElement>('[data-ground] img').forEach((img, i) => {
        const spare = Math.max(0, (img.offsetWidth - vw) / 2)
        const shift = Math.max(-spare, Math.min(spare, -theta * (narrow ? 2 : 5)))
        set(img, 'transform', `translate3d(calc(-50% + ${shift.toFixed(1)}px), 0, 0)`, `${id}gp${i}`)
      })
    }
  }

  const apply = (f: number) => {
    const cur = Math.min(n - 1, Math.max(0, Math.round(f)))
    const d = f - cur
    // The pair of shots on screen (a below, b fading in on top) and how far b has come in.
    let a: number
    let b: number
    let t: number
    if (d >= 0) {
      a = cur
      b = Math.min(n - 1, cur + 1)
      t = b === a ? 0 : smooth((d - (0.5 - FADE / 2)) / FADE)
    } else {
      a = Math.max(0, cur - 1)
      b = cur
      t = a === b ? 1 : 1 - smooth((-(0.5 - FADE / 2) - d) / FADE)
    }
    if (opts.reduced) t = t < 0.5 ? 0 : 1

    for (let s = Math.max(0, a - 1); s <= Math.min(n - 1, b + 2); s++) load(keys[s])

    const ka = keys[a]
    const kb = keys[b]
    layers.forEach((layer, key) => {
      const id = 'L' + key
      if (key === ka && key === kb) {
        set(layer, 'display', '', id)
        set(layer, 'opacity', '1', id)
        set(layer, 'zIndex', '1', id)
        draw(t < 0.5 ? a : b, f, id, true)
      } else if (key === kb && t > 0) {
        set(layer, 'display', '', id)
        set(layer, 'opacity', t.toFixed(3), id)
        set(layer, 'zIndex', '2', id)
        draw(b, f, id)
      } else if (key === ka && t < 1) {
        set(layer, 'display', '', id)
        set(layer, 'opacity', '1', id)
        set(layer, 'zIndex', '1', id)
        draw(a, f, id)
      } else {
        set(layer, 'display', 'none', id)
      }
    })

    const storm = lerp(shots[a].storm, shots[b].storm, t)
    opts.stormRef.current = storm
    if (Math.abs(storm - lastStorm) > 0.002) {
      lastStorm = storm
      el.style.setProperty('--storm', storm.toFixed(3))
      const mv = opts.model()
      // Less sunlight reaches the machine too.
      if (mv) mv.exposure = 1.05 - storm * 0.55
    }
  }

  return { layout, apply }
}

/** Shared attributes for a photo that loads lazily (see `load` above). */
const lazy = (src: string) => ({ 'data-src': src })

function CoverPhoto({ image }: { image: SceneImage }) {
  return (
    <picture>
      {image.tall && <source media="(max-width: 1023px)" data-srcset={image.tall.src} />}
      <img
        {...lazy(image.wide.src)}
        data-cover=""
        data-ww={image.wide.w}
        data-wh={image.wide.h}
        data-tw={image.tall?.w}
        data-th={image.tall?.h}
        alt=""
        decoding="async"
        className="absolute left-0 top-0 max-w-none origin-top-left"
      />
    </picture>
  )
}

function Layer({ scene, shots, model, modelRef, title, loaded }: {
  scene: Scene
  shots: Shot[]
  model?: Model
  modelRef: React.RefObject<ModelViewerElement | null>
  title: string
  loaded: boolean
}) {
  const key = sceneKey(scene)
  const base = 'absolute inset-0 overflow-hidden'
  if (scene.kind === 'photo')
    return (
      <div data-layer={key} className={base} style={{ display: 'none' }}>
        <CoverPhoto image={scene.image} />
      </div>
    )
  if (scene.kind === 'compare')
    return (
      <div data-layer={key} className={base} style={{ display: 'none' }}>
        <CoverPhoto image={scene.before} />
        {/* The clip is on a full-screen box, so the wipe crosses the screen, not the moving photo */}
        <div data-after="" className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 100% 0 0)' }}>
          <CoverPhoto image={scene.after} />
        </div>
        <span data-wipe="" aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-sun opacity-0 shadow-[0_0_12px_rgb(0_0_0/0.5)]" />
      </div>
    )
  if (scene.kind === 'black') return <div data-layer={key} className={`${base} bg-black`} style={{ display: 'none' }} />

  // The 3D machine on a real panorama, under a sky that darkens with the storm.
  const groundIds = shots.flatMap((s) => (s.scene.kind === 'rover' ? [s.scene.ground] : []))
  return (
    <div
      data-layer={key}
      className={base}
      style={{
        display: 'none',
        background: `linear-gradient(to bottom,
          color-mix(in oklab, var(--color-sky), var(--color-mars-storm) calc(var(--storm) * 100%)) 0%,
          color-mix(in oklab, var(--color-horizon), var(--color-mars-storm-horizon) calc(var(--storm) * 100%)) 100%)`,
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[52%] lg:h-[44%]">
        {groundIds
          .filter((g, i, all) => all.findIndex((x) => x.id === g.id) === i)
          .map((g) => (
            <div key={g.id} data-ground={g.id} className="absolute inset-0" style={{ opacity: 0 }}>
              <picture>
                {g.tall && <source media="(max-width: 1023px)" data-srcset={g.tall.src} />}
                <img
                  {...lazy(g.wide.src)}
                  alt=""
                  decoding="async"
                  className="absolute bottom-0 left-1/2 h-full w-auto min-w-full max-w-none object-cover object-bottom [mask-image:linear-gradient(to_bottom,transparent,black_18%)]"
                  style={{ transform: 'translate3d(-50%, 0, 0)' }}
                />
              </picture>
            </div>
          ))}
        <div aria-hidden="true" className="absolute inset-0 bg-mars-storm" style={{ opacity: 'calc(var(--storm) * 0.75)' }} />
      </div>

      {/* The name, huge, behind the machine. The real <h1> is in the words, for screen readers. */}
      <div
        data-ground-title=""
        aria-hidden="true"
        className="absolute inset-x-5 top-[12%] whitespace-nowrap font-display text-[clamp(2.5rem,13.2vw,15rem)] font-extrabold leading-[0.9] tracking-[-0.03em] text-on-sky md:inset-x-10 lg:top-[13%] lg:text-[clamp(3.6rem,15vw,15rem)]"
      >
        <span data-title="" className="block">
          {title}
        </span>
      </div>

      {model && (
        <model-viewer
          ref={modelRef}
          src={model.src}
          alt={model.alt}
          camera-orbit={shots[0].scene.kind === 'rover' ? shots[0].scene.from.orbit : undefined}
          interpolation-decay="45"
          disable-zoom=""
          shadow-intensity="1.1"
          shadow-softness="0.9"
          exposure="1.05"
          tone-mapping="neutral"
          environment-image="neutral"
          style={{ position: 'absolute', background: 'transparent', pointerEvents: 'none' }}
          class={`inset-x-0 bottom-[38%] top-[14%] h-auto w-full transition-opacity duration-500 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[62%] lg:data-[aside=true]:w-[36%] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {model && !loaded && <p className="absolute bottom-[34%] right-5 text-sm text-on-sky lg:bottom-[12%] lg:right-10">Receiving {title}&hellip;</p>}
    </div>
  )
}

/** The full-screen picture behind the words. Holds one layer per scene; the controller decides which show. */
export default function Backdrop(props: {
  shots: Shot[]
  model?: Model
  modelRef: React.RefObject<ModelViewerElement | null>
  stormRef: React.RefObject<number>
  title: string
  loaded: boolean
  rootRef: React.RefObject<HTMLDivElement | null>
  world: World
}) {
  const { shots, stormRef, rootRef } = props
  const hasModel = !!props.model
  useEffect(() => void (hasModel && loadModelViewer()), [hasModel])
  const seen = new Set<string>()
  const layers = shots.filter((s) => {
    const k = sceneKey(s.scene)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return (
    <div ref={rootRef} aria-hidden="true" className="absolute inset-0 isolate overflow-hidden bg-basalt" style={{ '--storm': shots[0].storm } as React.CSSProperties}>
      {layers.map((s) => (
        <Layer key={sceneKey(s.scene)} scene={s.scene} {...props} />
      ))}
      {/* No air on the Moon, so no dust in it */}
      {props.world !== 'moon' && <DustField stormRef={stormRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />}
    </div>
  )
}
