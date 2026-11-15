import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getChapter } from '../../data/chapters'
import { finishedEveryStory } from '../../lib/progress'
import { globes, stops, type Globe, type Pose } from '../../data/journey'
import { gsap, isNarrow, prefersReducedMotion, ScrollTrigger, SplitText, splitTitle, TITLE_RISE, useGSAP } from '../../scroll/smoothScroll'

const GLOBES: Globe[] = ['earth', 'moon', 'mars']
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Hold still while a stop is read, then travel on to the next one. */
const hold = (t: number) => {
  const u = clamp01((t - 0.15) / 0.7)
  return u * u * (3 - 2 * u)
}
/** Where a stop's words are read. A machine's photo is mostly machine, so its words are read low on every
    screen and the machine stands above them; other stops are read in the middle on wide screens. */
const focusLine = (low = false) => (low || isNarrow() ? 0.74 : 0.5)

/** The chapter last opened, so coming back to the start page (by link or the browser's Back) lands on that
    machine's stop instead of wherever the chapter's scroll left the page. Kept in the tab's session storage, not
    in this module, which a hot reload would reset; used once, so a fresh load starts at Earth. */
const RETURN_KEY = 'ghost-signals:return-to'
export const rememberChapter = (slug: string) => {
  try {
    sessionStorage.setItem(RETURN_KEY, slug)
  } catch {
    /* storage blocked: the start page just opens at Earth */
  }
}
function takeReturn() {
  try {
    const slug = sessionStorage.getItem(RETURN_KEY)
    // Cleared after this render, not now: React's StrictMode runs the setup twice and both need to see it.
    if (slug) setTimeout(() => sessionStorage.removeItem(RETURN_KEY), 0)
    return slug
  } catch {
    return null
  }
}

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
  const [finishedAll] = useState(finishedEveryStory)
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
      const ovalEl = root.querySelector<HTMLElement>('[data-oval]')
      const lowEl = root.querySelector<HTMLElement>('[data-lowshade]')
      const phoneEl = root.querySelector<HTMLElement>('[data-phoneshade]')

      let centres: number[] = []
      let wordsGone: number[] = []
      const measure = () => {
        const y = window.scrollY
        const vh = window.innerHeight
        centres = [
          root.getBoundingClientRect().top + y,
          ...blocks.map((b) => {
            const r = (b.querySelector('[data-words]') ?? b).getBoundingClientRect()
            return r.top + y + r.height / 2 - focusLine(b.hasAttribute('data-low')) * vh
          }),
        ]
        // Phones: where a machine's last words have faded (their top at 36%, as fadeAll), so the photo is held
        // to there and the trip moves on only after. Opacity never moves layout, so this is safe to measure faded.
        wordsGone = centres.map((_, i) => {
          const last = [...(blocks[i - 1]?.querySelectorAll<HTMLElement>('[data-low] [data-fade]') ?? [])].pop()
          // ...plus a tenth of a screen with the whole machine and nothing on it
          return last ? last.getBoundingClientRect().top + y - 0.36 * vh + 0.1 * vh : -1
        })
      }

      let lastKm = ''
      const apply = () => {
        if (centres.length < 2) return
        const y = window.scrollY
        let i = 0
        while (i < centres.length - 2 && y >= centres[i + 1]) i++
        const span = centres[i + 1] - centres[i]
        const raw = span > 0 ? clamp01((y - centres[i]) / span) : y >= centres[i + 1] ? 1 : 0
        // Phones leaving a machine: hold its photo until the words are gone, then travel in what is left.
        const gone = isNarrow() && span > 0 && wordsGone[i] > 0 ? clamp01((wordsGone[i] - centres[i]) / span) : 0
        const t = reduced ? Math.round(raw) : gone > 0.15 ? hold(0.15 + ((raw - gone) / (1 - gone)) * 0.85) : hold(raw)
        const a = stops[i]
        const b = stops[Math.min(i + 1, stops.length - 1)]
        const set = isNarrow() ? poses.narrow : poses.wide
        const vw = window.innerWidth
        const vh = window.innerHeight

        // Leaving a machine stop: its words fade before the middle (fadeAll below), and the dark under them lifts
        // with them, so the words step aside for the whole photo. Follows the fade's own scrubbed opacity.
        // Past the last stop there is no next one: the stop being left is b itself.
        const last = y >= centres[centres.length - 1]
        const leaving = last ? b : a
        let lift = 0
        const fades = leaving.machine ? blocks[(last ? i + 1 : i) - 1]?.querySelectorAll<HTMLElement>('[data-fade]') : undefined
        if (fades?.length) {
          let shown = 0
          fades.forEach((f) => (shown += f.style.opacity === '' ? 1 : Number(f.style.opacity)))
          // Comes back only for a next machine's words; on the way to space the photo just goes.
          lift = (1 - shown / fades.length) * (!last && b.machine ? 1 - t : 1)
        }

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

        let photo = 0
        machines.forEach((m, k) => {
          const o = lerp(a.id === m.id ? 1 : 0, b.id === m.id ? 1 : 0, t)
          photo = Math.max(photo, o)
          photoEls[k].style.opacity = String(o)
          photoEls[k].style.visibility = o < 0.01 ? 'hidden' : 'visible'
        })
        // Wide screens: the dark sits behind the words, in the middle over space and along the bottom over a photo.
        if (ovalEl) ovalEl.style.opacity = String(1 - photo)
        if (lowEl) lowEl.style.opacity = String(photo * (1 - lift))
        // Phones keep their dark low on every stop; it lifts off a machine's photo and is back for the next words.
        if (phoneEl) phoneEl.style.opacity = String(1 - lift * photo)

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
      // Back from a chapter: start at that machine's stop, at its reading line
      const returnTo = takeReturn()
      const back = returnTo ? stops.findIndex((s) => s.machine?.slug === returnTo) : -1
      if (back > 0) window.scrollTo(0, Math.max(0, centres[back] ?? 0))
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
            const title = splitTitle(titleEl)
            gsap.from(title.chars, { yPercent: TITLE_RISE, duration: 0.8, ease: 'expo.out', stagger: 0.03, delay: 0.1 })
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
          const low = () => block.hasAttribute('data-low') || isNarrow()
          // Phones fade the words out from the middle (50%), so they must be in by 82%, and follow the finger with no
          // smoothing: with the old 66% and half a second of lag, a normal swipe carried them into the fade before
          // they had come in, and they only ever showed on the way back up.
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: block,
              start: () => (isNarrow() ? 'top 100%' : low() ? 'top 98%' : 'top 92%'),
              end: () => (isNarrow() ? 'top 82%' : low() ? 'top 66%' : 'top 46%'),
              scrub: isNarrow() ? true : 0.5,
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
      // Machine stops (read low) fade before the middle on every screen, so the machine above is never covered.
      const fadeAll = (selector: string, start: string, end: string, onUpdate?: () => void) =>
        gsap.utils.toArray<HTMLElement>(selector, root).forEach((el) =>
          gsap.to(el, { opacity: 0, ease: 'none', onUpdate, scrollTrigger: { trigger: el, start, end, scrub: true } }),
        )
      mm.add('(min-width: 1024px)', () => {
        fadeAll('[data-stop]:not([data-low]) [data-fade]', 'top 24%', 'top 8%')
        // The dark under a machine's words follows their fade (apply reads it), so re-apply once it has moved.
        fadeAll('[data-stop][data-low] [data-fade]', 'top 50%', 'top 36%', apply)
      })
      mm.add('(max-width: 1023px)', () => {
        fadeAll('[data-stop]:not([data-low]) [data-fade]', 'top 50%', 'top 36%')
        fadeAll('[data-stop][data-low] [data-fade]', 'top 50%', 'top 36%', apply)
      })

      if (import.meta.env.DEV) {
        ;(window as unknown as { __step?: (i: number) => void }).__step = (i: number) =>
          window.scrollTo(0, Math.max(0, centres[Math.min(i, centres.length - 1)] ?? 0))
      }
      // Keyboard: the browser scrolls just enough to show a focused button, which can leave its heading already
      // faded. Bring the whole stop to its reading line instead (after the browser's own scroll, so ours wins).
      const onFocus = (e: FocusEvent) => {
        const el = e.target as HTMLElement
        if (!el.matches(':focus-visible')) return
        const i = blocks.findIndex((b) => b.contains(el))
        if (i >= 0) requestAnimationFrame(() => window.scrollTo(0, centres[i + 1]))
      }
      root.addEventListener('focusin', onFocus)
      return () => {
        mm.revert()
        root.removeEventListener('focusin', onFocus)
      }
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
            className="absolute left-1/2 top-1/2 aspect-square w-[min(92vw,92svh)] object-contain will-change-transform"
            style={{ opacity: 0, visibility: 'hidden', clipPath: globes[g].disc }}
          />
        ))}
        {machines.map((m) => {
          const p = m.machine!.photo
          // A photo shown whole is sized to its own shape, its edges feathered and blended with lighten, so it
          // melts out of the photo before it (its black mosaic corners vanish) instead of cutting a hard frame
          // across it. Over plain black it looks the same. High on phones, like the other machines; centred wide.
          const whole =
            'left-1/2 top-[22%] w-[var(--whole-w)] -translate-x-1/2 -translate-y-[22%] [aspect-ratio:var(--ratio)] mix-blend-lighten [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_9%,#000_91%,transparent),linear-gradient(to_bottom,transparent,#000_9%,#000_91%,transparent)]'
          const fit =
            p.fit === 'contain'
              ? `${whole} lg:top-1/2 lg:-translate-y-1/2`
              : p.narrowFit === 'contain'
                ? // Whole on a tall phone screen, where filling it would cut the machine's sides off; full screen wide.
                  `${whole} lg:inset-0 lg:h-full lg:w-full lg:translate-x-0 lg:translate-y-0 lg:[aspect-ratio:auto] lg:mix-blend-normal lg:[mask-image:none] lg:[object-position:var(--focus)]`
                : 'inset-0 h-full w-full [object-position:var(--focus-narrow)] lg:[object-position:var(--focus)]'
          return (
            <img
              key={m.id}
              data-photo={m.id}
              src={p.src}
              alt=""
              loading="lazy"
              className={`absolute object-cover ${fit}`}
              style={
                {
                  opacity: 0,
                  visibility: 'hidden',
                  '--whole-w': `min(100%, calc(100svh * ${p.w / p.h}))`,
                  '--ratio': `${p.w} / ${p.h}`,
                  '--focus': p.focus ?? '50% 50%',
                  '--focus-narrow': p.narrowFocus ?? p.focus ?? '50% 50%',
                } as React.CSSProperties
              }
            />
          )
        })}
        {/* Dark behind the words. Wide screens: the middle over space, the bottom over a machine's photo
            (swapped as the photo comes in). Phones: always the lower part. */}
        <div data-scrim="" className="absolute inset-0 hidden lg:block">
          <div data-oval="" className="absolute inset-0 bg-[radial-gradient(ellipse_44%_90%_at_50%_50%,rgb(0_0_0/0.82)_0%,rgb(0_0_0/0.7)_45%,rgb(0_0_0/0.3)_75%,transparent_100%)]" />
          <div data-lowshade="" className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.7)_40%,rgb(0_0_0/0.88)_100%)]" style={{ opacity: 0 }} />
        </div>
        {/* Outer: the title's scroll brings it in. Inner: lifts when a machine's words have gone. */}
        <div data-scrim="" className="absolute inset-x-0 bottom-0 h-[60%] lg:hidden">
          <div data-phoneshade="" className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.75)_35%,rgb(0_0_0/0.92)_100%)]" />
        </div>
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
        <p
          ref={kmRef}
          className="absolute left-5 top-5 font-display text-[clamp(0.95rem,4.8vw,1.125rem)] font-bold leading-tight tabular-nums text-sun md:left-10 md:text-lg lg:top-8 lg:text-2xl"
        >
          On Earth
        </p>
      </div>

      <div className="relative z-10">
        <header className="relative flex h-stage-100 items-start justify-center px-5 pt-[16svh] text-center md:px-10 lg:items-center lg:pt-0">
          <div>
            <h1 data-title="" className="text-[clamp(3.6rem,15vw,11rem)] leading-[0.85]">
              Ghost Signals
            </h1>
            <div data-intro="">
              <p className="mx-auto mt-6 max-w-[30ch] text-xl leading-snug text-sun lg:text-2xl">
                NASA left machines on the Moon and Mars. Scroll down to go and find them.
              </p>
              {/* Only once every story has been read to its end: a quick way back to the games, to play them again */}
              {finishedAll && (
                <Link
                  to="/play"
                  className="mt-6 inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]"
                >
                  Play all five games
                </Link>
              )}
            </div>
          </div>
        </header>

        {stops.slice(1).map((s, k, rest) => {
          const chapter = s.machine?.slug ? getChapter(s.machine.slug) : undefined
          // Phones: a machine stop is longer, as its photo is held until its words have gone (see `gone`). The last
          // has no next stop to hold for: at full length its photo stood still for a screen before the trip ended.
          const held = s.machine && k < rest.length - 1
          return (
            <article key={s.id} className={`flex items-start justify-center px-5 md:px-10 lg:min-h-stage-100 lg:items-center ${held ? 'min-h-stage-110' : 'min-h-stage-80'}`}>
              <div data-stop="" data-low={s.machine ? '' : undefined} className="w-full max-w-[34rem] text-center text-sun lg:w-[min(36rem,42vw)]">
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
                      className={`text-balance [&>div]:-mb-[0.12em] [&>div]:pb-[0.12em] ${s.machine ? 'text-[clamp(2.4rem,13vw,4.8rem)] leading-[0.9] md:text-[6rem] lg:text-[clamp(4rem,5.8vw,7rem)]' : 'mt-4 text-[clamp(2rem,8vw,3rem)] leading-[1.02] lg:mt-6 lg:text-[clamp(2.6rem,3.6vw,4rem)]'}`}
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
                            ? 'mx-auto mt-4 max-w-[30ch] text-lg leading-snug text-sun/90 md:text-2xl'
                            : 'mx-auto max-w-[22ch] text-balance font-display text-[clamp(1.6rem,7vw,2.6rem)] font-bold leading-[1.08]'
                        }
                      >
                        {s.body}
                      </p>
                    </div>
                  )}
                  {/* A stop without a chapter gets no button and no promise of one */}
                  {chapter && (
                    <div data-fade="" className="mt-6">
                      <div data-rise="">
                        <Link
                          to={`/signal/${chapter.slug}`}
                          className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]"
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
        <div aria-hidden="true" className="h-stage-40 bg-gradient-to-b from-transparent to-black" />
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
