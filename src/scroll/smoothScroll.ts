import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// The page scrolls natively everywhere: no smooth-scroll library, no snapping, no wheel hijacking.
// Animation follows the scrollbar through ScrollTrigger scrubs instead.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
// Phones resize the viewport when the address bar shows or hides; recalculating then makes scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true })
// The pages place the scroll themselves (a chapter starts at its title, the start page at the machine you came back
// from), so the browser's own restore on Back would only fight them. Set through ScrollTrigger, which otherwise puts
// back the setting it found at startup on every refresh.
ScrollTrigger.clearScrollMemory('manual')

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Narrow screens, where the machine sits in a panel at the top and the words scroll below it. */
export const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 1024

/**
 * A display title split into letters, each in its own mask, so letters can rise into view. A mask is only as tall
 * as the line, and at the titles' tight leading the tails of g, y, p and j (and accents on capitals) hang outside
 * it, so the masks get room above and below, taken back with negative margins so nothing moves. Letters rise
 * from `TITLE_RISE`, which clears the taller mask.
 */
export function splitTitle(el: HTMLElement) {
  const split = SplitText.create(el, { type: 'words,chars', mask: 'chars' })
  gsap.set(split.masks, { paddingTop: '0.18em', marginTop: '-0.18em', paddingBottom: '0.2em', marginBottom: '-0.2em' })
  return split
}
export const TITLE_RISE = 135

export { gsap, ScrollTrigger, SplitText, useGSAP }
