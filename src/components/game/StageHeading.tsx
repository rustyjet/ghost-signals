import { useRef, type Ref } from 'react'
import { gsap, prefersReducedMotion, useGSAP } from '../../scroll/smoothScroll'

/**
 * A game's heading that says which stage you are on ("Your turn.", "One more to find."). It rises into view as
 * the game arrives, scrubbed to the scroll like the story's headings (and back on the way up). When the stage
 * changes, the new words rise in one by one out of their masks; reduced motion: it just changes.
 * `reserve` lists the other stages: they sit invisibly in the same place, so the heading is always as tall as the
 * tallest of them and nothing below it moves when the stage changes.
 */
export function StageHeading({
  text,
  reserve = [],
  className = '',
  ref,
}: {
  text: string
  reserve?: string[]
  className?: string
  ref?: Ref<HTMLHeadingElement>
}) {
  const riseRef = useRef<HTMLSpanElement>(null)
  useGSAP(() => {
    if (prefersReducedMotion() || !riseRef.current) return
    gsap.from(riseRef.current, {
      yPercent: 110,
      ease: 'none',
      scrollTrigger: { trigger: riseRef.current, start: 'top 100%', end: 'top 70%', scrub: 0.5 },
    })
  })
  const words = text.split(' ')
  return (
    <h2 ref={ref} className={`-mb-[0.12em] grid overflow-hidden pb-[0.12em] ${className}`}>
      {reserve.map((r) => (
        <span key={r} aria-hidden="true" className="invisible [grid-area:1/1]">
          {r}
        </span>
      ))}
      <span ref={riseRef} className="block [grid-area:1/1]">
        {words.map((word, i) => (
          <span key={`${text}-${i}`}>
            {i > 0 && ' '}
            <span data-word className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span className="inline-block motion-safe:animate-[word-up_700ms_cubic-bezier(0.16,1,0.3,1)_both]" style={{ animationDelay: `${i * 70}ms` }}>
                {word}
              </span>
            </span>
          </span>
        ))}
      </span>
    </h2>
  )
}
