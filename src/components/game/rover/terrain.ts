import * as THREE from 'three'

/** Half the width of the drivable ground, in metres. The fog hides the edge. */
export const WORLD_HALF = 150

/**
 * Height of the ground at (x, z), in metres. Plain summed waves: gentle swells, a few dunes, small bumps.
 * Drawn, not a real place. Pure, so the rover, rocks and tracks all agree on where the ground is.
 */
export function heightAt(x: number, z: number): number {
  const swell = Math.sin(x * 0.021) * Math.cos(z * 0.017) * 2.4 + Math.sin((x + z) * 0.011) * 1.6
  // Dune ripples running one way, as wind leaves them
  const ripple = Math.max(0, Math.sin(x * 0.09 + z * 0.035 + Math.sin(z * 0.02) * 2)) ** 3 * 0.55
  const bumps = Math.sin(x * 0.37 + 1.3) * Math.sin(z * 0.41 - 0.7) * 0.12
  // The start is flat enough to read the rover clearly
  const calm = Math.min(1, Math.hypot(x, z) / 18)
  return (swell + ripple + bumps) * (0.35 + 0.65 * calm)
}

/** Surface normal from the height field (central differences). */
export function normalAt(x: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
  const e = 0.6
  const dx = heightAt(x + e, z) - heightAt(x - e, z)
  const dz = heightAt(x, z + e) - heightAt(x, z - e)
  return out.set(-dx, 2 * e, -dz).normalize()
}

/** Seeded random, so the rocks are in the same places every game. */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// Meridiani Planum: rust-brown dust over dark basalt sand
const DUST = new THREE.Color('#9b6a46')
const SAND = new THREE.Color('#5e3d2a')
const PALE = new THREE.Color('#b78a63')

export function buildGround(): THREE.Mesh {
  const size = WORLD_HALF * 2 + 120
  const seg = 180
  const geo = new THREE.PlaneGeometry(size, size, seg, seg)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  const n = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const y = heightAt(x, z)
    pos.setY(i, y)
    normalAt(x, z, n)
    // Dark sand gathers in hollows and on slopes; pale dust on the flat tops
    const slope = 1 - n.y
    const hollow = Math.min(1, Math.max(0, -y * 0.35 + 0.35))
    c.copy(DUST).lerp(SAND, Math.min(1, slope * 6 + hollow * 0.6))
    c.lerp(PALE, Math.max(0, y - 1.5) * 0.15)
    const grain = (Math.sin(x * 3.1) * Math.sin(z * 2.7) + Math.sin(x * 7.3 + z * 5.1)) * 0.025
    colors[i * 3] = c.r + grain
    colors[i * 3 + 1] = c.g + grain
    colors[i * 3 + 2] = c.b + grain
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, envMapIntensity: 0 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.receiveShadow = true
  return mesh
}

export interface Rock {
  x: number
  z: number
  r: number
}

/** Scattered rocks (scenery) as one instanced mesh. */
export function buildRocks(count: number, avoid: { x: number; z: number }[]): { mesh: THREE.InstancedMesh; rocks: Rock[] } {
  const rand = seeded(7)
  const geo = new THREE.IcosahedronGeometry(1, 1)
  // Squash and dent the rock so it isn't a ball
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + Math.sin(p.getX(i) * 5.1 + p.getZ(i) * 3.7) * 0.18
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.55 * k, p.getZ(i) * k)
  }
  geo.computeVertexNormals()
  const mat = new THREE.MeshStandardMaterial({ color: '#4a3226', roughness: 0.95, flatShading: true, envMapIntensity: 0 })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  mesh.castShadow = true
  mesh.receiveShadow = true
  const rocks: Rock[] = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  let i = 0
  while (i < count) {
    const x = (rand() * 2 - 1) * (WORLD_HALF + 30)
    const z = (rand() * 2 - 1) * (WORLD_HALF + 30)
    if (Math.hypot(x, z) < 10) continue
    if (avoid.some((a) => Math.hypot(a.x - x, a.z - z) < 6)) continue
    const r = 0.25 + rand() ** 3 * 1.4
    e.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4)
    q.setFromEuler(e)
    m.compose(new THREE.Vector3(x, heightAt(x, z) + r * 0.15, z), q, new THREE.Vector3(r, r, r))
    mesh.setMatrixAt(i, m)
    rocks.push({ x, z, r })
    i++
  }
  mesh.instanceMatrix.needsUpdate = true
  return { mesh, rocks }
}
