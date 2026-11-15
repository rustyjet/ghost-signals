import { useEffect } from 'react'
import Journey, { journeyPictures } from '../components/journey/Journey'
import { journeySources } from '../data/journey'
import { team } from '../data/team'

/** The start page: a trip out from Earth to the machines, then where its numbers and pictures come from. */
export default function Hub() {
  useEffect(() => {
    document.title = 'Ghost Signals'
  }, [])

  return (
    <main className="bg-black">
      <Journey />
      <footer className="border-t border-sun/15 bg-black px-5 pb-16 pt-12 text-sun/80 md:px-10">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="font-display text-2xl text-sun">Where every number comes from</h2>
            <ul className="mt-4 space-y-1">
              {journeySources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center underline decoration-sun/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-sun"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl text-sun">Pictures</h2>
            <ul className="mt-4 space-y-3 text-base">
              {journeyPictures().map((p) => (
                <li key={p.what}>
                  {p.what}: {p.credit}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-5xl">
          <h2 className="font-display text-2xl text-sun">Who made this</h2>
          <p className="mt-4 max-w-[60ch] text-base">
            {team.name} made Ghost Signals for the {team.event}.
          </p>
          <ul className="mt-3 space-y-1 text-base">
            {team.members.map((m) => (
              <li key={m.name}>
                {m.name}
                {m.role && <span className="text-sun/60">, {m.role}</span>}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </main>
  )
}
