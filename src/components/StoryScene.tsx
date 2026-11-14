import '@google/model-viewer'
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Chapter, Figure } from '../data/types'
import { gsap, isNarrow, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from '../scroll/smoothScroll'
import { stepPx, useStepScroll } from '../scroll/useStepScroll'
import DustField from './DustField'

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/**
 * Camera shots are composed for a wide screen. On a phone the model only has a short, wide strip,
 * so pull the camera back to keep the whole part in frame.
 */
function fitOrbit(orbit: string): string {
  if (!isNarrow()) return orbit
  return orbit.replace(/([\d.]+)m$/, (_, r: string) => `${(parseFloat(r) * 1.3).toFixed(2)}m`)
}

export default function StoryScene({ chapter }: { chapter: Chapter }) {
  return prefersReducedMotion() ? <StaticStory chapter={chapter} /> : <PinnedStory chapter={chapter} />
}

/**
 * The pinned story: the machine stays on screen. One flick moves one step; each step brings a
 * counting number, a heading that rises in line by line, and a short body.
 */
function PinnedStory({ chapter }: { chapter: Chapter }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<ModelViewerElement>(null)
  const spineNumRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const splits = useRef<Record<number, SplitText>>({})
  const titleSplit = useRef<SplitText | null>(null)
  const prevActive = useRef(-1)
  const spineValue = useRef(0)
  const stormRef = useRef(chapter.title.storm)
  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const shots = [chapter.title, ...chapter.steps]
  const count = shots.length
  const nav = useStepScroll(triggerRef, count)
  const step = active > 0 ? chapter.steps[active - 1] : undefined

  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return
      triggerRef.current = ScrollTrigger.create({
        trigger: el,
        pin: true,
        start: 'top top',
        end: () => `+=${(count - 1) * stepPx()}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // The sky blends continuously between steps while the page glides.
          const f = self.progress * (count - 1)
          const i = Math.floor(f)
          const j = Math.min(count - 1, i + 1)
          const storm = shots[i].storm + (shots[j].storm - shots[i].storm) * (f - i)
          stormRef.current = storm
          el.style.setProperty('--storm', storm.toFixed(3))
          el.dataset.dark = storm > 0.42 ? 'true' : 'false'
          el.style.setProperty('--progress', self.progress.toFixed(4))
          setActive(Math.round(f))
        },
      })

      // Headings rise in line by line from behind a mask. autoSplit re-splits after fonts load or a resize.
      el.querySelectorAll<HTMLElement>('[data-heading]').forEach((h) => {
        const index = Number(h.closest<HTMLElement>('[data-panel]')?.dataset.index)
        SplitText.create(h, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => {
            splits.current[index] = self
          },
        })
      })
      const title = el.querySelector<HTMLElement>('[data-title]')
      if (title) titleSplit.current = SplitText.create(title, { type: 'chars' })

      gsap.set(el.querySelectorAll('[data-panel]'), { autoAlpha: 0 })

      if (import.meta.env.DEV) {
        // Used by the dev frames page to jump every frame to the same step.
        ;(window as unknown as { __step?: (i: number) => void }).__step = (i: number) =>
          window.scrollTo(0, (triggerRef.current?.start ?? 0) + i * stepPx())
      }
    },
    { scope: rootRef, dependencies: [chapter.slug] },
  )

  // One orchestrated moment per step.
  useGSAP(
    () => {
      const el = rootRef.current
      if (!el) return
      const panels = Array.from(el.querySelectorAll<HTMLElement>('[data-panel]'))
      const prev = prevActive.current
      prevActive.current = active

      panels.forEach((p, i) => {
        if (i === active) return
        gsap.to(p, { autoAlpha: 0, y: i < active ? -28 : 28, duration: 0.22, ease: 'power2.in', overwrite: true })
      })

      // The giant name only belongs to the title screen.
      const titleChars = titleSplit.current?.chars ?? []
      if (active === 0) {
        if (prev !== 0)
          gsap.fromTo(
            titleChars,
            { yPercent: 60, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: 'power4.out', stagger: 0.035, overwrite: true },
          )
      } else if (prev === 0 || prev === -1) {
        gsap.to(titleChars, { yPercent: -40, autoAlpha: 0, duration: 0.3, ease: 'power2.in', stagger: 0.01, overwrite: true })
      }

      const panel = panels[active]
      if (!panel) return
      gsap.killTweensOf(panel)
      const tl = gsap.timeline({ delay: prev === -1 ? 0.35 : 0.2 })
      tl.set(panel, { autoAlpha: 1, y: 0 })

      const figure = panel.querySelector<HTMLElement>('[data-figure]')
      const num = panel.querySelector<HTMLElement>('[data-num]')
      if (figure && num) {
        const target = Number(num.dataset.value)
        const decimals = Number(num.dataset.decimals)
        const counter = { v: 0 }
        num.textContent = fmt(0, decimals)
        tl.fromTo(figure, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0)
        tl.to(
          counter,
          { v: target, duration: 1.2, ease: 'power3.out', onUpdate: () => (num.textContent = fmt(counter.v, decimals)) },
          0,
        )
      }

      const lines = splits.current[active]?.lines
      if (lines?.length)
        tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: 0.09 }, 0.12)

      const body = panel.querySelectorAll('[data-body]')
      tl.fromTo(body, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.35)

      // The running counter rolls from where it was to where the story is now.
      const spineNum = spineNumRef.current
      const target = active > 0 ? chapter.steps[active - 1].spine : spineValue.current
      if (spineNum && target !== spineValue.current) {
        const roll = { v: spineValue.current }
        spineValue.current = target
        gsap.to(roll, {
          v: target,
          duration: target - roll.v > 100 ? 1.6 : 0.7,
          ease: 'power2.out',
          overwrite: true,
          onUpdate: () => (spineNum.textContent = fmt(roll.v)),
        })
      }
    },
    { scope: rootRef, dependencies: [active] },
  )

  // Move the camera when the step changes; model-viewer eases between positions itself.
  useEffect(() => {
    const mv = modelRef.current
    if (!mv) return
    mv.cameraOrbit = fitOrbit(shots[active].orbit)
    mv.cameraTarget = shots[active].target
  }, [active, shots])

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

  const atEnd = active === count - 1

  return (
    <section aria-label={`The story of ${chapter.name}`}>
      <div
        ref={rootRef}
        data-step-scene=""
        data-dark="false"
        className="group/scene relative h-[100svh] overflow-hidden"
        style={
          {
            '--storm': chapter.title.storm,
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

        <svg aria-hidden="true" viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute bottom-0 h-[30%] w-full">
          <path d="M0 120 C 220 70 360 110 560 90 S 980 40 1180 80 S 1380 70 1440 60 V260 H0Z" fill="#5a3a26" opacity="0.7" />
          <path d="M0 170 C 260 130 420 160 700 145 S 1150 120 1440 140 V260 H0Z" fill="var(--color-basalt)" />
        </svg>

        {/* The name, huge, behind the machine */}
        <h1
          data-title=""
          className="pointer-events-none absolute inset-x-5 top-[15%] text-[clamp(2.5rem,14vw,15rem)] leading-[0.82] text-ink lg:inset-x-10 lg:top-[16%] lg:text-[clamp(3.6rem,15vw,15rem)]"
        >
          {chapter.name}
        </h1>

        <model-viewer
          ref={modelRef}
          src={chapter.model.src}
          alt={chapter.model.alt}
          camera-orbit={fitOrbit(chapter.title.orbit)}
          camera-target={chapter.title.target}
          interpolation-decay="140"
          disable-zoom=""
          shadow-intensity="1.2"
          shadow-softness="0.8"
          exposure="1.05"
          tone-mapping="neutral"
          environment-image="neutral"
          style={{ position: 'absolute', background: 'transparent', pointerEvents: 'none' }}
          // Stacked layout: fade the bottom of the model so close-ups never end in a hard cut.
          class="inset-x-0 top-[8%] h-[46%] w-full [mask-image:linear-gradient(to_bottom,black_72%,transparent)] [@media(max-height:700px)]:top-[7%] [@media(max-height:700px)]:h-[40%] md:top-[9%] md:h-[50%] lg:[mask-image:none] lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:h-full lg:w-[60%] lg:[@media(max-height:700px)]:top-0 lg:[@media(max-height:700px)]:h-full"
        />
        {!loaded && <p className="absolute right-6 top-20 text-sm opacity-70">Receiving {chapter.name}&hellip;</p>}

        {/* Phones: the words sit under the machine on dark ground */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-basalt via-basalt/90 to-transparent lg:hidden"
        />

        {/* Top-left: where we are, then the running counter */}
        <div className="pointer-events-none absolute left-5 top-6 max-w-[calc(100%-9rem)] font-display text-lg font-bold leading-tight text-ink transition-colors duration-700 group-data-[dark=true]/scene:text-sun lg:left-10 lg:top-8 lg:max-w-none lg:text-2xl">
          <p className={`transition-opacity duration-500 ${active === 0 ? 'opacity-100' : 'opacity-0'}`}>{chapter.place}</p>
          <p
            className={`absolute left-0 top-0 whitespace-nowrap transition-opacity duration-500 ${active === 0 ? 'opacity-0' : 'opacity-100'}`}
            aria-live="polite"
            aria-label={step ? `${chapter.spine.before} ${fmt(step.spine)} ${chapter.spine.after}` : undefined}
          >
            <span aria-hidden="true">
              {chapter.spine.before} <span ref={spineNumRef} className="tabular-nums">0</span> {chapter.spine.after}
            </span>
          </p>
        </div>

        {/* Words */}
        <div className="pointer-events-none absolute inset-0 text-sun lg:text-ink lg:group-data-[dark=true]/scene:text-sun">
          <div
            data-panel=""
            data-index={0}
            className="absolute inset-x-5 bottom-24 md:inset-x-10 md:bottom-28 lg:bottom-auto lg:top-[calc(16%+clamp(3.6rem,15vw,15rem)*1.02)]"
          >
            <p data-body="" className="max-w-[24ch] font-display text-2xl font-bold leading-tight md:text-4xl lg:font-body lg:text-2xl lg:font-normal">
              {chapter.tagline}
            </p>
            <p data-body="" className="mt-3 text-base opacity-75">
              <span className="pointer-coarse:hidden">Scroll to begin</span>
              <span className="hidden pointer-coarse:inline">Swipe up to begin</span>
            </p>
          </div>

          {chapter.steps.map((s, i) => (
            <div
              key={s.heading}
              data-panel=""
              data-index={i + 1}
              // Centred with flexbox, not translate: GSAP animates this panel's transform and would erase a CSS translate.
              className="absolute inset-x-5 bottom-24 md:inset-x-10 md:bottom-28 lg:inset-x-auto lg:inset-y-0 lg:left-10 lg:flex lg:w-[min(32rem,34vw)] lg:flex-col lg:justify-center"
            >
              {s.figure && <FigureView figure={s.figure} />}
              <h2
                data-heading=""
                className="mt-4 text-[clamp(1.55rem,6.5vw,2.1rem)] leading-[1.12] md:text-[2.8rem] lg:mt-8 lg:text-[clamp(2rem,2.9vw,3.2rem)]"
              >
                {s.heading}
              </h2>
              <p data-body="" className="mt-3 max-w-[36ch] text-base leading-snug md:text-xl md:leading-relaxed lg:mt-4 lg:text-xl">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => nav.go(atEnd ? count : nav.current() + 1)}
          aria-label={atEnd ? 'Continue below' : 'Next part of the story'}
          className="absolute bottom-5 right-5 z-10 grid h-12 w-12 place-items-center rounded-full bg-sun text-ink shadow-[0_4px_20px_rgb(0_0_0/0.25)] transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-10 lg:h-14 lg:w-14"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
          <div className="h-full origin-left bg-sun" style={{ transform: 'scaleX(var(--progress, 0))' }} />
        </div>
      </div>
    </section>
  )
}

function FigureView({ figure }: { figure: Figure }) {
  const d = figure.decimals ?? 0
  return (
    <div data-figure="">
      <p
        aria-label={`${fmt(figure.value, d)}${figure.unit ? ` ${figure.unit}` : ''}`}
        className="font-display font-extrabold leading-[0.85] tracking-[-0.04em] text-[clamp(3.2rem,16vw,4.6rem)] [@media(max-height:700px)]:text-[clamp(2.8rem,13vw,3.6rem)] md:text-[6.5rem] lg:text-[clamp(5rem,9vw,9.5rem)] lg:[@media(max-height:700px)]:text-[clamp(4rem,8vw,6.5rem)]"
      >
        <span aria-hidden="true" data-num="" data-value={figure.value} data-decimals={d} className="tabular-nums">
          {fmt(figure.value, d)}
        </span>
        {figure.unit && (
          <span aria-hidden="true" className="ml-[0.12em] text-[0.36em] tracking-normal">
            {figure.unit}
          </span>
        )}
      </p>
      <p className="mt-2 text-sm opacity-80 md:text-lg">{figure.label}</p>
    </div>
  )
}

/** Reduced motion: the same story as a plain, readable column. Nothing moves. */
function StaticStory({ chapter }: { chapter: Chapter }) {
  return (
    <section aria-label={`The story of ${chapter.name}`} className="bg-basalt px-5 pb-16 pt-20 md:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-display text-xl font-bold">{chapter.place}</p>
        <h1 className="mt-4 text-[clamp(3rem,12vw,8rem)] leading-[0.85]">{chapter.name}</h1>
        <p className="mt-4 max-w-[30ch] text-xl">{chapter.tagline}</p>
        <model-viewer
          src={chapter.model.src}
          alt={chapter.model.alt}
          camera-orbit={chapter.title.orbit}
          disable-zoom=""
          camera-controls=""
          style={{ display: 'block', width: '100%', height: '50vh', marginTop: '2rem', background: 'transparent' }}
        />
        <ol className="mt-10 space-y-14">
          {chapter.steps.map((s) => (
            <li key={s.heading}>
              <p className="font-display font-bold opacity-80">
                {chapter.spine.before} {fmt(s.spine)} {chapter.spine.after}
              </p>
              {s.figure && <FigureView figure={s.figure} />}
              <h2 className="mt-4 text-3xl">{s.heading}</h2>
              <p className="mt-3 max-w-[40ch] text-lg">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
