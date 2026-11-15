import { useEffect, useId, useRef, useState } from 'react'
import type { StepSound as Sound } from '../../data/types'
import { SoundIcon } from '../SoundIcon'

// A real NASA recording under a step's words, off until pressed. Nothing loads until then (preload="none"),
// one sound plays at a time, and it stops when its step leaves the screen or the tab is hidden. The caption
// (who recorded it, and what NASA changed) shows once pressed; its room is kept from the start, so nothing jumps.
// The story never depends on it: the words already say everything.

/** The one sound playing on the page, so starting another stops it. */
let playing: HTMLAudioElement | null = null

export default function StepSound({ sound }: { sound: Sound }) {
  const audio = useRef<HTMLAudioElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)
  const [heard, setHeard] = useState(false)
  const [failed, setFailed] = useState(false)
  const captionId = useId()

  useEffect(() => {
    const a = audio.current
    const step = root.current?.closest('article') ?? root.current
    if (!a || !step) return
    const stop = () => {
      if (!a.paused) a.pause()
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) stop()
    })
    io.observe(step)
    const onVisibility = () => {
      if (document.hidden) stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      a.pause()
      if (playing === a) playing = null
    }
  }, [])

  function toggle() {
    const a = audio.current
    if (!a) return
    setHeard(true)
    if (!a.paused) {
      a.pause()
      return
    }
    if (playing && playing !== a) playing.pause()
    playing = a
    setFailed(false)
    // A pause before the file arrives rejects with AbortError; that is not a failure.
    a.play().catch((e: unknown) => {
      if ((e as { name?: string })?.name !== 'AbortError') setFailed(true)
    })
  }

  return (
    <div ref={root} className="mt-5 flex flex-col items-center lg:mt-6">
      <audio
        ref={audio}
        src={sound.src}
        preload="none"
        onPlay={() => setOn(true)}
        onPause={() => setOn(false)}
        onEnded={() => setOn(false)}
        onError={() => {
          setOn(false)
          setFailed(true)
        }}
      />
      <button
        type="button"
        aria-pressed={on}
        aria-describedby={captionId}
        onClick={toggle}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black/40 py-2 pl-3.5 pr-4.5 text-balance font-display text-base font-bold leading-tight text-sun ring-1 ring-sun/25 [text-shadow:none] transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] aria-pressed:bg-sun aria-pressed:text-ink [@media(hover:hover)_and_(pointer:fine)]:hover:ring-sun/60"
      >
        <SoundIcon on={on} pulse={on} className="h-5 w-5 shrink-0" />
        {sound.label}
      </button>
      {/* Read to screen readers from the start (it describes the button); shown once pressed */}
      <p
        id={captionId}
        data-heard={heard}
        className="mx-auto mt-3 max-w-[40ch] text-[0.95rem] leading-snug text-sun/80 opacity-0 blur-[3px] transition-[opacity,filter] duration-300 ease-out data-[heard=true]:opacity-100 data-[heard=true]:blur-none motion-reduce:blur-none md:text-base"
      >
        {failed ? 'The sound did not load. Try again in a moment.' : sound.caption}
      </p>
    </div>
  )
}
