import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import RotorLift from './game/RotorLift'
import LaserRanging from './game/LaserRanging'
import Seismometer from './game/Seismometer'
import DrivePlan from './game/DrivePlan'
import { sceneImages } from './story/Backdrop'
import type { Chapter } from '../data/types'

// The driving game brings three.js; it loads in its own file.
const RoverGame = lazy(() => import('./game/rover/RoverGame'))

/** The chapter's game, as the chapter page and the game's own page both show it. */
export function ChapterGame({ chapter }: { chapter: Chapter }) {
  switch (chapter.interaction) {
    case 'dust-storm':
      return (
        <Suspense fallback={<section aria-hidden="true" className="h-[100svh] min-h-[560px] bg-basalt" />}>
          <RoverGame />
        </Suspense>
      )
    case 'rotor-lift':
      return <RotorLift />
    case 'laser-ranging':
      return <LaserRanging />
    case 'seismometer':
      return <Seismometer />
    case 'drive-plan':
      return <DrivePlan />
    default:
      return null
  }
}

/** A slug that matches no machine. */
export function NoSignal() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 text-center">
      <div>
        <h1 className="text-5xl">No signal here.</h1>
        <Link to="/" className="mt-6 inline-block text-lg underline underline-offset-4">
          Go back to the start
        </Link>
      </div>
    </main>
  )
}

/** What the machine leaves behind: the one idea to take away, after the story and the game. */
export function Closing({ chapter, children }: { chapter: Chapter; children?: React.ReactNode }) {
  const c = chapter.closing
  if (!c) return null
  return (
    <section className="bg-basalt px-5 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-[14ch] text-[clamp(2.6rem,9vw,6rem)]">{c.heading}</h2>
        <p className="mt-6 max-w-[42ch] text-xl leading-relaxed text-sun/90 md:text-2xl">{c.body}</p>
        {children}
      </div>
    </section>
  )
}

/** Pictures a game uses that no story step does. */
const gamePictures: Partial<Record<NonNullable<Chapter['interaction']>, { what: string; credit: string }[]>> = {
  seismometer: [{ what: 'My seismometer, just set down on Mars, 19 December 2018', credit: 'NASA/JPL-Caltech (PIA22956)' }],
  'drive-plan': [
    { what: 'Me, Barnacle Bill and Yogi from the lander, day 3', credit: 'NASA/JPL (PIA00660)' },
    { what: 'Me at Yogi with my tracks, days 8 to 10', credit: 'NASA/JPL (PIA00751)' },
  ],
  'laser-ranging': [
    { what: 'The Moon in the laser game, with the Apollo landing sites', credit: "NASA's Scientific Visualization Studio, from LRO (SVS 4731)" },
  ],
}

const linkClass =
  'inline-flex min-h-11 items-center underline decoration-sun/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-sun'

/** Every page and picture the chapter used. Picture credits live here, not under the pictures. */
export function Sources({ chapter }: { chapter: Chapter }) {
  const pictures = [
    ...(chapter.model ? [{ what: `3D model of ${chapter.name}`, credit: chapter.model.credit }] : []),
    ...sceneImages([chapter.title.scene, ...chapter.steps.map((s) => s.scene)]).map((i) => ({ what: i.name, credit: i.credit })),
    ...((chapter.interaction && gamePictures[chapter.interaction]) || []),
  ]
  const sounds = chapter.steps.flatMap((s) => (s.sound ? [s.sound] : []))
  return (
    <footer className="border-t border-sun/15 bg-basalt px-5 pb-16 pt-12 text-sun/80 md:px-10">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl leading-[1.05]! text-sun">Where every number comes from</h2>
          <ul className="mt-4 space-y-1">
            {chapter.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className={linkClass}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl text-sun">Pictures</h2>
          <ul className="mt-4 space-y-3 text-base">
            {pictures.map((p) => (
              <li key={p.what + p.credit}>
                {p.what}: {p.credit}
              </li>
            ))}
          </ul>
          {sounds.length > 0 && (
            <>
              <h2 className="mt-10 font-display text-2xl text-sun">Sounds</h2>
              {/* Credits like NASA/JPL-Caltech/ASU/MSSS/LANL/… have no spaces; let them wrap at 320 px */}
              <ul className="mt-4 space-y-3 text-base [overflow-wrap:anywhere]">
                {sounds.map((s) => (
                  <li key={s.src}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-sun/30 underline-offset-4 transition-[text-decoration-color] duration-200 hover:decoration-sun"
                    >
                      {s.name}
                    </a>
                    : {s.credit}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-6 text-base">{chapter.name}&rsquo;s voice is imagined. What it says happened.</p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center font-display text-lg font-bold text-sun underline decoration-1 underline-offset-[6px]">
            Back to all the machines
          </Link>
        </div>
      </div>
    </footer>
  )
}
