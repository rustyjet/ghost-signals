import { useEffect, useRef } from 'react'
import { ScrollTrigger, scrollToY } from './smoothScroll'

/** Share of the screen height scrolled per story step. Short, because the page glides there for you. */
export const STEP_SHARE = 0.6
export const stepPx = () => Math.round(window.innerHeight * STEP_SHARE)

const GLIDE_S = 0.85
/** A new wheel gesture starts after this much quiet. Stops trackpad momentum from skipping steps. */
const GESTURE_GAP_MS = 220
const SWIPE_MIN_PX = 36

/**
 * One flick, one step. While the pinned scene is on screen, a wheel flick, swipe, arrow key or
 * Page Up/Down moves exactly one step and the page glides there. At the first and last step the
 * input is let through, so the reader scrolls out of the scene normally.
 */
export function useStepScroll(trigger: React.RefObject<ScrollTrigger | null>, count: number) {
  const busy = useRef(false)

  const api = useRef({
    /** Step index nearest the current scroll position. */
    current(): number {
      const st = trigger.current
      if (!st) return 0
      return Math.min(count - 1, Math.max(0, Math.round((window.scrollY - st.start) / stepPx())))
    },
    inScene(): boolean {
      const st = trigger.current
      return !!st && window.scrollY >= st.start - 2 && window.scrollY <= st.end + 2
    },
    go(index: number) {
      const st = trigger.current
      if (!st || busy.current) return
      busy.current = true
      const release = () => {
        busy.current = false
      }
      // Leaving past the last step lands on the section after the scene.
      const y = index >= count ? st.end + window.innerHeight : st.start + Math.max(0, index) * stepPx()
      scrollToY(y, GLIDE_S, release)
      window.setTimeout(release, GLIDE_S * 1000 + 400) // never stay locked
    },
  })

  useEffect(() => {
    const a = api.current
    let lastWheel = 0
    let touchStartY: number | null = null

    /**
     * Where a move in direction `dir` from here would land, or null to let the page scroll normally.
     * Past the last step the target is `count`: one more glide, out to the section below.
     */
    const targetFor = (dir: 1 | -1): number | null => {
      const st = trigger.current
      // Coming back up from the section just below: glide straight back to the last step.
      if (st && dir === -1 && window.scrollY > st.end + 2 && window.scrollY <= st.end + window.innerHeight + 2)
        return count - 1
      if (!a.inScene()) return null
      const next = a.current() + dir
      return next < 0 || next > count ? null : next
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 2) return
      const dir = e.deltaY > 0 ? 1 : -1
      const target = targetFor(dir)
      if (target === null) {
        if (busy.current) e.preventDefault()
        return
      }
      e.preventDefault()
      const now = performance.now()
      const newGesture = now - lastWheel > GESTURE_GAP_MS
      lastWheel = now
      if (newGesture && !busy.current) a.go(target)
    }

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = a.inScene() ? e.touches[0].clientY : null
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY === null) return
      const dy = touchStartY - e.touches[0].clientY
      if (Math.abs(dy) < 4) return
      if (targetFor(dy > 0 ? 1 : -1) !== null || busy.current) e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY === null) return
      const dy = touchStartY - e.changedTouches[0].clientY
      touchStartY = null
      if (Math.abs(dy) < SWIPE_MIN_PX) return
      const target = targetFor(dy > 0 ? 1 : -1)
      if (target !== null) a.go(target)
    }

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName))) return
      const down = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey
      const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)
      if (!down && !up) return
      const target = targetFor(down ? 1 : -1)
      if (target === null) return
      e.preventDefault()
      a.go(target)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
  }, [count])

  return api.current
}
