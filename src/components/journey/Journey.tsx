import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { getChapter } from '../../data/chapters'
import { globes, stops, type Globe, type Pose } from '../../data/journey'
import { gsap, isNarrow, prefersReducedMotion, ScrollTrigger, SplitText, useGSAP } from '../../scroll/smoothScroll'

const GLOBES: Globe[] = ['earth', 'moon', 'mars']
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Hold still while a stop is read, then travel on to the next one. */
const hold = (t: number) => {
  const u = clamp01((t - 0.15) / 0.7)
  return u * u * (3 - 2 * u)
}
const focusLine = () => (isNarrow() ? 0.74 : 0.5)

/** "12,345 km", or "12.3 million km" past a million. */
function distance(km: number) {
  if (km < 1) return 'On Earth'
  // Past 1,000 km the last two digits would only flicker, so it counts in hundreds.
  if (km < 1e6) return `${Math.round(km < 1000 ? km : Math.round(km / 100) * 100).toLocaleString('en-GB')} km from Earth`
  const m = km / 1e6
  return `${m < 10 ? m.toFixed(1) : Math.round(m)} million km from Earth`
}

/** Each stop's pose for every globe, filled in from the stop before where a stop doesn't say. */
function resolvePoses() {
  const wide: Record<Globe, Pose>[] = []
  const narrow: Record<Globe, Pose>[] = []
  stops.forEach((s, i) => {
    const w = {} as Record<Globe, Pose>
    const n = {} as Record<Globe, Pose>
    for (const g of GLOBES) {
      const prevW = i ? wide[i - 1][g] : { x: 0, y: 0, s: 0.02, o: 0 }
      const prevN = i ? narrow[i - 1][g] : prevW
      w[g] = s.globes[g] ?? prevW
      n[g] = s.narrow?.[g] ?? (s.globes[g] ? (i === 0 ? s.globes[g]! : { ...prevN, o: s.globes[g]!.o }) : prevN)
    }
    wide.push(w)
    narrow.push(n)
  })
  return { wide, narrow }
}

/**
 * The start page as a trip: scrolling moves you away from Earth, past the Moon, out to Mars. The real
 * globes grow and pass, each machine's photo fills the screen at its stop, and the corner counts the
 * distance. Everything is scrubbed to the scrollbar.
 */
