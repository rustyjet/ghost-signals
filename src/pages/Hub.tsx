import { Link } from 'react-router-dom'

// Placeholder hub: proves the fonts, colours and card style. The radio tuner replaces it in hours 8-10.
export default function Hub() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <p className="stamp text-red-text">Listening station · Kit no. 26</p>
      <h1 className="mt-3 text-5xl sm:text-7xl">
        Ghost
        <br />
        Signals
      </h1>
      <p className="mt-6 max-w-xl text-lg">
        Some of NASA&rsquo;s machines never came home. They are still out there, on the Moon, on
        Mars and far past the planets. Turn the dial and find them.
      </p>

      <section className="kit-card mt-10 p-5" aria-label="Build status">
        <p className="stamp text-ink-soft">Status</p>
        <p className="mt-1">The tuner is being wired up. First signal: Opportunity.</p>
        <Link to="/signal/opportunity" className="kit-button mt-4">
          Tune in to Opportunity
        </Link>
      </section>
    </main>
  )
}
