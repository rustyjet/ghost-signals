import type { ModelViewerElement } from '@google/model-viewer'
import { useEffect, useRef, useState } from 'react'
import type { Chapter, Figure } from '../data/types'
import { gsap, isNarrow, prefersReducedMotion, ScrollTrigger, SplitText, splitTitle, TITLE_RISE, useGSAP } from '../scroll/smoothScroll'
import Backdrop, { makeBackdropController, type Shot } from './story/Backdrop'
import StepSound from './story/StepSound'

/** Numbers as the story shows them: grouped thousands (unless `plain`), and a true minus sign. */
const fmt = (n: number, decimals = 0, plain = false) =>
  n.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: !plain }).replace('-', '−')

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** The counter holds while a step is being read, then rolls on to the next value. */
const hold = (t: number) => {
  const u = clamp01((t - 0.18) / 0.64)
  return u * u * (3 - 2 * u)
}

/** Where on screen a step's words sit when that step is "being read". Phones read in the lower part. */
const focusLine = () => (isNarrow() ? 0.74 : 0.5)

/**
 * The chapter story as a page that really scrolls. A full-screen backdrop (the 3D machine at the start
 * and end, real NASA photos between) stays behind the words, which travel up past it. Everything is
 * scrubbed to the scrollbar and runs backwards on the way up.
 */
