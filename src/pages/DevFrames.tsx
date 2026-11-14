import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Dev only: one route at several screen sizes side by side, all jumped to the same story step.
// Open /#/dev/frames?path=/signal/opportunity. Desktop is checked in the normal window.
const SIZES = [
  { w: 320, h: 568, name: 'Smallest phone' },
  { w: 360, h: 640, name: 'Small phone' },
  { w: 390, h: 844, name: 'Phone' },
  { w: 768, h: 1024, name: 'Tablet' },
]
const FRAME_HEIGHT = 600

type StepWindow = Window & { __step?: (i: number) => void }

export default function DevFrames() {
  const [params] = useSearchParams()
  const path = params.get('path') ?? '/signal/opportunity'
  const frames = useRef<(HTMLIFrameElement | null)[]>([])
  const [step, setStep] = useState(0)

  function goTo(i: number) {
    setStep(i)
    frames.current.forEach((f) => (f?.contentWindow as StepWindow | null)?.__step?.(i))
  }

  return (
    <main className="min-h-[100dvh] bg-black p-3 text-sun">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span>{path}</span>
        {Array.from({ length: 16 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            className={`h-8 w-8 rounded ${step === i ? 'bg-sun text-ink' : 'bg-white/10'}`}
          >
            {i}
          </button>
        ))}
        <button type="button" onClick={() => frames.current.forEach((f) => f?.contentWindow?.location.reload())} className="rounded bg-white/10 px-3 py-1">
          Reload
        </button>
      </div>
      <div className="flex items-start gap-4">
        {SIZES.map((s, i) => {
          const scale = FRAME_HEIGHT / s.h
          return (
            <figure key={s.name} style={{ width: s.w * scale, height: s.h * scale }} className="shrink-0">
              <iframe
                ref={(el) => {
                  frames.current[i] = el
                }}
                title={s.name}
                src={`/#${path}`}
                style={{ width: s.w, height: s.h, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }}
              />
              <figcaption className="mt-1 text-xs opacity-70">
                {s.name} {s.w}×{s.h}
              </figcaption>
            </figure>
          )
        })}
      </div>
    </main>
  )
}
