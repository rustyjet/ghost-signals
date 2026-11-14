import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
// Phones resize the viewport when the address bar shows or hides; recalculating then makes pinned scenes jump.
ScrollTrigger.config({ ignoreMobileResize: true })

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Narrow screens where the 3D model only gets the top part of the screen. */
export const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 1024

let lenis: Lenis | null = null

/**
 * Smooth wheel scrolling outside the story scenes, driven by GSAP's ticker so Lenis and
 * ScrollTrigger stay in step. Story scenes opt out with data-lenis-prevent and handle input themselves.
 * Skipped for reduced motion.
 */
export function startSmoothScroll(): () => void {
  if (prefersReducedMotion() || lenis) return () => {}
  // Story scenes (data-step-scene) handle their own wheel input. Using `prevent` rather than the
  // data-lenis-prevent attribute matters: that attribute also gets overscroll-behavior: contain from
  // Lenis's stylesheet, which traps the wheel inside the scene.
  lenis = new Lenis({ lerp: 0.12, prevent: (node) => !!node.closest?.('[data-step-scene]') })
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

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Glide the page to a scroll position, then call onDone. */
export function scrollToY(y: number, duration: number, onDone: () => void) {
  if (lenis) {
    lenis.scrollTo(y, { duration, easing: easeInOut, lock: true, force: true, onComplete: onDone })
    return
  }
  const proxy = { y: window.scrollY }
  gsap.to(proxy, {
    y,
    duration,
    ease: 'power3.inOut',
    onUpdate: () => window.scrollTo(0, proxy.y),
    onComplete: onDone,
  })
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
