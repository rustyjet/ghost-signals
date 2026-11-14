import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import StoryScene from '../components/StoryScene'
import { getChapter } from '../data/chapters'

export default function Chapter() {
  const { slug } = useParams()
  const chapter = getChapter(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
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
      <StoryScene chapter={chapter} />

      {/* Checkpoint: the game and closing sections are rebuilt next */}
      <section className="grid min-h-[70dvh] place-items-center bg-basalt px-5 text-center">
        <div>
          <h2 className="text-5xl sm:text-7xl">Next: survive the storm.</h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-lg opacity-80">
            The dust-storm game is being rebuilt as a full scene.
          </p>
          <Link to="/" className="mt-8 inline-flex min-h-11 items-center text-lg underline decoration-1 underline-offset-[6px]">
            Back to all the machines
          </Link>
        </div>
      </section>
    </main>
  )
}
