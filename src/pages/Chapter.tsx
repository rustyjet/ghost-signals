import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ModelViewer from '../components/ModelViewer'
import QuickFacts from '../components/QuickFacts'
import StoryBeats from '../components/StoryBeats'
import DustStorm from '../components/interactions/DustStorm'
import { getChapter } from '../data/chapters'
import type { InteractionId, World } from '../data/types'
import { earnPatch, getPatches } from '../lib/progress'

const worldLabel: Record<World, string> = { moon: 'The Moon', mars: 'Mars', deep: 'Deep space' }
const worldColor: Record<World, string> = {
  moon: 'var(--color-moon)',
  mars: 'var(--color-mars)',
  deep: 'var(--color-deep)',
}

const interactions: Partial<Record<InteractionId, () => React.JSX.Element>> = {
  'dust-storm': DustStorm,
}

export default function Chapter() {
  const { slug } = useParams()
  const chapter = getChapter(slug)
  const [selected, setSelected] = useState<string | null>(null)
  const [filed, setFiled] = useState(() => (slug ? getPatches().includes(slug) : false))

  useEffect(() => {
    window.scrollTo(0, 0)
    if (chapter) document.title = `${chapter.name} · Ghost Signals`
  }, [chapter])

  if (!chapter) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl">No signal on this frequency.</h1>
        <Link to="/" className="kit-button mt-6">
          Back to the tuner
        </Link>
      </main>
    )
  }

  const hotspot = chapter.hotspots.find((h) => h.id === selected)
  const Interaction = chapter.interaction ? interactions[chapter.interaction] : undefined
  const accent = worldColor[chapter.world]

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20" style={{ '--accent': accent } as React.CSSProperties}>
      <nav className="flex items-center justify-between py-5">
        <Link to="/" className="stamp underline decoration-2 underline-offset-4 hover:text-red-text">
          ← Back to the tuner
        </Link>
        <p className="stamp" style={{ color: accent }}>
          {worldLabel[chapter.world]}
        </p>
      </nav>

      <header className="border-b-4 border-ink pb-6">
        <p className="stamp text-ink-soft">{chapter.callSign}</p>
        <h1 className="mt-2 text-[clamp(2.6rem,13vw,6rem)] break-words" style={{ color: accent }}>
          {chapter.name}
        </h1>
        <p className="stamp mt-4 inline-block -rotate-1 border-2 border-red-text px-2 py-1 text-red-text">
          {chapter.status}
        </p>
      </header>

      {/* 1. The machine */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]" aria-labelledby="machine-h">
        <ModelViewer chapter={chapter} selected={selected} onSelect={setSelected} />
        <div>
          <h2 id="machine-h" className="text-3xl">
            Meet the machine
          </h2>
          <p className="mt-2 text-ink-soft">Tap a numbered pin to hear what each part did.</p>
          <ol className="mt-4 space-y-2">
            {chapter.hotspots.map((h, i) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setSelected(h.id)}
                  aria-pressed={selected === h.id}
                  className={`flex w-full items-center gap-3 border-2 border-ink p-2 text-left font-display font-bold ${
                    selected === h.id ? 'bg-ink text-paper' : 'bg-card hover:bg-paper-deep'
                  }`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-current font-mono text-sm">
                    {i + 1}
                  </span>
                  {h.name}
                </button>
              </li>
            ))}
          </ol>
          <div className="kit-card mt-4 min-h-32 p-4" aria-live="polite">
            {hotspot ? (
              <>
                <p className="stamp text-red-text">{hotspot.name}</p>
                <p className="mt-2">{hotspot.text}</p>
              </>
            ) : (
              <p className="text-ink-soft">Nothing selected yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* 2. Story */}
      <section className="mt-16" aria-labelledby="story-h">
        <h2 id="story-h" className="text-4xl">
          Transmission log
        </h2>
        <p className="mt-2 max-w-prose text-ink-soft">
          An imagined voice, built only from real mission facts. Every fact is listed in the sources
          at the bottom.
        </p>
        <div className="mt-6">
          <StoryBeats beats={chapter.beats} speaker={chapter.name} />
        </div>
      </section>

      {/* 3. Try it */}
      {Interaction && (
        <section className="mt-16" aria-labelledby="try-h">
          <h2 id="try-h" className="text-4xl">
            Your turn
          </h2>
          <div className="mt-6">
            <Interaction />
          </div>
        </section>
      )}

      {/* 4. What we learned + still matters */}
      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="border-l-8 pl-5" style={{ borderColor: accent }}>
          <h2 className="text-3xl">What we learned</h2>
          <p className="mt-3">{chapter.learned}</p>
        </div>
        <div className="border-l-8 border-ink pl-5">
          <h2 className="text-3xl">Why it still matters</h2>
          <p className="mt-3">{chapter.stillMatters}</p>
        </div>
      </section>

      {/* 5. Facts + sources */}
      <section className="mt-16" aria-labelledby="facts-h">
        <h2 id="facts-h" className="text-3xl">
          Spec sheet
        </h2>
        <div className="mt-5">
          <QuickFacts facts={chapter.quickFacts} sources={chapter.sources} />
        </div>
      </section>

      <section className="mt-16 flex flex-col items-start gap-4 border-t-4 border-ink pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl">{filed ? 'Signal filed.' : 'File this signal'}</h2>
          <p className="mt-1 text-ink-soft">
            {filed
              ? `${chapter.name}'s patch is on your kit lid.`
              : `Add ${chapter.name}'s mission patch to your kit.`}
          </p>
        </div>
        {filed ? (
          <Link to="/" className="kit-button">
            Find the next signal
          </Link>
        ) : (
          <button
            type="button"
            className="kit-button"
            onClick={() => {
              earnPatch(chapter.slug)
              setFiled(true)
            }}
          >
            Stamp the patch
          </button>
        )}
      </section>
    </main>
  )
}
