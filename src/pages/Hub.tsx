import { useEffect } from 'react'
import Journey, { journeyPictures } from '../components/journey/Journey'

/** The start page: a trip out from Earth to the machines, then the credits. */
export default function Hub() {
  useEffect(() => {
    document.title = 'Ghost Signals'
  }, [])

  return (
    <main className="bg-black">
      <Journey />
      <footer className="border-t border-sun/15 bg-black px-5 pb-16 pt-12 text-sun/80 md:px-10">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-2xl text-sun">Pictures</h2>
          <ul className="mt-4 grid gap-x-10 gap-y-2 text-base md:grid-cols-2">
            {journeyPictures().map((p) => (
              <li key={p.what}>
                {p.what}: {p.credit}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </main>
  )
}
