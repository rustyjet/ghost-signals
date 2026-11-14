import { Link } from 'react-router-dom'

// Temporary start page. The "scroll away from Earth" journey replaces it after the Opportunity checkpoint.
export default function Hub() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5">
      <div className="max-w-3xl">
        <h1 className="text-[clamp(3.5rem,12vw,10rem)] leading-[0.85]">Ghost Signals</h1>
        <p className="mt-6 max-w-[38ch] text-xl opacity-85">
          Some of NASA&rsquo;s machines never came home. They are still out there, on the Moon, on
          Mars and far beyond.
        </p>
        <Link
          to="/signal/opportunity"
          className="mt-10 inline-block rounded-full bg-sun px-7 py-3 font-display text-lg font-bold text-ink hover:bg-mars-horizon"
        >
          Find Opportunity on Mars
        </Link>
      </div>
    </main>
  )
}
