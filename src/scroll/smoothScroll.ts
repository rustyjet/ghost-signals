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

export { gsap, ScrollTrigger, SplitText, useGSAP }
