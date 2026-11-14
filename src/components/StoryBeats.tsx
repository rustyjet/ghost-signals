import { useEffect, useState } from 'react'
import type { StoryBeat } from '../data/types'

interface Props {
  beats: StoryBeat[]
  speaker: string
}

const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

/** First-person log entries, styled as typed transmission slips, with an optional read-aloud. */
export default function StoryBeats({ beats, speaker }: Props) {
  const [speaking, setSpeaking] = useState<number | null>(null)

  useEffect(() => () => {
    if (canSpeak) window.speechSynthesis.cancel()
  }, [])

  function speak(i: number) {
    if (!canSpeak) return
    window.speechSynthesis.cancel()
    if (speaking === i) {
      setSpeaking(null)
      return
    }
    const u = new SpeechSynthesisUtterance(`${beats[i].heading}. ${beats[i].text}`)
    u.rate = 0.95
    u.onend = () => setSpeaking((s) => (s === i ? null : s))
    setSpeaking(i)
    window.speechSynthesis.speak(u)
  }

  return (
    <ol className="space-y-6">
      {beats.map((b, i) => (
        <li
          key={b.heading}
          className={`kit-card relative p-5 sm:p-6 ${i % 2 ? 'sm:ml-10 sm:rotate-[0.4deg]' : 'sm:mr-10 sm:-rotate-[0.4deg]'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="stamp text-red-text">
              Log {String(i + 1).padStart(2, '0')} · {speaker}
            </p>
            {canSpeak && (
              <button
                type="button"
                onClick={() => speak(i)}
                aria-pressed={speaking === i}
                className="stamp border-2 border-ink px-2 py-1 hover:bg-mustard"
              >
                {speaking === i ? '■ Stop' : '▶ Read aloud'}
              </button>
            )}
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl">{b.heading}</h3>
          <p className="mt-3 max-w-prose">{b.text}</p>
          {b.image && (
            <figure className="mt-4">
              <img src={b.image.src} alt={b.image.alt} className="w-full border-2 border-ink" loading="lazy" />
              <figcaption className="stamp mt-1 text-ink-soft">Image: {b.image.credit}</figcaption>
            </figure>
          )}
        </li>
      ))}
    </ol>
  )
}
