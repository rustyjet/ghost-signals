import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import StoryScene from '../components/StoryScene'
import { ChapterGame, Closing, NoSignal, Sources } from '../components/ChapterParts'
import { rememberChapter } from '../components/journey/Journey'
import { getChapter } from '../data/chapters'

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

  if (!chapter) return <NoSignal />

  return (
    <main data-world={chapter.world}>
      {/* Keyed, so moving between chapters builds a fresh story (the title's letters are split in place) */}
      <StoryScene key={chapter.slug} chapter={chapter} />
      <ChapterGame chapter={chapter} />
      <Closing chapter={chapter} />
      <Sources chapter={chapter} />
    </main>
  )
}
