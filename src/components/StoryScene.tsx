import '@google/model-viewer'
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Chapter, SceneStep } from '../data/types'
import { ScrollTrigger, useGSAP } from '../scroll/smoothScroll'
import DustField from './DustField'

/** Scroll distance per step, as a share of the viewport height. */
const STEP_VH = 95

/**
 * The pinned scroll scene: the 3D machine stays on screen while scrolling moves the camera,
 * changes the sky and brings in one thought at a time.
 */
export default function StoryScene({ chapter }: { chapter: Chapter }) {
  const pinRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<ModelViewerElement>(null)
  const stormRef = useRef(0)
  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const steps = chapter.scene
  const last = steps.length - 1

  useGSAP(
    () => {
      const el = pinRef.current
      if (!el) return
      ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: 'top top',
        end: () => `+=${(steps.length * STEP_VH * window.innerHeight) / 100}`,
        onUpdate: (self) => {
          // Each step owns an equal slice of the scroll. Text and camera change per slice;
          // the sky blends toward the next step through the second half of each slice.
          const f = Math.min(self.progress * steps.length, steps.length - 0.0001)
          const i = Math.floor(f)
          const blend = Math.max(0, (f - i - 0.5) * 2)
          const next = steps[Math.min(last, i + 1)]
          const storm = steps[i].storm + (next.storm - steps[i].storm) * blend
          stormRef.current = storm
          el.style.setProperty('--storm', storm.toFixed(3))
          el.dataset.dark = storm > 0.42 ? 'true' : 'false'
          el.style.setProperty('--progress', self.progress.toFixed(4))
          setActive(i)
        },
      })
    },
    { dependencies: [chapter.slug] },
  )

  // Move the camera when the step changes; model-viewer eases between positions itself.
  useEffect(() => {
    const mv = modelRef.current
    if (!mv) return
    mv.cameraOrbit = steps[active].orbit
    mv.cameraTarget = steps[active].target
  }, [active, steps])

  useEffect(() => {
    const mv = modelRef.current
    if (!mv) return
    const onLoad = () => {
      setLoaded(true)
      ScrollTrigger.refresh()
    }
    mv.addEventListener('load', onLoad)
    return () => mv.removeEventListener('load', onLoad)
  }, [])

  return (
    <section aria-label={`The story of ${chapter.name}`}>
      <div
        ref={pinRef}
        data-dark="false"
        className="group/scene relative h-[100dvh] overflow-hidden"
        style={
          {
            '--storm': 0,
            background: `linear-gradient(to bottom,
              color-mix(in oklab, var(--color-mars-sky), var(--color-mars-storm) calc(var(--storm) * 100%)) 0%,
              color-mix(in oklab, var(--color-mars-horizon), var(--color-mars-storm-horizon) calc(var(--storm) * 100%)) 72%)`,
          } as React.CSSProperties
        }
      >
        {/* The Sun: a pale disc that fades and shrinks behind the dust */}
        <div
          aria-hidden="true"
          className="absolute right-[18%] top-[12%] h-20 w-20 rounded-full bg-sun sm:h-28 sm:w-28"
          style={{
            opacity: 'calc(1 - var(--storm) * 0.85)',
            boxShadow: '0 0 calc(80px - var(--storm) * 70px) calc(20px - var(--storm) * 18px) var(--color-sun)',
            transform: 'scale(calc(1 - var(--storm) * 0.35))',
          }}
        />

        <DustField stormRef={stormRef} className="absolute inset-0 h-full w-full" />

        {/* Ground: two basalt ridges */}
        <svg aria-hidden="true" viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute bottom-0 h-[30%] w-full">
          <path d="M0 120 C 220 70 360 110 560 90 S 980 40 1180 80 S 1380 70 1440 60 V260 H0Z" fill="#5a3a26" opacity="0.7" />
          <path d="M0 170 C 260 130 420 160 700 145 S 1150 120 1440 140 V260 H0Z" fill="var(--color-basalt)" />
        </svg>

        {/* The name, huge, behind the machine. Scrolling away from the title lifts it out of frame. */}
        <h1
          className={`pointer-events-none absolute inset-x-5 top-[16%] text-[clamp(3.6rem,15vw,15rem)] leading-[0.82] text-ink transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.7,.2,1)] sm:inset-x-10 ${
            active === 0 ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'
          }`}
        >
          {chapter.name}
        </h1>

        {/* The machine */}
        <model-viewer
          ref={modelRef}
          src={chapter.model?.src}
          alt={chapter.model?.alt}
          camera-orbit={steps[0].orbit}
          camera-target={steps[0].target}
          interpolation-decay="140"
          disable-zoom=""
          shadow-intensity="1.2"
          shadow-softness="0.8"
          exposure="1.05"
          tone-mapping="neutral"
          environment-image="neutral"
          style={{ position: 'absolute', background: 'transparent', pointerEvents: 'none' }}
          class="inset-x-0 top-[5%] h-[48%] w-full md:inset-y-0 md:left-auto md:right-0 md:top-0 md:h-full md:w-[62%]"
        />
        {!loaded && (
          <p className="absolute right-6 top-6 text-sm opacity-70">Receiving {chapter.name}&hellip;</p>
        )}

        {/* Phones: the text sits under the machine, so give it a dark ground to read on */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-basalt via-basalt/85 to-transparent md:hidden"
        />

        <SceneText chapter={chapter} steps={steps} active={active} />

        {/* Scroll progress along the bottom edge */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
          <div className="h-full origin-left bg-sun" style={{ transform: 'scaleX(var(--progress, 0))' }} />
        </div>
      </div>
    </section>
  )
}

function SceneText({ chapter, steps, active }: { chapter: Chapter; steps: SceneStep[]; active: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 text-sun transition-colors duration-700 md:text-ink md:group-data-[dark=true]/scene:text-sun">
      {/* Where we are in the mission */}
      <p
        key={steps[active].marker}
        className="absolute left-5 top-5 font-display text-xl font-bold sm:left-10 sm:top-8 sm:text-2xl"
        aria-live="polite"
      >
        {steps[active].marker}
      </p>

      {steps.map((step, i) => {
        const on = i === active
        // Outgoing text leaves quickly; incoming text waits a beat, so two thoughts never overlap.
        const base =
          'absolute transition-[opacity,transform] ease-[cubic-bezier(.2,.7,.2,1)] ' +
          (on
            ? 'opacity-100 translate-y-0 duration-700 delay-200'
            : i < active
              ? 'opacity-0 -translate-y-8 duration-200'
              : 'opacity-0 translate-y-10 duration-200')

        if (step.kind === 'title') {
          // The name is drawn behind the rover (see TitleWord); this is only the tagline.
          return (
            <div
              key="title"
              className={`${base} inset-x-5 top-[calc(16%+clamp(3.6rem,15vw,15rem)*1.02)] sm:inset-x-10`}
              aria-hidden={!on}
            >
              <p className="max-w-[24ch] text-lg sm:text-2xl">{chapter.tagline}</p>
              <p className="mt-3 text-base opacity-75">Scroll to follow the mission</p>
            </div>
          )
        }

        const beat = step.kind === 'beat' ? chapter.beats.find((b) => b.heading === step.ref) : undefined
        const part = step.kind === 'part' ? chapter.hotspots.find((h) => h.id === step.ref) : undefined
        const heading = beat?.heading ?? part?.name ?? ''
        const text = beat?.text ?? part?.text ?? ''

        return (
          <div
            key={`${step.kind}-${step.ref}`}
            aria-hidden={!on}
            className={`${base} inset-x-5 bottom-[7%] max-w-xl sm:inset-x-10 md:bottom-auto md:top-1/2 md:-mt-[9rem] md:max-w-[34rem]`}
          >
            {step.kind === 'part' && <p className="mb-2 text-base opacity-80">Look closer</p>}
            <h2 className="text-[clamp(2.1rem,6vw,5.2rem)]">{heading}</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed sm:mt-4 sm:text-xl">{text}</p>
          </div>
        )
      })}
    </div>
  )
}