export default function StoryScene({ chapter }: { chapter: Chapter }) {
  const reduced = prefersReducedMotion()
  const rootRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const modelRef = useRef<ModelViewerElement>(null)
  const dayRef = useRef<HTMLSpanElement>(null)
  const stormRef = useRef(chapter.title.storm)
  const autoTarget = useRef<[number, number, number]>([0, 0.5, 0])
  const refresh = useRef<() => void>(() => {})
  const [loaded, setLoaded] = useState(false)

  const shots: Shot[] = [chapter.title, ...chapter.steps]
  const firstDay = chapter.steps[0]?.spine ?? 0

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current
      const backdrop = backdropRef.current
      const chrome = chromeRef.current
      if (!root || !backdrop || !chrome) return
      const n = shots.length
      const days = [firstDay, ...chapter.steps.map((s) => s.spine)]
      const silents = [false, ...chapter.steps.map((s) => !!s.silent)]
      const blocks = gsap.utils.toArray<HTMLElement>('[data-block]', root)
      const scenes = makeBackdropController(backdrop, shots, {
        reduced,
        model: () => modelRef.current,
        autoTarget: () => autoTarget.current,
        stormRef,
      })

      // Scroll positions where each shot is "on": the top of the story for the title, the point where
      // each step's words cross the reading line, and finally the end of the story.
      let centres: number[] = []
      const measure = () => {
        const y = window.scrollY
        const vh = window.innerHeight
        const box = root.getBoundingClientRect()
        centres = [
          box.top + y,
          ...blocks.map((b) => {
            const r = (b.querySelector('[data-words]') ?? b).getBoundingClientRect()
            return r.top + y + r.height / 2 - focusLine() * vh
          }),
          box.bottom + y - vh,
        ]
      }

      let lastDay = -1
      let lastSilent: boolean | null = null
      const apply = () => {
        if (centres.length < 2) return
        const y = window.scrollY
        let i = 0
        while (i < centres.length - 2 && y >= centres[i + 1]) i++
        const span = centres[i + 1] - centres[i]
        const raw = span > 0 ? clamp01((y - centres[i]) / span) : 0
        scenes.apply(i + raw)

        // The day counter: shots only, so it stops at the last step.
        const a = Math.min(i, n - 1)
        const b = Math.min(i + 1, n - 1)
        const t = reduced ? Math.round(raw) : hold(raw)
        const day = Math.round(lerp(days[a], days[b], t))
        if (dayRef.current && day !== lastDay) {
          lastDay = day
          dayRef.current.textContent = fmt(day)
        }
        const silent = t > 0.5 ? silents[b] : silents[a]
        if (silent !== lastSilent) {
          lastSilent = silent
          chrome.dataset.silent = silent ? 'true' : 'false'
        }
      }

      refresh.current = () => {
        scenes.layout()
        measure()
        apply()
      }
      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onRefresh: refresh.current,
        onUpdate: apply,
      })
      refresh.current()

      // The name: letters rise once on arrival, then scrolling lifts them away one by one. Split only
      // once the display font has loaded, or the letter masks are measured on the fallback font and clip.
      const titleEl = backdrop.querySelector<HTMLElement>('[data-title]')
      if (titleEl && !reduced) {
        document.fonts.ready.then(
          contextSafe!(() => {
            // Words as well as letters, so a long name can only break between words
            const title = splitTitle(titleEl)
            gsap.from(title.chars, { yPercent: TITLE_RISE, duration: 0.8, ease: 'expo.out', stagger: 0.025, delay: 0.1 })
            // Fixed values (no per-letter measuring), so a refresh mid-scroll can never strand a letter.
            gsap.to(title.masks, {
              yPercent: -60,
              opacity: 0,
              ease: 'power1.inOut',
              stagger: 0.025,
              scrollTrigger: { trigger: root, start: 'top top', end: '+=40%', scrub: 0.4 },
            })
          }),
        )
      }

      const intro = gsap.timeline({
        scrollTrigger: { trigger: root, start: 'top top', end: '+=60%', scrub: reduced ? true : 0.4 },
      })
      if (titleEl && reduced) intro.to(titleEl, { opacity: 0, duration: 0.5 }, 0)
      intro
        .to(chrome.querySelectorAll('[data-intro-only]'), { autoAlpha: 0, duration: 0.25 }, 0)
        .to(root.querySelector('[data-tagline]'), { autoAlpha: 0, duration: 0.3 }, 0.05)
        .fromTo(chrome.querySelectorAll('[data-day],[data-topshade]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0.45)
        .fromTo(chrome.querySelectorAll('[data-scrim]'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)

      gsap.to(chrome.querySelector('[data-endshade]'), {
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'bottom 125%', end: 'bottom 100%', scrub: true },
      })
      gsap.to(chrome.querySelector('[data-counter]'), {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'bottom 120%', end: 'bottom 100%', scrub: true },
      })

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
                const plain = num.dataset.plain === 'true'
                const counter = { v: 0 }
                let shown = fmt(0, decimals, plain)
                num.textContent = shown
                tl.to(
                  counter,
                  {
                    v: value,
                    duration: 0.75,
                    ease: 'power2.out',
                    onUpdate: () => {
                      const s = fmt(counter.v, decimals, plain)
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

      // Each part of the words fades on its own near the top of the screen, before the day counter. On phones
      // they pass over the picture on the way up; their shadow (data-words) keeps them readable there.
      gsap.utils.toArray<HTMLElement>('[data-fade]', root).forEach((el) =>
        gsap.to(el, { opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 24%', end: 'top 8%', scrub: true } }),
      )

      if (import.meta.env.DEV) {
        // Used by the dev frames page to put every frame on the same step.
        ;(window as unknown as { __step?: (i: number) => void }).__step = (i: number) =>
          window.scrollTo(0, Math.max(0, centres[Math.min(i, centres.length - 1)] ?? 0))
      }
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
      {/* The screen behind the words. Sticky, full screen, never above the words. */}
      {/* Full height with a matching negative margin: it lets go exactly where the story ends, instead of
          hanging over the next section. */}
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh]">
        <div ref={chromeRef} data-silent="false" className="group/chrome absolute inset-x-0 top-0 h-[100svh]">
          <Backdrop
            shots={shots}
            model={chapter.model}
            modelRef={modelRef}
            stormRef={stormRef}
            title={chapter.name}
            loaded={loaded}
            rootRef={backdropRef}
            world={chapter.world}
          />

          {/* Wide screens: a band down the middle darkens once the story starts, so light words read over any
              picture while both sides of the picture stay bright */}
          <div
            data-scrim=""
            aria-hidden="true"
            className="absolute inset-0 hidden bg-[radial-gradient(ellipse_44%_90%_at_50%_50%,color-mix(in_srgb,var(--color-basalt)_88%,transparent)_0%,color-mix(in_srgb,var(--color-basalt)_80%,transparent)_45%,color-mix(in_srgb,var(--color-basalt)_40%,transparent)_75%,transparent_100%)] opacity-0 lg:block"
          />
          {/* Phones: the lower part of the picture darkens; the words are read there */}
          <div
            data-scrim=""
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[64%] opacity-0 bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_srgb,var(--color-basalt)_82%,transparent)_32%,color-mix(in_srgb,var(--color-basalt)_94%,transparent)_100%)] lg:hidden"
          />
          {/* Top edge: a little shade so the day counter reads on any picture */}
          <div
            data-topshade=""
            aria-hidden="true"
            className="invisible absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent opacity-0"
          />
          {/* The end: the picture sinks into the page's own dark, so the next section follows without an edge */}
          <div data-endshade="" aria-hidden="true" className="absolute inset-0 bg-basalt opacity-0" />

          <div data-counter="" className="absolute left-5 top-5 font-display text-[clamp(0.95rem,4.8vw,1.125rem)] font-bold leading-tight md:left-10 md:text-lg lg:top-8 lg:text-2xl">
            <p data-intro-only="" className="text-on-sky">
              {chapter.place}
            </p>
            {/* One line while it fits; on the narrowest phones the ending ("of 5 planned, then grounded") drops to a
                second line instead of running off the screen */}
            <p data-day="" aria-hidden="true" className="invisible absolute left-0 top-0 w-max max-w-[calc(100vw-2.5rem)] text-sun opacity-0 md:max-w-[calc(100vw-5rem)]">
              {chapter.spine.before}{' '}
              <span ref={dayRef} className="tabular-nums">
                {fmt(firstDay)}
              </span>{' '}
              {/* Both endings share one grid cell, so swapping them never moves the number */}
              <span className="inline-grid">
                <span className="[grid-area:1/1] transition-opacity duration-300 group-data-[silent=true]/chrome:opacity-0">
                  {chapter.spine.after}
                </span>
                {chapter.spine.silentAfter && (
                  <span className="opacity-0 [grid-area:1/1] transition-opacity duration-300 group-data-[silent=true]/chrome:opacity-100">
                    {chapter.spine.silentAfter}
                  </span>
                )}
              </span>
            </p>
          </div>
          <a
            href="#/"
            data-intro-only=""
            className="pointer-events-auto absolute right-8 top-5 hidden min-h-11 items-center px-2 font-display text-2xl font-bold text-on-sky underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-current lg:inline-flex"
          >
            Ghost Signals
          </a>
        </div>
      </div>

      {/* The words. They scroll like any page. */}
      <div className="relative z-10">
        <header className="relative h-stage-100">
          <h1 className="sr-only">{chapter.name}</h1>
          <div
            data-tagline=""
            className={`${taglineShade} absolute inset-x-5 bottom-[9svh] md:inset-x-10 lg:bottom-auto lg:top-[calc(13%+clamp(3.6rem,15vw,15rem)*0.98)]`}
          >
            <p className="max-w-[24ch] font-display text-[clamp(1.4rem,6.4vw,2.25rem)] font-bold leading-tight text-sun [text-shadow:0_1px_14px_rgb(0_0_0/0.65)] lg:max-w-[26ch] lg:[text-shadow:none] lg:font-body lg:text-2xl lg:font-normal lg:text-on-sky">
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
          // overflow-x-clip: the words' shade reaches past the screen's edge on phones; clipped here so the
          // page never scrolls sideways (the body's own clip does not catch it)
          <article key={s.heading} className="flex overflow-x-clip min-h-stage-70 items-start justify-center px-5 md:px-10 lg:min-h-stage-100 lg:items-center">
            <div data-block="" className="w-full max-w-[34rem] text-center text-sun lg:w-[min(36rem,42vw)]">
              {/* Phones: the dark only covers the lower part, so the words carry a shadow (as the opening line
                  does) for the stretch where they rise over the picture */}
              <div data-words="" className="[text-shadow:0_1px_14px_rgb(0_0_0/0.65)] lg:[text-shadow:none]">
                <p className="sr-only">
                  {chapter.spine.before} {fmt(s.spine)} {s.silent && chapter.spine.silentAfter ? chapter.spine.silentAfter : chapter.spine.after}.
                </p>
                {s.figure && <FigureView figure={s.figure} />}
                <h2
                  data-heading=""
                  data-fade=""
                  className={`${wordsShade} mt-4 text-balance text-[clamp(1.6rem,6.6vw,2.2rem)] leading-[1.08] md:text-[2.8rem] lg:mt-7 lg:text-[clamp(2rem,2.9vw,3.2rem)] [&>div]:-mb-[0.12em] [&>div]:pb-[0.12em]`}
                >
                  {s.heading}
                </h2>
                {/* Entrance and exit animate different elements, so the two fades never fight over one opacity */}
                <div data-fade="" className={wordsShade}>
                  <p data-body="" className="mx-auto mt-3 max-w-[36ch] text-base leading-snug text-sun/90 md:text-xl md:leading-relaxed lg:mt-4">
                    {s.body}
                  </p>
                </div>
                {/* A real NASA recording of this moment, off until pressed. Its own fading part, so it leaves
                    the screen on its own like the rest of the words; data-body gives it the body's entrance. */}
                {s.sound && (
                  <div data-fade="" className={wordsShade}>
                    <div data-body="">
                      <StepSound sound={s.sound} />
                    </div>
                  </div>
                )}
                <SceneDescription scene={s.scene} />
              </div>
            </div>
          </article>
        ))}
        {/* Room after the last words, so the rover is seen alone before the picture sinks into the dark */}
        <div aria-hidden="true" className="h-stage-70 lg:h-stage-60" />
      </div>
    </section>
  )
}