export default function Journey() {
  const rootRef = useRef<HTMLElement>(null)
  const kmRef = useRef<HTMLParagraphElement>(null)
  const machines = stops.filter((s) => s.machine)

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current
      if (!root) return
      const reduced = prefersReducedMotion()
      const poses = resolvePoses()
      const globeEls = GLOBES.map((g) => root.querySelector<HTMLElement>(`[data-globe="${g}"]`)!)
      const photoEls = machines.map((m) => root.querySelector<HTMLElement>(`[data-photo="${m.id}"]`)!)
      const blocks = gsap.utils.toArray<HTMLElement>('[data-stop]', root)

      let centres: number[] = []
      const measure = () => {
        const y = window.scrollY
        const vh = window.innerHeight
        centres = [
          root.getBoundingClientRect().top + y,
          ...blocks.map((b) => {
            const r = (b.querySelector('[data-words]') ?? b).getBoundingClientRect()
            return r.top + y + r.height / 2 - focusLine() * vh
          }),
        ]
      }

      let lastKm = ''
      const apply = () => {
        if (centres.length < 2) return
        const y = window.scrollY
        let i = 0
        while (i < centres.length - 2 && y >= centres[i + 1]) i++
        const span = centres[i + 1] - centres[i]
        const raw = span > 0 ? clamp01((y - centres[i]) / span) : y >= centres[i + 1] ? 1 : 0
        const t = reduced ? Math.round(raw) : hold(raw)
        const a = stops[i]
        const b = stops[Math.min(i + 1, stops.length - 1)]
        const set = isNarrow() ? poses.narrow : poses.wide
        const vw = window.innerWidth
        const vh = window.innerHeight

        GLOBES.forEach((g, k) => {
          const p = set[i][g]
          const q = set[Math.min(i + 1, stops.length - 1)][g]
          const x = lerp(p.x, q.x, t) * vw
          const yy = lerp(p.y, q.y, t) * vh
          const s = lerp(p.s, q.s, t)
          const o = lerp(p.o, q.o, t)
          const el = globeEls[k]
          el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${yy}px), 0) scale(${s})`
          el.style.opacity = String(o)
          el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
        })

        machines.forEach((m, k) => {
          const o = lerp(a.id === m.id ? 1 : 0, b.id === m.id ? 1 : 0, t)
          photoEls[k].style.opacity = String(o)
          photoEls[k].style.visibility = o < 0.01 ? 'hidden' : 'visible'
        })

        // Distance travels on a log scale, so the numbers race once the Moon is behind.
        const la = Math.log10(a.km + 1)
        const lb = Math.log10(b.km + 1)
        const km = Math.pow(10, lerp(la, lb, t)) - 1
        const text = distance(km)
        if (kmRef.current && text !== lastKm) kmRef.current.textContent = lastKm = text
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
      measure()
      apply()

      // Scrolling away from the title: the words go, and the dark behind later words comes in.
      const titleEl = root.querySelector<HTMLElement>('[data-title]')
      const intro = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: '+=55%', scrub: reduced ? true : 0.4 } })
      intro
        .to(root.querySelector('[data-intro]'), { autoAlpha: 0, duration: 0.3 }, 0.05)
        .fromTo(root.querySelectorAll('[data-scrim]'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.3)
      if (titleEl && reduced) intro.to(titleEl, { opacity: 0, duration: 0.4 }, 0)

      // The one entrance on load: the title's letters rise, then scrolling lifts them away. Split only
      // once the display font has loaded, or the letter masks are measured on the fallback font.
      if (titleEl && !reduced) {
        document.fonts.ready.then(
          contextSafe!(() => {
            // Words as well as letters, so a line can only break between words
            const title = SplitText.create(titleEl, { type: 'words,chars', mask: 'chars' })
            gsap.from(title.chars, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.03, delay: 0.1 })
            gsap.to(title.masks, {
              yPercent: -60,
              opacity: 0,
              ease: 'power1.inOut',
              stagger: 0.03,
              scrollTrigger: { trigger: root, start: 'top top', end: '+=40%', scrub: 0.4 },
            })
          }),
        )
      }

      if (!reduced) {
        blocks.forEach((block) => {
          const heading = block.querySelector<HTMLElement>('[data-heading]')
          const rest = block.querySelectorAll('[data-rise]')
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: block,
              start: () => (isNarrow() ? 'top 98%' : 'top 92%'),
              end: () => (isNarrow() ? 'top 66%' : 'top 46%'),
              scrub: 0.5,
              invalidateOnRefresh: true,
            },
          })
          if (heading) {
            const split = SplitText.create(heading, { type: 'lines', mask: 'lines' })
            tl.from(split.lines, { yPercent: 110, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, 0)
          }
          tl.from(rest, { opacity: 0, y: 14, duration: 0.4, ease: 'power2.out', stagger: 0.06 }, heading ? 0.25 : 0)
        })
      }

      // Words fade before they get high on the screen: on phones before the middle, where the globe is.
      const mm = gsap.matchMedia()
      const fadeAll = (start: string, end: string) =>
        gsap.utils.toArray<HTMLElement>('[data-fade]', root).forEach((el) =>
          gsap.to(el, { opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start, end, scrub: true } }),
        )
      mm.add('(min-width: 1024px)', () => fadeAll('top 24%', 'top 8%'))
      mm.add('(max-width: 1023px)', () => fadeAll('top 50%', 'top 36%'))

      if (import.meta.env.DEV) {
        ;(window as unknown as { __step?: (i: number) => void }).__step = (i: number) =>
          window.scrollTo(0, Math.max(0, centres[Math.min(i, centres.length - 1)] ?? 0))
      }
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} aria-label="A trip from Earth to the Moon and Mars" className="relative bg-black [overflow:clip]">
      {/* The view out of the window: sticky, full screen, behind the words. Its negative margin would let it hang a
          screen past the section and cover the footer; the section's clip (not a scroll container, so sticky still
          works) ends it where the journey ends. */}
      <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] overflow-hidden">
        {GLOBES.map((g) => (
          <img
            key={g}
            data-globe={g}
            src={globes[g].src}
            alt=""
            className="absolute left-1/2 top-1/2 aspect-square w-[min(92vw,92svh)] object-contain mix-blend-lighten will-change-transform"
            style={{ opacity: 0, visibility: 'hidden' }}
          />
        ))}
        {machines.map((m) => (
          <img
            key={m.id}
            data-photo={m.id}
            src={m.machine!.photo.src}
            alt=""
            loading="lazy"
            className={`absolute inset-0 h-full w-full ${m.machine!.photo.fit === 'contain' ? 'object-contain object-[50%_22%] lg:object-[70%_50%] lg:pl-[30%]' : 'object-cover [object-position:var(--focus-narrow)] lg:[object-position:var(--focus)]'}`}
            style={
              {
                opacity: 0,
                visibility: 'hidden',
                '--focus': m.machine!.photo.focus ?? '50% 50%',
                '--focus-narrow': m.machine!.photo.narrowFocus ?? m.machine!.photo.focus ?? '50% 50%',
              } as React.CSSProperties
            }
          />
        ))}
        {/* Dark behind the words: the left side on wide screens, the lower part on phones */}
        <div data-scrim="" className="absolute inset-y-0 left-0 hidden w-[60%] bg-[linear-gradient(to_right,rgb(0_0_0/0.85)_0%,rgb(0_0_0/0.6)_45%,transparent)] lg:block" />
        <div data-scrim="" className="absolute inset-x-0 bottom-0 h-[60%] bg-[linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.75)_35%,rgb(0_0_0/0.92)_100%)] lg:hidden" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <p
          ref={kmRef}
          className="absolute left-5 top-5 font-display text-[clamp(0.95rem,4.8vw,1.125rem)] font-bold leading-tight tabular-nums text-sun md:left-10 md:text-lg lg:top-8 lg:text-2xl"
        >
          On Earth
        </p>
      </div>

      <div className="relative z-10">
        <header className="relative flex h-[100svh] items-start px-5 pt-[16svh] md:px-10 lg:items-center lg:pt-0">
          <div>
            <h1 data-title="" className="text-[clamp(3.6rem,15vw,11rem)] leading-[0.85]">
              Ghost Signals
            </h1>
            <p data-intro="" className="mt-6 max-w-[30ch] text-xl leading-snug text-sun lg:text-2xl">
              NASA left machines on the Moon and Mars. Scroll down to go and find them.
            </p>
          </div>
        </header>

        {stops.slice(1).map((s) => {
          const chapter = s.machine?.slug ? getChapter(s.machine.slug) : undefined
          return (
            <article key={s.id} className="flex min-h-[80svh] items-start px-5 md:px-10 lg:min-h-[100svh] lg:items-center">
              <div data-stop="" className="w-full max-w-[34rem] text-sun lg:w-[min(32rem,38vw)]">
                <div data-words="">
                  {s.figure && (
                    <div data-fade="">
                      <p data-rise="" className="font-display text-[clamp(3rem,14vw,4.6rem)] font-extrabold leading-[0.85] tracking-[-0.035em] tabular-nums md:text-[6rem] lg:text-[clamp(4.5rem,7.5vw,8rem)]">
                        {s.figure.value}
                      </p>
                      <p data-rise="" className="mt-2 text-base text-sun/80 md:text-lg">
                        {s.figure.label}
                      </p>
                    </div>
                  )}
                  {(s.heading || s.machine) && (
                    <h2
                      data-heading=""
                      data-fade=""
                      className={`[&>div]:-mb-[0.12em] [&>div]:pb-[0.12em] ${s.machine ? 'text-[clamp(2.4rem,13vw,4.8rem)] leading-[0.9] md:text-[6rem] lg:text-[clamp(4rem,5.8vw,7rem)]' : 'mt-4 text-[clamp(2rem,8vw,3rem)] leading-[1.02] lg:mt-6 lg:text-[clamp(2.6rem,3.6vw,4rem)]'}`}
                    >
                      {s.machine?.name ?? s.heading}
                    </h2>
                  )}
                  {s.body && (
                    <div data-fade="">
                      <p
                        data-rise=""
                        className={
                          s.heading || s.machine
                            ? 'mt-4 max-w-[30ch] text-lg leading-snug text-sun/90 md:text-2xl'
                            : 'max-w-[22ch] font-display text-[clamp(1.6rem,7vw,2.6rem)] font-bold leading-[1.08]'
                        }
                      >
                        {s.body}
                      </p>
                    </div>
                  )}
                  {/* Short stops (InSight, Sojourner) have no chapter, so no button and no promise of one */}
                  {chapter && (
                    <div data-fade="" className="mt-6">
                      <div data-rise="">
                        <Link
                          to={`/signal/${chapter.slug}`}
                          className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-[#fff1d6] active:scale-[0.97]"
                        >
                          Hear its story
                        </Link>
                      </div>
                    </div>
                  )}
                  {s.machine && <p className="sr-only">Picture: {s.machine.photo.alt}</p>}
                </div>
              </div>
            </article>
          )
        })}
        {/* The last photo sinks into black before the footer, so the trip never ends on a hard edge */}
        <div aria-hidden="true" className="h-[40svh] bg-gradient-to-b from-transparent to-black" />
      </div>
    </section>
  )
}

/** Every picture on the start page, for the credits. */
export function journeyPictures() {
  return [
    ...Object.values(globes).map((g) => ({ what: g.name, credit: g.credit })),
    ...stops.filter((s) => s.machine).map((s) => ({ what: s.machine!.photo.name, credit: s.machine!.photo.credit })),
  ]
}
