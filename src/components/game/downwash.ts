// Dust blown out along the ground by Ingenuity's rotor wash, drawn on a canvas in the Lift off game.
// Soft puffs leave the ground under the rotor to both sides, slow down, billow up a little, grow and fade.
// How much comes up follows the lift the blades make and how close the rotor is to the ground; higher up the
// wash is weaker and spread wider. Reduced motion: no puffs, a still haze at the ground that grows and fades.

interface Puff {
  x: number // world px (screen x; y before the camera offset)
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number // radius at birth, px
  grow: number // radius gained over its life, px
  alpha: number
}

const MAX_PUFFS = 160

export function createDownwash(canvas: HTMLCanvasElement, reduced: boolean) {
  const ctx = canvas.getContext('2d')
  const puffs: Puff[] = []
  let w = 0
  let h = 0
  let carry = 0 // fractional puffs owed between frames
  let drawn = false

  // One soft dust blot, drawn once and stamped for every puff
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = 64
  const sctx = sprite.getContext('2d')
  if (sctx) {
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(214, 172, 126, 1)')
    g.addColorStop(0.45, 'rgba(206, 160, 112, 0.55)')
    g.addColorStop(1, 'rgba(196, 146, 94, 0)')
    sctx.fillStyle = g
    sctx.fillRect(0, 0, 64, 64)
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function add(x: number, y: number, k: number, strength: number, spread: number) {
    if (puffs.length >= MAX_PUFFS) return
    const dir = Math.random() < 0.5 ? -1 : 1
    const speed = (0.9 + Math.random() * 1.6) * k * (0.5 + strength)
    puffs.push({
      x: x + dir * Math.random() * spread * k,
      y: y + (Math.random() - 0.5) * 0.12 * k,
      vx: dir * speed,
      vy: -(0.05 + Math.random() * 0.25) * k,
      age: 0,
      life: 0.9 + Math.random() * 1.1,
      size: (0.08 + Math.random() * 0.1) * k,
      grow: (0.3 + Math.random() * 0.4) * k,
      alpha: 0.35 + Math.random() * 0.35,
    })
  }

  return {
    resize,
    /** A burst of dust at once: lift-off, landing. `strength` 0–1. */
    burst(x: number, ground: number, k: number, count: number, strength: number) {
      if (reduced) return
      for (let i = 0; i < count; i++) add(x, ground, k, strength, 0.5)
    },
    /**
     * One frame. `power` is how much wash reaches the ground (0–1), `height` the helicopter's height in metres,
     * `cam` the camera offset in px.
     */
    step(dt: number, x: number, ground: number, k: number, power: number, height: number, cam: number) {
      if (!ctx) return
      if (reduced) {
        if (power < 0.01 && !drawn) return
        ctx.clearRect(0, 0, w, h)
        drawn = power >= 0.01
        if (!drawn) return
        ctx.globalAlpha = Math.min(0.55, power * 0.6)
        ctx.drawImage(sprite, x - 2.2 * k, ground + cam - 0.45 * k, 4.4 * k, 0.9 * k)
        ctx.globalAlpha = 1
        return
      }
      // New puffs: up to about 90 a second at full wash, spread wider the higher the rotor is
      carry += power * 90 * dt
      const spread = 0.35 + height * 0.35
      while (carry >= 1) {
        add(x, ground, k, power, spread)
        carry -= 1
      }
      if (!puffs.length && !drawn) return
      ctx.clearRect(0, 0, w, h)
      drawn = puffs.length > 0
      const drag = Math.exp(-1.6 * dt)
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]
        p.age += dt
        if (p.age >= p.life) {
          puffs.splice(i, 1)
          continue
        }
        p.vx *= drag
        p.vy = p.vy * drag - 0.04 * k * dt // drifts up a little as it slows
        p.x += p.vx * dt
        p.y += p.vy * dt
        const t = p.age / p.life
        const r = p.size + p.grow * Math.sqrt(t)
        // Fades in fast, out slowly
        ctx.globalAlpha = p.alpha * Math.min(1, t * 8) * (1 - t) ** 1.6
        ctx.drawImage(sprite, p.x - r, p.y + cam - r * 0.7, r * 2, r * 1.4)
      }
      ctx.globalAlpha = 1
    },
  }
}
