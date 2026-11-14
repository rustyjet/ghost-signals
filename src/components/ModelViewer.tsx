import '@google/model-viewer'
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Chapter } from '../data/types'

interface Props {
  chapter: Chapter
  selected: string | null
  onSelect: (id: string) => void
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Spin-and-zoom 3D model with numbered pins. Falls back to the NASA photo if the model fails.
 * Dev helper: Alt+click on the model logs a pin position and normal to the console.
 */
export default function ModelViewer({ chapter, selected, onSelect }: Props) {
  const ref = useRef<ModelViewerElement>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { model, photo, hotspots } = chapter

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onError = () => setFailed(true)
    const onLoad = () => setLoaded(true)
    const onPick = (e: MouseEvent) => {
      if (!import.meta.env.DEV || !e.altKey) return
      const rect = el.getBoundingClientRect()
      const hit = el.positionAndNormalFromPoint(e.clientX - rect.left, e.clientY - rect.top)
      if (hit) console.log(`[pin] position: '${hit.position.toString()}', normal: '${hit.normal.toString()}'`)
    }
    el.addEventListener('error', onError)
    el.addEventListener('load', onLoad)
    el.addEventListener('click', onPick)
    return () => {
      el.removeEventListener('error', onError)
      el.removeEventListener('load', onLoad)
      el.removeEventListener('click', onPick)
    }
  }, [])

  if (!model || failed) {
    return (
      <figure className="relative aspect-[4/3] overflow-hidden border-2 border-ink bg-paper-deep">
        {photo ? (
          <>
            <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
            {hotspots.map((h, i) =>
              h.photoXY ? (
                <PinButton
                  key={h.id}
                  n={i + 1}
                  name={h.name}
                  active={selected === h.id}
                  onClick={() => onSelect(h.id)}
                  style={{ position: 'absolute', left: `${h.photoXY[0]}%`, top: `${h.photoXY[1]}%` }}
                />
              ) : null,
            )}
          </>
        ) : (
          <p className="grid h-full place-items-center p-6 text-center text-ink-soft">
            The 3D model couldn&rsquo;t load on this device.
          </p>
        )}
      </figure>
    )
  }

  return (
    <div className="relative">
      <model-viewer
        ref={ref}
        src={model.src}
        alt={model.alt}
        camera-controls=""
        camera-orbit={model.cameraOrbit}
        touch-action="pan-y"
        interaction-prompt="none"
        shadow-intensity="1"
        shadow-softness="0.6"
        exposure="1.1"
        tone-mapping="neutral"
        auto-rotate={reducedMotion ? undefined : ''}
        auto-rotate-delay="2500"
        rotation-per-second="12deg"
        style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '4 / 3', background: 'var(--color-paper-deep)' }}
        class="border-2 border-ink"
      >
        {hotspots.map((h, i) =>
          h.position ? (
            <PinButton
              key={h.id}
              slot={`hotspot-${h.id}`}
              data-position={h.position}
              data-normal={h.normal}
              n={i + 1}
              name={h.name}
              active={selected === h.id}
              onClick={() => onSelect(h.id)}
            />
          ) : null,
        )}
      </model-viewer>
      {!loaded && (
        <p className="stamp pointer-events-none absolute inset-0 grid place-items-center text-ink-soft">
          Receiving model&hellip;
        </p>
      )}
      <p className="stamp mt-2 text-ink-soft">
        Drag to spin · Pinch or scroll to zoom · Model: {model.credit}
      </p>
    </div>
  )
}

interface PinProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  n: number
  name: string
  active: boolean
  [key: `data-${string}`]: string | undefined
}

function PinButton({ n, name, active, className, ...rest }: PinProps) {
  return (
    <button
      type="button"
      aria-label={`${n}. ${name}`}
      aria-pressed={active}
      className={`grid h-7 w-7 text-xs sm:h-9 sm:w-9 sm:text-sm -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink font-mono font-semibold shadow-[2px_2px_0_var(--color-ink)] transition-transform hover:scale-110 ${
        active ? 'bg-red text-card' : 'bg-mustard text-ink'
      } ${className ?? ''}`}
      {...rest}
    >
      {n}
    </button>
  )
}
