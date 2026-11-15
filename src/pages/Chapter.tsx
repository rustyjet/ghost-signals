import { Suspense, lazy, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoryScene from '../components/StoryScene'

// The driving game brings three.js; it loads in its own file, after the story.
const RoverGame = lazy(() => import('../components/game/rover/RoverGame'))
import RotorLift from '../components/game/RotorLift'
import LaserRanging from '../components/game/LaserRanging'
import { sceneImages } from '../components/story/Backdrop'
import { rememberChapter } from '../components/journey/Journey'
import { getChapter } from '../data/chapters'
import type { Chapter as ChapterData } from '../data/types'

export default function Chapter() {
  const { slug } = useParams()
  const chapter = getChapter(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (chapter) {
      document.title = `${chapter.name} · Ghost Signals`
      rememberChapter(chapter.slug)
    }
  }, [chapter])

  if (!chapter) {
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

  return (
    <main data-world={chapter.world}>
      {/* Keyed, so moving between chapters builds a fresh story (the title's letters are split in place) */}
      <StoryScene key={chapter.slug} chapter={chapter} />

      {chapter.interaction === 'dust-storm' && (
        <Suspense fallback={<section aria-hidden="true" className="h-[100svh] min-h-[560px] bg-basalt" />}>
          <RoverGame />
        </Suspense>
      )}
      {chapter.interaction === 'rotor-lift' && <RotorLift />}
      {chapter.interaction === 'laser-ranging' && <LaserRanging />}

      {chapter.closing && <Closing chapter={chapter} />}
      <Sources chapter={chapter} />
    </main>
  )
}

function Closing({ chapter }: { chapter: ChapterData }) {
  const c = chapter.closing!
  return (
    <section className="bg-basalt px-5 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-[14ch] text-[clamp(2.6rem,9vw,6rem)]">{c.heading}</h2>
        <p className="mt-6 max-w-[42ch] text-xl leading-relaxed text-sun/90 md:text-2xl">{c.body}</p>
      </div>
    </section>
  )
}

/** Pictures a game uses that no story step does. */
const gamePictures: Partial<Record<NonNullable<ChapterData['interaction']>, { what: string; credit: string }[]>> = {
  'laser-ranging': [
    { what: 'The Moon in the laser game, with the Apollo landing sites', credit: "NASA's Scientific Visualization Studio, from LRO (SVS 4731)" },
  ],
}

/** Every page and picture the chapter used. Picture credits live here, not under the pictures. */
function Sources({ chapter }: { chapter: ChapterData }) {
  const pictures = [
    { what: `3D model of ${chapter.name}`, credit: chapter.model.credit },
    ...sceneImages([chapter.title.scene, ...chapter.steps.map((s) => s.scene)]).map((i) => ({ what: i.name, credit: i.credit })),
    ...((chapter.interaction && gamePictures[chapter.interaction]) || []),
  ]
  return (
    <footer className="border-t border-sun/15 bg-basalt px-5 pb-16 pt-12 text-sun/80 md:px-10">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-2xl text-sun">Where every number comes from</h2>
          <ul className="mt-4 space-y-1">
            {chapter.sources.map((s) => (
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
            {pictures.map((p) => (
              <li key={p.what + p.credit}>
                {p.what}: {p.credit}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-base">{chapter.name}&rsquo;s voice is imagined. What it says happened.</p>
          <Link to="/" className="mt-6 inline-flex min-h-11 items-center font-display text-lg font-bold text-sun underline decoration-1 underline-offset-[6px]">
            Back to all the machines
          </Link>
        </div>
      </div>
    </footer>
  )
}
