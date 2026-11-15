import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { chapters } from '../data/chapters'

/** One left and right edge for everything on the page. */
const wrap = 'mx-auto w-full max-w-[72rem] px-5 md:px-10'
const pill =
  'inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]'
const textLink =
  'inline-flex min-h-11 items-center underline decoration-sun/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-sun'

/** The five games in one list: what each teaches and the real number it is built on. */
export default function Play() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'The five games · Ghost Signals'
  }, [])

  const games = chapters.filter((c) => c.game)

  return (
    <main className="min-h-[100dvh] bg-black text-sun">
      <header className={`${wrap} pb-12 pt-6 lg:pb-20`}>
        <Link to="/" className="inline-flex min-h-11 items-center font-display text-lg font-bold underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-current lg:text-2xl">
          Ghost Signals
        </Link>
        <div className="mt-[12svh]">
          <h1 className="max-w-[12ch] text-balance text-[clamp(3rem,11vw,7.5rem)] leading-[0.88]">Play the five games.</h1>
          <p className="mt-6 max-w-[38ch] text-xl leading-snug md:text-2xl">
            Each one puts you in charge of a NASA machine, with one real problem its team had to solve.
          </p>
        </div>
      </header>

      <ul className={wrap}>
        {games.map((c) => {
          const g = c.game!
          return (
            <li key={c.slug} className="group relative grid gap-6 border-t border-sun/15 py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:py-14">
              <div className="aspect-[4/3] overflow-hidden bg-black">
                <img
                  src={g.photo.src}
                  alt={g.photo.alt}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${g.photo.whole ? 'object-contain' : 'object-cover'} transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none`}
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-[clamp(2.2rem,6vw,3.6rem)] leading-[0.95]">{g.name}</h2>
                <p className="mt-2 text-base text-sun/70 md:text-lg">
                  {c.name}, {c.place}
                </p>
                <p className="mt-4 max-w-[40ch] text-xl leading-snug">{c.learn}</p>
                <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-sun/80">
                  {g.fact}{' '}
                  <a
                    href={g.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative z-10 whitespace-nowrap py-3 underline decoration-sun/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-sun"
                  >
                    NASA source
                  </a>
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  {/* The whole row opens the game; the story and the source sit above that */}
                  <Link to={`/play/${c.slug}`} className={`${pill} after:absolute after:inset-0 after:content-['']`}>
                    Play {g.name}
                  </Link>
                  <Link to={`/signal/${c.slug}`} className={`${textLink} relative z-10 font-display text-lg font-bold`}>
                    Or hear its story first
                  </Link>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <footer className="mt-12 border-t border-sun/15 pb-16 pt-12 text-sun/80">
        <div className={wrap}>
          <h2 className="font-display text-2xl text-sun">Pictures</h2>
          <ul className="mt-4 space-y-3 text-base">
            {games.map((c) => (
              <li key={c.slug}>
                {c.game!.name}: {c.game!.photo.credit}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[60ch] text-base">
            The games&rsquo; own numbers are simpler than the real machines&rsquo;. Each game says so, and each chapter lists where every real number comes from.
          </p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center font-display text-lg font-bold text-sun underline decoration-1 underline-offset-[6px]">
            Back to all the machines
          </Link>
        </div>
      </footer>
    </main>
  )
}
