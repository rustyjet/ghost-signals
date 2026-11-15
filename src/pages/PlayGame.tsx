import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterGame, Closing, NoSignal, Sources } from '../components/ChapterParts'
import { getChapter } from '../data/chapters'

/** One game on its own, straight from the start page or the list of games, then what it teaches and the story's way in. */
export default function PlayGame() {
  const { slug } = useParams()
  const chapter = getChapter(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (chapter?.game) document.title = `${chapter.game.name} · Ghost Signals`
  }, [chapter])

  if (!chapter?.game) return <NoSignal />

  return (
    <main data-world={chapter.world}>
      <h1 className="sr-only">
        {chapter.game.name}, a game about {chapter.name}
      </h1>
      <ChapterGame chapter={chapter} />
      <Closing chapter={chapter}>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to={`/signal/${chapter.slug}`}
            className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-display text-lg font-extrabold text-ink transition-transform duration-150 ease-out hover:bg-sun-bright active:scale-[0.97]"
          >
            Hear {chapter.name}&rsquo;s story
          </Link>
          <Link to="/play" className="inline-flex min-h-11 items-center font-display text-lg font-bold text-sun underline decoration-1 underline-offset-[6px]">
            All five games
          </Link>
        </div>
      </Closing>
      <Sources chapter={chapter} />
    </main>
  )
}
