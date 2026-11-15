import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import StoryScene from '../components/StoryScene'
import { ChapterGame, Closing, NoSignal, Sources } from '../components/ChapterParts'
import { rememberChapter } from '../components/journey/Journey'
import { getChapter } from '../data/chapters'
import { earnPatch } from '../lib/progress'

export default function Chapter() {
  const { slug } = useParams()
  const chapter = getChapter(slug)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (chapter) {
      document.title = `${chapter.name} · Ghost Signals`
      rememberChapter(chapter.slug)
    }
  }, [chapter])

  // The story counts as finished once the reader reaches its end (past the game, at the sources). Checked on scroll,
  // not with an IntersectionObserver: a fast fling or a jump to the bottom can pass the mark without ever showing it.
  useEffect(() => {
    const el = endRef.current
    if (!chapter || !el) return
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        earnPatch(chapter.slug)
        window.removeEventListener('scroll', check)
      }
    }
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [chapter])

  if (!chapter) return <NoSignal />

  return (
    <main data-world={chapter.world}>
      {/* Keyed, so moving between chapters builds a fresh story (the title's letters are split in place) */}
      <StoryScene key={chapter.slug} chapter={chapter} />
      <ChapterGame chapter={chapter} />
      <Closing chapter={chapter} />
      <div ref={endRef} aria-hidden="true" className="h-px bg-basalt" />
      <Sources chapter={chapter} />
    </main>
  )
}
