import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, useGSAP)
// Phones resize the viewport when the address bar shows or hides; recalculating then makes pinned scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true })

/** Narrow screens where the 3D model only gets the top half of the screen. */
export const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 768

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

/**
 * Smooth scrolling driven by GSAP's ticker so Lenis and ScrollTrigger stay in step.
 * Skipped for reduced motion: the browser's own scrolling is used instead.
 */
export function startSmoothScroll(): () => void {
  if (prefersReducedMotion() || lenis) return () => {}
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
}

export { gsap, ScrollTrigger, useGSAP }
