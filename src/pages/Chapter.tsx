import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoryScene from '../components/StoryScene'
import { getChapter } from '../data/chapters'
import { scrollToTop } from '../scroll/smoothScroll'

export default function Chapter() {
  const { slug } = useParams()
  const chapter = getChapter(slug)

  useEffect(() => {
    scrollToTop()
    if (chapter) document.title = `${chapter.name} · Ghost Signals`
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
    <main>
      <Link
        to="/"
        className="fixed right-4 top-4 z-20 rounded-full bg-basalt/80 px-4 py-2.5 text-sm text-sun hover:bg-basalt sm:right-10 sm:top-7"
      >
        All signals
      </Link>

      <StoryScene chapter={chapter} />

      {/* Checkpoint: the game and closing sections are rebuilt next */}
      <section className="grid min-h-[70dvh] place-items-center bg-basalt px-5 text-center">
        <div>
          <h2 className="text-5xl sm:text-7xl">Next: survive the storm.</h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-lg opacity-80">
            The dust-storm game is being rebuilt as a full scene.
          </p>
        </div>
      </section>
    </main>
  )
}
