import '@google/model-viewer'
import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Chapter, Figure } from '../data/types'
import { gsap, isNarrow, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from '../scroll/smoothScroll'
import DustField from './DustField'

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** The camera holds while a step is being read, then travels to the next shot. */
const hold = (t: number) => {
  const u = clamp01((t - 0.18) / 0.64)
  return u * u * (3 - 2 * u)
}

type Vec3 = [number, number, number]
interface Shot {
  theta: number
  phi: number
  radius: number
  target: Vec3 | null // null = the model's own centre
  storm: number
  day: number
}

function toShot(s: { orbit: string; target: string; storm: number }, day: number): Shot {
  const [theta, phi, radius] = s.orbit.split(/\s+/).map(parseFloat)
  const target = s.target === 'auto' ? null : (s.target.split(/\s+/).map(parseFloat) as Vec3)
  return { theta, phi, radius, target, storm: s.storm, day }
}

/** Where on screen a step's words sit when that step is "being read". Phones read below the machine. */
const focusLine = () => (isNarrow() ? 0.77 : 0.5)

/**
 * The chapter story as a page that really scrolls. The machine stays on screen (sticky) while the
 * words travel up past it. Everything is scrubbed to the scrollbar and runs backwards on the way up:
 * the camera, the sky, the day counter, each counting number and each heading's line reveal.
 */
export default function StoryScene({ chapter }: { chapter: Chapter }) {
  const reduced = prefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<ModelViewerElement>(null)
  const photoRef = useRef<HTMLImageElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)
  const stormRef = useRef(chapter.title.storm)
  const autoTarget = useRef<Vec3>([0, 0.5, 0])
  const refresh = useRef<() => void>(() => {})
  const [loaded, setLoaded] = useState(false)

  const firstDay = chapter.steps[0]?.spine ?? 0

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = stageRef.current
      if (!root || !stage) return
      const shots = [toShot(chapter.title, firstDay), ...chapter.steps.map((s) => toShot(s, s.spine))]
      const blocks = gsap.utils.toArray<HTMLElement>('[data-block]', root)

      // Scroll positions at which each shot is fully "on": the top of the scene for the title,
      // then the point where each block of words crosses the reading line.
      let centres: number[] = []
      const measure = () => {
        const y = window.scrollY
        const vh = window.innerHeight
        centres = [
          root.getBoundingClientRect().top + y,
          ...blocks.map((b) => {
            const r = b.getBoundingClientRect()
            return r.top + y + r.height / 2 - focusLine() * vh
          }),
        ]
      }

      let lastOrbit = ''
      let lastTarget = ''
      let lastDay = -1
      let lastStorm = -1
      let lastPan = ''
      const apply = () => {
        if (centres.length < 2) return
        const y = window.scrollY
        let i = 0
        while (i < centres.length - 2 && y >= centres[i + 1]) i++
        const span = centres[i + 1] - centres[i]
        const raw = span > 0 ? clamp01((y - centres[i]) / span) : 0
        const t = reduced ? Math.round(raw) : hold(raw)
        const a = shots[i]
        const b = shots[i + 1]

        const narrow = isNarrow()
        const theta = lerp(a.theta, b.theta, t)
        const radius = lerp(a.radius, b.radius, t) * (narrow ? 1.3 : 1)
        const orbit = `${theta.toFixed(2)}deg ${lerp(a.phi, b.phi, t).toFixed(2)}deg ${radius.toFixed(3)}m`
        const ta = a.target ?? autoTarget.current
        const tb = b.target ?? autoTarget.current
        const target = ta.map((v, k) => `${lerp(v, tb[k], t).toFixed(3)}m`).join(' ')
        const mv = modelRef.current
        if (mv && (orbit !== lastOrbit || target !== lastTarget)) {
          lastOrbit = orbit
          lastTarget = target
          mv.cameraOrbit = orbit
          mv.cameraTarget = target
          if (reduced) mv.jumpCameraToGoal()
        }

        // The ground photo slides a little as the camera swings round, so the machine sits in a place.
        const pan = `translate3d(calc(-50% + ${(-theta * (narrow ? 2 : 5)).toFixed(1)}px), 0, 0)`
        if (photoRef.current && pan !== lastPan) {
          lastPan = pan
          photoRef.current.style.transform = pan
        }

        const storm = lerp(a.storm, b.storm, raw)
        stormRef.current = storm
        if (Math.abs(storm - lastStorm) > 0.002) {
          lastStorm = storm
          stage.style.setProperty('--storm', storm.toFixed(3))
          stage.dataset.dark = storm > 0.42 ? 'true' : 'false'
        }

        const day = Math.round(lerp(a.day, b.day, t))
        if (dayRef.current && day !== lastDay) {
          lastDay = day
          dayRef.current.textContent = fmt(day)
        }
      }

      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onRefresh: () => {
          measure()
          apply()
        },
        onUpdate: apply,
      })
      refresh.current = () => {
        measure()
        apply()
      }

      // The name: letters rise once on arrival, then scrolling lifts them away one by one.
      const titleEl = root.querySelector<HTMLElement>('[data-title]')
      const title = titleEl ? SplitText.create(titleEl, { type: 'chars', mask: 'chars' }) : null
      if (title && !reduced)
        gsap.from(title.chars, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.025, delay: 0.15 })

      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 0.6)}`,
          scrub: reduced ? true : 0.4,
          invalidateOnRefresh: true,
        },
      })
      if (title) {
        if (reduced) intro.to(titleEl, { opacity: 0, duration: 0.5 }, 0)
        else
          intro.to(
            title.chars,
            {
              // Lift each letter clear of its (padded) mask.
              y: (_: number, el: HTMLElement) => -(el.parentElement?.offsetHeight ?? el.offsetHeight) * 1.2,
              duration: 0.5,
              ease: 'power2.inOut',
              stagger: 0.02,
            },
            0,
          )
      }
      intro
        .to(stage.querySelectorAll('[data-intro-only]'), { autoAlpha: 0, duration: 0.25 }, 0)
        .to(root.querySelector('[data-tagline]'), { autoAlpha: 0, duration: 0.3 }, 0.05)
        .fromTo(stage.querySelector('[data-day]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0.45)
        .fromTo(stage.querySelector('[data-scrim]'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)

      if (!reduced) {
        blocks.forEach((block) => {
          const heading = block.querySelector<HTMLElement>('[data-heading]')
          const figure = block.querySelector<HTMLElement>('[data-figure]')
          const num = block.querySelector<HTMLElement>('[data-num]')
          const body = block.querySelectorAll('[data-body]')
          if (!heading) return
          SplitText.create(heading, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            // Returning the timeline lets SplitText rebuild it (keeping its progress) after a re-split.
            onSplit: (self) => {
              const tl = gsap.timeline({
                scrollTrigger: {
                  trigger: block,
                  start: () => (isNarrow() ? 'top 98%' : 'top 92%'),
                  end: () => (isNarrow() ? 'top 66%' : 'top 46%'),
                  scrub: 0.5,
                  invalidateOnRefresh: true,
                },
              })
              if (figure) tl.from(figure, { yPercent: 35, opacity: 0, duration: 0.45, ease: 'power3.out' }, 0)
              if (num) {
                const value = Number(num.dataset.value)
                const decimals = Number(num.dataset.decimals)
                const counter = { v: 0 }
                let shown = fmt(0, decimals)
                num.textContent = shown
                tl.to(
                  counter,
                  {
                    v: value,
                    duration: 0.75,
                    ease: 'power2.out',
                    onUpdate: () => {
                      const s = fmt(counter.v, decimals)
                      if (s !== shown) num.textContent = shown = s
                    },
                  },
                  0,
                )
              }
              tl.from(self.lines, { yPercent: 110, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, 0.15)
              tl.from(body, { opacity: 0, y: 14, duration: 0.4, ease: 'power2.out' }, 0.42)
              return tl
            },
          })
        })
      }

      // Wide screens: words fade before they reach the day counter at the top.
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        blocks.forEach((block) =>
          gsap.to(block, {
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: block, start: 'top 24%', end: 'top 4%', scrub: true },
          }),
        )
      })

      if (import.meta.env.DEV) {
        // Used by the dev frames page to put every frame on the same step.
        ;(window as unknown as { __step?: (i: number) => void }).__step = (i: number) =>
          window.scrollTo(0, Math.max(0, centres[Math.min(i, centres.length - 1)] ?? 0))
      }
      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [chapter.slug] },
  )

  useEffect(() => {
    const mv = modelRef.current
    if (!mv) return
    const onLoad = () => {
      const c = mv.getBoundingBoxCenter()
      autoTarget.current = [c.x, c.y, c.z]
      setLoaded(true)
      refresh.current()
      ScrollTrigger.refresh()
    }
    mv.addEventListener('load', onLoad)
    return () => mv.removeEventListener('load', onLoad)
  }, [])

  return (
    <section ref={rootRef} aria-label={`The story of ${chapter.name}`} className="relative">
      {/* The stage stays on screen for the whole story. On phones it is a panel at the top that sits
          above the words, which slide under its faded edge; on wide screens it fills the screen behind them. */}
      <div className="pointer-events-none sticky top-0 z-20 h-0 lg:z-0">
        <div
          ref={stageRef}
          data-dark="false"
          className="group/stage absolute inset-x-0 top-0 h-[54svh] overflow-hidden [@media(max-height:700px)]:h-[50svh] lg:h-[100svh] lg:[@media(max-height:700px)]:h-[100svh]"
          style={
            {
              '--storm': chapter.title.storm,
              background: `linear-gradient(to bottom,
                color-mix(in oklab, var(--color-mars-sky), var(--color-mars-storm) calc(var(--storm) * 100%)) 0%,
                color-mix(in oklab, var(--color-mars-horizon), var(--color-mars-storm-horizon) calc(var(--storm) * 100%)) 100%)`,
            } as React.CSSProperties
          }
        >
          {/* The ground: Opportunity's own panorama of Eagle crater, where it landed */}
          <div className="absolute inset-x-0 bottom-0 h-[42%] lg:h-[44%]">
            <picture>
              <source media="(min-width: 1024px)" srcSet="photos/eagle-crater-wide.webp" />
              <img
                ref={photoRef}
                src="photos/eagle-crater-narrow.webp"
                alt=""
                decoding="async"
                className="absolute bottom-0 left-1/2 h-full w-auto max-w-none [mask-image:linear-gradient(to_bottom,transparent,black_18%)]"
                style={{ transform: 'translate3d(-50%, 0, 0)' }}
              />
            </picture>
            <div aria-hidden="true" className="absolute inset-0 bg-mars-storm" style={{ opacity: 'calc(var(--storm) * 0.75)' }} />
          </div>

          <DustField stormRef={stormRef} className="absolute inset-0 h-full w-full" />

          {/* The name, huge, behind the machine */}
          <h1
            data-title=""
            // nowrap: the letters are split into separate boxes, which would otherwise let the word break anywhere.
            // The letter masks get extra room so descenders and tall letters are not clipped.
            className="absolute inset-x-5 top-[13%] whitespace-nowrap [&>div]:-mb-[0.3em] [&>div]:-mt-[0.12em] [&>div]:pb-[0.3em] [&>div]:pt-[0.12em] text-[clamp(2.5rem,13.2vw,15rem)] leading-[0.9] text-ink md:inset-x-10 lg:top-[13%] lg:text-[clamp(3.6rem,15vw,15rem)]"
          >
            {chapter.name}
          </h1>

          <model-viewer
            ref={modelRef}
            src={chapter.model.src}
            alt={chapter.model.alt}
            camera-orbit={chapter.title.orbit}
            camera-target={chapter.title.target}
            interpolation-decay="45"
            disable-zoom=""
            shadow-intensity="1.1"
            shadow-softness="0.9"
            exposure="1.05"
            tone-mapping="neutral"
            environment-image="neutral"
            style={{ position: 'absolute', background: 'transparent', pointerEvents: 'none' }}
            class={`inset-x-0 bottom-[6%] top-[14%] h-auto w-full transition-opacity duration-500 lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[62%] ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
          {!loaded && (
            <p className="absolute bottom-[12%] right-5 text-sm text-ink lg:right-10">Receiving {chapter.name}&hellip;</p>
          )}

          {/* Wide screens: the left side darkens once the story starts, so light words read over sky and ground */}
          <div
            data-scrim=""
            aria-hidden="true"
            className="absolute inset-y-0 left-0 hidden w-[64%] bg-[linear-gradient(to_right,rgb(36_24_18/0.94)_0%,rgb(36_24_18/0.82)_40%,transparent)] opacity-0 lg:block"
          />
          {/* Phones: the panel's lower edge fades into the ground the words scroll on */}
          <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-[30%] bg-linear-to-b from-transparent via-basalt/70 via-55% to-basalt lg:hidden" />

          {/* Top-left: where we are, then the running day counter */}
          <div className="absolute left-5 top-5 font-display text-lg font-bold leading-tight md:left-10 lg:top-8 lg:text-2xl">
            <p data-intro-only="" className="text-ink">
              {chapter.place}
            </p>
            <p
              data-day=""
              aria-hidden="true"
              className="invisible absolute left-0 top-0 whitespace-nowrap text-ink opacity-0 group-data-[dark=true]/stage:text-sun lg:text-sun"
            >
              {chapter.spine.before}{' '}
              <span ref={dayRef} className="tabular-nums">
                {fmt(firstDay)}
              </span>{' '}
              {chapter.spine.after}
            </p>
          </div>
          <a
            href="#/"
            data-intro-only=""
            className="pointer-events-auto absolute right-8 top-5 hidden min-h-11 items-center px-2 font-display text-2xl font-bold text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-current lg:inline-flex"
          >
            Ghost Signals
          </a>
        </div>
      </div>

      {/* The words. They scroll like any page. */}
      <div className="relative z-10">
        <header className="relative h-[100svh]">
          <div
            data-tagline=""
            className="absolute inset-x-5 top-[57svh] md:inset-x-10 [@media(max-height:700px)]:top-[53svh] lg:top-[calc(13%+clamp(3.6rem,15vw,15rem)*0.98)] lg:[@media(max-height:700px)]:top-[calc(13%+clamp(3.6rem,15vw,15rem)*0.98)]"
          >
            <p className="max-w-[24ch] font-display text-[clamp(1.4rem,6.4vw,2.25rem)] font-bold leading-tight text-sun lg:max-w-[26ch] lg:font-body lg:text-2xl lg:font-normal lg:text-ink">
              {chapter.tagline}
            </p>
            {/* Phones: the way home sits under the opening line rather than crowding the top */}
            <a
              href="#/"
              className="mt-4 inline-flex min-h-11 items-center font-display text-lg font-bold text-sun/80 underline decoration-1 underline-offset-[6px] lg:hidden"
            >
              Ghost Signals
            </a>
          </div>
        </header>

        {chapter.steps.map((s) => (
          <article key={s.heading} className="flex min-h-[66svh] items-start px-5 md:px-10 lg:min-h-[100svh] lg:items-center">
            <div data-block="" className="w-full max-w-[34rem] text-sun lg:w-[min(32rem,36vw)]">
              <p className="sr-only">
                {chapter.spine.before} {fmt(s.spine)} {chapter.spine.after}.
              </p>
              {s.figure && <FigureView figure={s.figure} />}
              <h2
                data-heading=""
                className="mt-4 text-[clamp(1.6rem,6.6vw,2.2rem)] [&>div]:-mb-[0.12em] [&>div]:pb-[0.12em] leading-[1.08] md:text-[2.8rem] lg:mt-7 lg:text-[clamp(2rem,2.9vw,3.2rem)]"
              >
                {s.heading}
              </h2>
              <p data-body="" className="mt-3 max-w-[36ch] text-base leading-snug text-sun/90 md:text-xl md:leading-relaxed lg:mt-4">
                {s.body}
              </p>
            </div>
          </article>
        ))}
        <div aria-hidden="true" className="h-[30svh] lg:h-[10svh]" />
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
        className="font-display font-extrabold leading-[0.85] tracking-[-0.035em] text-[clamp(3.2rem,16vw,4.6rem)] [@media(max-height:700px)]:text-[clamp(2.8rem,13vw,3.6rem)] md:text-[6.5rem] lg:text-[clamp(5rem,9vw,9.5rem)] lg:[@media(max-height:700px)]:text-[clamp(4rem,8vw,6.5rem)]"
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
      <p className="mt-2 text-sm text-sun/80 md:text-lg">{figure.label}</p>
    </div>
  )
}
