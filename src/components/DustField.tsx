import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../scroll/smoothScroll'

interface Props {
  /** Read every frame: 0 = clear air, 1 = full storm. A ref, so scrolling never re-renders React. */
  stormRef: React.RefObject<number>
  className?: string
}

interface Mote {
  x: number
  y: number
  speed: number
  size: number
  length: number
  alpha: number
}

/**
 * Wind-blown Martian dust drawn on a canvas. More motes, faster and longer streaks as the storm grows.
 * With reduced motion it draws a still haze instead.
 */
export default function DustField({ stormRef, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = prefersReducedMotion()
    const MAX = 420
    const motes: Mote[] = Array.from({ length: MAX }, () => spawn(Math.random()))
    let w = 0
    let h = 0
    let raf = 0

    function spawn(x = 0): Mote {
      return {
        x,
        y: Math.random(),
        speed: 0.2 + Math.random() * 0.8,
        size: 0.6 + Math.random() * 1.8,
        length: 0.3 + Math.random(),
        alpha: 0.25 + Math.random() * 0.55,
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas!.clientWidth
      h = canvas!.clientHeight
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function frame() {
      const storm = Math.min(1, Math.max(0, stormRef.current ?? 0))
      ctx!.clearRect(0, 0, w, h)
      const visible = Math.round(30 + storm * (MAX - 30))
      const wind = 0.6 + storm * 6 // px per frame at speed 1
      ctx!.lineCap = 'round'
      for (let i = 0; i < visible; i++) {
        const m = motes[i]
        if (!still) {
          m.x += (m.speed * wind) / w
          m.y += Math.sin((m.x + i) * 9) * 0.0004
          if (m.x > 1.02) Object.assign(m, spawn(-0.02))
        }
        const streak = still ? 0 : m.length * wind * 3
        ctx!.strokeStyle = `rgba(232, 196, 150, ${m.alpha * (0.35 + storm * 0.65)})`
        ctx!.lineWidth = m.size
        ctx!.beginPath()
        ctx!.moveTo(m.x * w, m.y * h)
        ctx!.lineTo(m.x * w - streak, m.y * h)
        ctx!.stroke()
      }
      if (!still) raf = requestAnimationFrame(frame)
    }

    resize()
    frame()
    const ro = new ResizeObserver(() => {
      resize()
      if (still) frame()
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [stormRef])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />
}
