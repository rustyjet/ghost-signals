import type { Material, Mesh, Object3D } from 'three'

// Spinning blades blur into a disc. NASA's model has the two rotors as their own parts, each turning about its
// own X axis with blades about 0.6 units long (in the rotor's own space). As they speed up, the blades fade and a
// soft see-through disc grows over the circle they sweep. From the game's side view the disc is seen almost edge
// on, as a thin haze, which is how fast rotors look from the side. three.js is the copy model-viewer already
// loaded, fetched only once the model is in.

const BLADE_REACH = 0.604
const BLADE_OFFSET = 0.038 // the blades sit off the rotor's centre along its axis: below for one rotor, above for the other

function discTexture(THREE: typeof import('three')) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(38, 34, 32, 0)')
  grad.addColorStop(0.14, 'rgba(38, 34, 32, 0)')
  grad.addColorStop(0.2, 'rgba(38, 34, 32, 0.35)')
  grad.addColorStop(0.85, 'rgba(38, 34, 32, 0.45)')
  grad.addColorStop(0.96, 'rgba(38, 34, 32, 0.7)')
  grad.addColorStop(1, 'rgba(38, 34, 32, 0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  // Faint rings, like the streaks a fast blade leaves
  g.lineWidth = 1.5
  for (let r = 40; r < 122; r += 9) {
    g.strokeStyle = `rgba(20, 18, 16, ${0.06 + ((r * 7) % 5) * 0.02})`
    g.beginPath()
    g.arc(128, 128, r, 0, Math.PI * 2)
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

type RotorBlur = { set(blur: number): boolean }
// Once per model: the game can ask again (a second load event, a remount in development) and gets the same discs
const made = new WeakMap<Object3D, Promise<RotorBlur>>()

export function addRotorBlur(rotors: Object3D[]): Promise<RotorBlur> {
  let p = made.get(rotors[0])
  if (!p) {
    p = build(rotors)
    made.set(rotors[0], p)
  }
  return p
}

async function build(rotors: Object3D[]): Promise<RotorBlur> {
  const THREE = await import('three')
  const discMat = new THREE.MeshBasicMaterial({
    map: discTexture(THREE),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const geo = new THREE.CircleGeometry(BLADE_REACH, 64).rotateY(Math.PI / 2) // facing along the rotor's axis
  const bladeMats = new Set<Material>()
  const discs: Mesh[] = []
  rotors.forEach((rotor, i) => {
    rotor.traverse((o) => {
      const m = (o as Mesh).material as Material | undefined
      if (m && !Array.isArray(m) && m.name === 'blades') bladeMats.add(m)
    })
    const disc = new THREE.Mesh(geo, discMat)
    disc.position.x = i === 0 ? -BLADE_OFFSET : BLADE_OFFSET
    disc.visible = false
    rotor.add(disc)
    discs.push(disc)
  })
  bladeMats.forEach((m) => {
    m.transparent = true
    m.needsUpdate = true
  })
  let last = -1
  return {
    /** 0 = blades still and solid, 1 = a full blur disc. Returns true when the picture changed. */
    set(blur: number) {
      const b = Math.round(Math.min(1, Math.max(0, blur)) * 100) / 100
      if (b === last) return false
      last = b
      bladeMats.forEach((m) => (m.opacity = 1 - 0.8 * b))
      discMat.opacity = 0.9 * b
      discs.forEach((d) => (d.visible = b > 0))
      return true
    },
  }
}