/** Screen readers hear what the picture behind the words shows. */
function SceneDescription({ scene }: { scene: Chapter['steps'][number]['scene'] }) {
  const alt =
    scene.kind === 'photo'
      ? scene.image.alt
      : scene.kind === 'compare'
        ? `${scene.before.alt} Then: ${scene.after.alt}`
        : scene.kind === 'rover'
          ? scene.ground.alt
          : 'The screen is black.'
  return <p className="sr-only">Picture: {alt}</p>
}

/**
 * Phones: a soft band of the page's dark behind one part of the words. The words cross the picture on their
 * way up and a text shadow alone is not enough over a pale picture (sky, sand). It sits on each fading part,
 * not on the whole block, so it fades with that part and never stays behind once the words have gone.
 */
const wordsShade =
  'relative isolate before:pointer-events-none before:absolute before:-inset-x-12 before:-inset-y-10 before:-z-10 before:bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-basalt)_68%,transparent)_0%,color-mix(in_srgb,var(--color-basalt)_68%,transparent)_55%,transparent_100%)] lg:before:hidden'
/** The same shade behind the opening line on phones, which is set left, so its middle sits left too. */
const taglineShade =
  'isolate before:pointer-events-none before:absolute before:-inset-x-5 before:-inset-y-10 before:-z-10 before:bg-[radial-gradient(farthest-side_at_38%_50%,color-mix(in_srgb,var(--color-basalt)_68%,transparent)_0%,color-mix(in_srgb,var(--color-basalt)_68%,transparent)_50%,transparent_100%)] md:before:-inset-x-10 lg:before:hidden'

function FigureView({ figure }: { figure: Figure }) {
  const d = figure.decimals ?? 0
  return (
    <div data-fade="" className={wordsShade}>
    <div data-figure="">
      <p
        aria-label={`${fmt(figure.value, d, figure.plain)}${figure.unit ? ` ${figure.unit}` : ''}`}
        className="font-display font-extrabold leading-[0.85] tracking-[-0.035em] text-[clamp(3.2rem,16vw,4.6rem)] [@media(max-height:700px)]:text-[clamp(2.8rem,13vw,3.6rem)] md:text-[6.5rem] lg:text-[clamp(5rem,9vw,9.5rem)] lg:[@media(max-height:700px)]:text-[clamp(4rem,8vw,6.5rem)]"
      >
        <span aria-hidden="true" data-num="" data-value={figure.value} data-decimals={d} data-plain={figure.plain ? 'true' : 'false'} className="tabular-nums">
          {fmt(figure.value, d, figure.plain)}
        </span>
        {figure.unit && (
          <span aria-hidden="true" className={`text-[0.36em] tracking-normal ${figure.unit === '+' || figure.unit === '%' ? '' : 'ml-[0.12em]'}`}>
            {figure.unit}
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-sun/80 md:text-lg">{figure.label}</p>
    </div>
    </div>
  )
}
