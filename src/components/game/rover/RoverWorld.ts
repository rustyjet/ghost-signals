import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { WORLD_HALF, buildGround, buildRocks, heightAt, normalAt, seeded, type Rock } from './terrain'

/** -1..1 each. Throttle forward/back, steer left/right. */
export interface DriveInput {
  throttle: number
  steer: number
}

/** What the game state looks like in the scene. Everything eases towards it. */
export interface Look {
  /** 0 clear, 1 the darkest the storm gets */
  storm: number
  /** Sunlight reaching the ground, 0-1 */
  light: number
  /** Share of the panels covered, 0-1 */
  dust: number
  heaters: boolean
}

export type Mode = 'intro' | 'drive' | 'still'
export type Status = 'far' | 'near' | 'studying'

export interface WorldEvents {
  /** A rock has been studied: one finding on board. */
  onStudied: () => void
  /** The rover reached, left or started working at the rock. */
  onStatus: (s: Status) => void
}

const MAX_SPEED = 5 // m/s, game speed (the real rover was far slower)
const MAX_REVERSE = 2.2
const ACCEL = 3.2
const BRAKE = 7
const TURN = 1.25 // rad/s
const STUDY_SECONDS = 3.2
const NEAR = 3.4 // m from the rock to study it
const ROVER_RADIUS = 1.1

const SKY = {
  clearTop: new THREE.Color('#c4925e'),
  clearHorizon: new THREE.Color('#e2bd8f'),
  stormTop: new THREE.Color('#2e1b12'),
  stormHorizon: new THREE.Color('#5b3826'),
}
const SUN = new THREE.Color('#fff1d6')
const SUN_DIM = new THREE.Color('#c98e5c')
const DUST = new THREE.Color('#c9a07a')
const DUST_PANEL = new THREE.Color('#b08458')
const MARK = new THREE.Color('#f2e2c2')

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const damp = (a: number, b: number, k: number, dt: number) => lerp(a, b, 1 - Math.exp(-k * dt))

/** Soft round points (air dust and wheel dust) with per-point size and alpha. */
function dustMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: color.clone() }, uScale: { value: 400 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / max(0.1, -mv.z);
        vAlpha = aAlpha;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vAlpha * uOpacity;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  })
}

function sunTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.16, 'rgba(255,255,255,1)')
  r.addColorStop(0.22, 'rgba(255,255,255,0.45)')
  r.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Rocks worth studying, one after another, wandering away from the landing spot. */
function studyPath(): { x: number; z: number }[] {
  const rand = seeded(21)
  const out: { x: number; z: number }[] = []
  let x = 0
  let z = 0
  let a = 0.35
  for (let i = 0; i < 14; i++) {
    const d = i === 0 ? 22 : 24 + rand() * 10
    x += Math.sin(a) * d
    z += Math.cos(a) * d
    // Turn back inwards before the edge of the world
    if (Math.abs(x) > WORLD_HALF - 25 || Math.abs(z) > WORLD_HALF - 25) {
      a = Math.atan2(-x, -z) + (rand() - 0.5) * 0.6
      x = Math.max(-WORLD_HALF + 20, Math.min(WORLD_HALF - 20, x))
      z = Math.max(-WORLD_HALF + 20, Math.min(WORLD_HALF - 20, z))
    }
    out.push({ x, z })
    a += (rand() - 0.5) * 1.9
  }
  return out
}

export class RoverWorld {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private timer = new THREE.Timer()
  private reduced: boolean
  private narrow: boolean
  private events: WorldEvents
  private resizeObs: ResizeObserver

  // Rover
  private rover = new THREE.Group()
  private body = new THREE.Group()
  private panels: THREE.MeshStandardMaterial[] = []
  private x = 0
  private z = 0
  private yaw = 0
  private speed = 0
  private pitch = 0
  private roll = 0
  private lift = 0
  private moved = 0 // seconds spent moving since the last sol
  private trackGap = 0
  private sway = 0

  // World
  private rocks: Rock[] = []
  private sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>
  private sun: THREE.Sprite
  private sunLight: THREE.DirectionalLight
  private hemi: THREE.HemisphereLight
  private heater: THREE.PointLight
  private armLight: THREE.PointLight
  private fog: THREE.Fog
  private sunDir = new THREE.Vector3(-0.55, 0.62, 0.56).normalize()

  // Dust in the air, dust from the wheels, tracks
  private air: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private airCount: number
  private puffs: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private puffLife: Float32Array
  private puffVel: Float32Array
  private puffNext = 0
  private puffDebt = 0
  private tracks: THREE.InstancedMesh
  private trackNext = 0
  private trackCount = 0

  // The rock to study
  private path = studyPath()
  private target = 0
  private progress = 0
  private status: Status = 'far'
  private marker = new THREE.Group()
  private markerRing: THREE.Mesh
  private markerFill: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private markerPop = 0
  private pointer: HTMLElement | null = null

  // The radio
  private packet: THREE.Sprite
  private packetT = -1
  private packetFrom = new THREE.Vector3()

  // Feel
  private trauma = 0
  private shakeT = 0
  private windBoost = 0
  private flash = 0

  // State
  private mode: Mode = 'intro'
  private input: DriveInput = { throttle: 0, steer: 0 }
  private look: Look = { storm: 0, light: 1, dust: 0.1, heaters: true }
  private shown = { storm: 0, light: 1, dust: 0.1, heat: 1 }
  private cam = new THREE.Vector3(0, 4, -8)
  private camLook = new THREE.Vector3()
  private orbit = 0
  private running = false
  private disposed = false

  constructor(canvas: HTMLCanvasElement, events: WorldEvents, opts: { reduced: boolean; narrow: boolean }) {
    this.events = events
    this.reduced = opts.reduced
    this.narrow = opts.narrow
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.narrow, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.narrow ? 1.5 : 2))
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Soft surroundings for the rover's metal and foil to reflect; dimmed with the storm
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()

    this.camera = new THREE.PerspectiveCamera(opts.narrow ? 62 : 50, 1, 0.1, 900)
    this.fog = new THREE.Fog(SKY.clearHorizon.clone(), 45, 280)
    this.scene.fog = this.fog

    // Sky dome: butterscotch at the horizon, darker overhead; storm brown blended in
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: SKY.clearTop.clone() }, uHorizon: { value: SKY.clearHorizon.clone() } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          varying vec3 vDir;
          void main() {
            float h = clamp(normalize(vDir).y, 0.0, 1.0);
            gl_FragColor = vec4(mix(uHorizon, uTop, pow(h, 0.55)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    )
    this.sky.renderOrder = -2
    this.scene.add(this.sky)

    this.sun = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: sunTexture(), color: SUN.clone(), fog: false, depthWrite: false, transparent: true }),
    )
    this.sun.renderOrder = -1
    this.scene.add(this.sun)

    this.hemi = new THREE.HemisphereLight('#f0d2ae', '#5a3624', 1.1)
    this.scene.add(this.hemi)
    this.sunLight = new THREE.DirectionalLight('#fff1d6', 2.6)
    this.sunLight.castShadow = true
    const sz = opts.narrow ? 512 : 1024
    this.sunLight.shadow.mapSize.set(sz, sz)
    Object.assign(this.sunLight.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 60 })
    this.sunLight.shadow.bias = -0.0008
    this.sunLight.shadow.normalBias = 0.03
    this.scene.add(this.sunLight, this.sunLight.target)

    // Ground and rocks
    this.scene.add(buildGround())
    const { mesh: rockMesh, rocks } = buildRocks(opts.narrow ? 150 : 260, [{ x: 0, z: 0 }, ...this.path])
    this.rocks = rocks.filter((r) => r.r > 0.45)
    this.scene.add(rockMesh)

    // Rover (the model is added in load())
    this.rover.add(this.body)
    this.heater = new THREE.PointLight('#ff9a55', 0, 5, 1.6)
    this.heater.position.set(0, 0.45, 0)
    this.armLight = new THREE.PointLight('#fff1d6', 0, 6, 1.5)
    this.armLight.position.set(0, 0.6, 1.4)
    this.body.add(this.heater, this.armLight)
    this.scene.add(this.rover)

    // Tracks: flat dark prints dropped behind the wheels, recycled
    const TRACKS = opts.narrow ? 500 : 900
    const trackGeo = new THREE.PlaneGeometry(0.32, 0.5)
    trackGeo.rotateX(-Math.PI / 2)
    this.tracks = new THREE.InstancedMesh(
      trackGeo,
      new THREE.MeshStandardMaterial({
        color: '#3a2418',
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        roughness: 1,
      }),
      TRACKS,
    )
    this.tracks.count = 0
    this.tracks.frustumCulled = false
    this.scene.add(this.tracks)

    // Dust in the air: a box of motes that travels with the camera
    this.airCount = opts.narrow ? 700 : 1500
    const air = new THREE.BufferGeometry()
    const ap = new Float32Array(this.airCount * 3)
    const as = new Float32Array(this.airCount)
    const aa = new Float32Array(this.airCount)
    for (let i = 0; i < this.airCount; i++) {
      ap[i * 3] = (Math.random() - 0.5) * 70
      ap[i * 3 + 1] = Math.random() * 16
      ap[i * 3 + 2] = (Math.random() - 0.5) * 70
      as[i] = 0.05 + Math.random() * 0.12
      aa[i] = 0.35 + Math.random() * 0.65
    }
    air.setAttribute('position', new THREE.BufferAttribute(ap, 3))
    air.setAttribute('aSize', new THREE.BufferAttribute(as, 1))
    air.setAttribute('aAlpha', new THREE.BufferAttribute(aa, 1))
    this.air = new THREE.Points(air, dustMaterial(DUST))
    this.air.frustumCulled = false
    this.scene.add(this.air)

    // Dust kicked up by the wheels
    const PUFFS = 160
    const puff = new THREE.BufferGeometry()
    puff.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUFFS * 3), 3))
    puff.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(PUFFS), 1))
    puff.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(PUFFS), 1))
    this.puffs = new THREE.Points(puff, dustMaterial(new THREE.Color('#a87a56')))
    this.puffs.frustumCulled = false
    this.puffLife = new Float32Array(PUFFS)
    this.puffVel = new Float32Array(PUFFS * 3)
    this.scene.add(this.puffs)

    // The rock to study: a pale ring on the ground, a ring that fills while working, a thin marker pole
    const markMat = new THREE.MeshBasicMaterial({ color: MARK, transparent: true, opacity: 0.9, fog: false, depthWrite: false })
    this.markerRing = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.55, 64).rotateX(-Math.PI / 2), markMat)
    this.markerFill = new THREE.Mesh(
      new THREE.RingGeometry(2.75, 3.15, 64, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#fff1d6', transparent: true, opacity: 1, fog: false, depthWrite: false }),
    )
    this.markerFill.geometry.setDrawRange(0, 0)
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 14, 6).translate(0, 7, 0),
      new THREE.MeshBasicMaterial({ color: MARK, transparent: true, opacity: 0.55, fog: false, depthWrite: false }),
    )
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.75, 1).scale(1, 0.6, 1.1),
      new THREE.MeshStandardMaterial({ color: '#8d6a50', roughness: 0.9, flatShading: true }),
    )
    rock.castShadow = true
    rock.position.y = 0.15
    this.marker.add(this.markerRing, this.markerFill, pole, rock)
    this.scene.add(this.marker)
    this.placeMarker()

    // The radio packet: a small light going up
    this.packet = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.sun.material.map, color: '#fff1d6', fog: false, depthWrite: false, transparent: true }),
    )
    this.packet.visible = false
    this.packet.scale.setScalar(1.1)
    this.scene.add(this.packet)

    this.timer.connect(document)
    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(canvas)
    this.resize()
    this.snapCamera()
  }

  /** Loads NASA's Opportunity model. Rejects if it can't (the game then falls back to the photo version). */
  async load(url: string) {
    const draco = new DRACOLoader().setDecoderPath(new URL('draco/', document.baseURI).href)
    const loader = new GLTFLoader().setDRACOLoader(draco)
    try {
      const gltf = await loader.loadAsync(url)
      if (this.disposed) return
      const model = gltf.scene
      model.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        m.castShadow = true
        m.receiveShadow = true
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        for (const mat of mats) {
          if (/panels/.test(mat.name)) this.panels.push(mat as THREE.MeshStandardMaterial)
        }
      })
      this.body.add(model)
      this.render()
    } finally {
      draco.dispose()
    }
  }

  setInput(i: DriveInput) {
    this.input = i
  }

  setLook(l: Look) {
    this.look = l
  }

  setMode(m: Mode) {
    if (m === this.mode) return
    this.mode = m
    if (m !== 'drive') this.input = { throttle: 0, steer: 0 }
  }

  /** The DOM arrow that points at the rock when it is off screen. */
  setPointer(el: HTMLElement | null) {
    this.pointer = el
  }

  /** Runs or stops the render loop (paused, scrolled away or hidden: nothing draws). */
  setRunning(on: boolean) {
    if (on === this.running || this.disposed) return
    this.running = on
    if (on) {
      this.timer.reset()
      this.renderer.setAnimationLoop(() => this.frame())
    } else {
      this.renderer.setAnimationLoop(null)
      this.render()
    }
  }

  /** Share of the time since the last call spent driving (0-1), then starts counting again. */
  takeDriveShare(seconds: number) {
    const share = Math.min(1, this.moved / Math.max(0.001, seconds))
    this.moved = 0
    return share
  }

  /** Back to the landing spot with clean tracks, for a new game. */
  reset() {
    this.x = this.z = this.yaw = this.speed = 0
    this.pitch = this.roll = this.moved = 0
    this.target = 0
    this.progress = 0
    this.tracks.count = this.trackCount = this.trackNext = 0
    this.puffLife.fill(0)
    this.packetT = -1
    this.packet.visible = false
    this.setStatus('far')
    this.placeMarker()
    this.snapCamera()
    this.render()
  }

  gust() {
    this.addTrauma(0.45)
    this.windBoost = this.reduced ? 0 : 1
  }

  /** A finding leaves the antenna for Earth. */
  sendPacket() {
    this.packetFrom.set(0, 1.75, -0.2).applyMatrix4(this.body.matrixWorld)
    this.packetT = 0
    this.packet.visible = true
  }

  dispose() {
    this.disposed = true
    this.renderer.setAnimationLoop(null)
    this.resizeObs.disconnect()
    this.timer.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : []
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose()
        mat.dispose()
      }
    })
    this.renderer.dispose()
  }

  // ---------------------------------------------------------------------------------------------

  private resize() {
    const canvas = this.renderer.domElement
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const scale = this.renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan((this.camera.fov * Math.PI) / 360))
    this.air.material.uniforms.uScale.value = scale
    this.puffs.material.uniforms.uScale.value = scale
    if (!this.running) this.render()
  }

  private render() {
    this.renderer.render(this.scene, this.camera)
  }

  private frame() {
    this.timer.update()
    const dt = Math.min(Math.max(this.timer.getDelta(), 0), 0.05)
    this.update(dt)
    this.render()
  }

  private update(dt: number) {
    this.updateLook(dt)
    this.drive(dt)
    this.study(dt)
    this.updateDust(dt)
    this.updatePacket(dt)
    this.updateCamera(dt)
    this.updatePointer()
  }

  private updateLook(dt: number) {
    const s = this.shown
    s.storm = damp(s.storm, this.look.storm, 1.6, dt)
    s.light = damp(s.light, this.look.light, 1.6, dt)
    s.dust = damp(s.dust, this.look.dust, 2.2, dt)
    s.heat = damp(s.heat, this.look.heaters ? 1 : 0, 4, dt)

    const u = this.sky.material.uniforms
    u.uTop.value.copy(SKY.clearTop).lerp(SKY.stormTop, s.storm)
    u.uHorizon.value.copy(SKY.clearHorizon).lerp(SKY.stormHorizon, s.storm)
    this.fog.color.copy(u.uHorizon.value)
    this.fog.near = lerp(45, 6, s.storm)
    this.fog.far = lerp(280, 70, s.storm)

    // The Sun shrinks to a dull dot as the dust thickens
    const l = s.light
    const sunSize = 12 + 38 * Math.pow(l, 1.6)
    this.sun.scale.setScalar(sunSize)
    this.sun.material.color.copy(SUN_DIM).lerp(SUN, l)
    this.sun.material.opacity = 0.35 + 0.65 * l
    this.sunLight.intensity = 0.25 + 2.6 * Math.pow(l, 1.3)
    this.sunLight.color.copy(SUN_DIM).lerp(SUN, l)
    this.hemi.intensity = 0.55 + 0.6 * l
    this.scene.environmentIntensity = 0.12 + 0.3 * l
    this.hemi.color.set('#f0d2ae').lerp(SKY.stormHorizon, s.storm * 0.6)

    // Dust on the solar panels
    for (const p of this.panels) p.color.set('#ffffff').lerp(DUST_PANEL, Math.min(1, s.dust * 1.15))

    this.heater.intensity = s.heat * (1.6 + 4 * s.storm)
    this.flash = Math.max(0, this.flash - dt * 1.8)
    this.armLight.intensity = this.flash * 9
  }

  private drive(dt: number) {
    const moving = this.mode === 'drive'
    const { throttle, steer } = moving ? this.input : { throttle: 0, steer: 0 }
    const target = throttle >= 0 ? throttle * MAX_SPEED : throttle * MAX_REVERSE
    const rate = Math.abs(target) > Math.abs(this.speed) && Math.sign(target) === Math.sign(this.speed || target) ? ACCEL : BRAKE
    const before = this.speed
    this.speed += Math.max(-rate * dt, Math.min(rate * dt, target - this.speed))
    if (Math.abs(this.speed) < 0.01 && throttle === 0) this.speed = 0
    this.yaw -= steer * TURN * dt * (this.speed < -0.1 ? -1 : 1)

    const fx = Math.sin(this.yaw)
    const fz = Math.cos(this.yaw)
    let nx = this.x + fx * this.speed * dt
    let nz = this.z + fz * this.speed * dt

    // Rocks are solid: slide off them
    for (const r of this.rocks) {
      const dx = nx - r.x
      const dz = nz - r.z
      const min = ROVER_RADIUS + r.r * 0.8
      const d2 = dx * dx + dz * dz
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 0.001
        nx = r.x + (dx / d) * min
        nz = r.z + (dz / d) * min
        this.speed *= 0.6
      }
    }
    const lim = WORLD_HALF
    if (Math.abs(nx) > lim || Math.abs(nz) > lim) this.speed *= 0.5
    nx = Math.max(-lim, Math.min(lim, nx))
    nz = Math.max(-lim, Math.min(lim, nz))
    const step = Math.hypot(nx - this.x, nz - this.z)
    this.x = nx
    this.z = nz
    if (Math.abs(this.speed) > 0.3) this.moved += dt

    // Sit on the ground under the wheels: pitch from front and back, roll from left and right
    const sx = Math.cos(this.yaw)
    const sz = -Math.sin(this.yaw)
    const hF = heightAt(this.x + fx * 0.8, this.z + fz * 0.8)
    const hB = heightAt(this.x - fx * 0.8, this.z - fz * 0.8)
    const hL = heightAt(this.x + sx * 0.9, this.z + sz * 0.9)
    const hR = heightAt(this.x - sx * 0.9, this.z - sz * 0.9)
    const accel = (this.speed - before) / Math.max(dt, 0.001)
    const k = this.reduced ? 30 : 9
    this.pitch = damp(this.pitch, Math.atan2(hB - hF, 1.6) - (this.reduced ? 0 : accel * 0.006), k, dt)
    this.roll = damp(this.roll, Math.atan2(hL - hR, 1.8), k, dt)
    this.lift = (hF + hB + hL + hR) / 4
    this.sway += dt * (6 + Math.abs(this.speed) * 3)
    const bob = this.reduced ? 0 : Math.sin(this.sway) * 0.012 * Math.min(1, Math.abs(this.speed) / MAX_SPEED)

    this.rover.position.set(this.x, this.lift + bob, this.z)
    this.rover.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ')
    this.rover.updateMatrixWorld()

    // Shadow follows the rover
    this.sunLight.target.position.set(this.x, this.lift, this.z)
    this.sunLight.position.copy(this.sunLight.target.position).addScaledVector(this.sunDir, 30)

    // Tracks and wheel dust
    if (Math.abs(this.speed) > 0.05) {
      this.trackGap += step
      while (this.trackGap > 0.42) {
        this.trackGap -= 0.42
        this.dropTrack(sx, sz)
      }
    }
    if (Math.abs(this.speed) > 0.6) {
      this.puffDebt += dt * Math.abs(this.speed) * 7
      while (this.puffDebt > 1) {
        this.puffDebt -= 1
        this.spawnPuff(fx, fz, sx, sz)
      }
    }
  }

  private dropTrack(sx: number, sz: number) {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    const n = new THREE.Vector3()
    const one = new THREE.Vector3(1, 1, 1)
    for (const side of [1, -1]) {
      const x = this.x + sx * 0.92 * side
      const z = this.z + sz * 0.92 * side
      normalAt(x, z, n)
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n).multiply(yawQ)
      m.compose(new THREE.Vector3(x, heightAt(x, z) + 0.03, z), q, one)
      this.tracks.setMatrixAt(this.trackNext, m)
      this.trackNext = (this.trackNext + 1) % this.tracks.instanceMatrix.count
      this.trackCount = Math.min(this.trackCount + 1, this.tracks.instanceMatrix.count)
    }
    this.tracks.count = this.trackCount
    this.tracks.instanceMatrix.needsUpdate = true
  }

  private spawnPuff(fx: number, fz: number, sx: number, sz: number) {
    const i = this.puffNext
    this.puffNext = (i + 1) % this.puffLife.length
    const side = Math.random() < 0.5 ? 1 : -1
    const back = this.speed > 0 ? -1 : 1
    const pos = this.puffs.geometry.attributes.position as THREE.BufferAttribute
    const x = this.x + sx * 0.95 * side + fx * 0.7 * back + (Math.random() - 0.5) * 0.3
    const z = this.z + sz * 0.95 * side + fz * 0.7 * back + (Math.random() - 0.5) * 0.3
    pos.setXYZ(i, x, heightAt(x, z) + 0.15, z)
    this.puffVel[i * 3] = fx * back * 0.6 + (Math.random() - 0.5) * 0.5
    this.puffVel[i * 3 + 1] = 0.35 + Math.random() * 0.4
    this.puffVel[i * 3 + 2] = fz * back * 0.6 + (Math.random() - 0.5) * 0.5
    this.puffLife[i] = 1
  }

  private updateDust(dt: number) {
    // Wheel puffs: rise, spread and fade
    const pos = this.puffs.geometry.attributes.position as THREE.BufferAttribute
    const size = this.puffs.geometry.attributes.aSize as THREE.BufferAttribute
    const alpha = this.puffs.geometry.attributes.aAlpha as THREE.BufferAttribute
    const wind = this.reduced ? 0 : 0.6 + this.shown.storm * 3
    for (let i = 0; i < this.puffLife.length; i++) {
      const life = this.puffLife[i]
      if (life <= 0) {
        alpha.setX(i, 0)
        continue
      }
      const l = Math.max(0, life - dt / 1.3)
      this.puffLife[i] = l
      pos.setXYZ(
        i,
        pos.getX(i) + (this.puffVel[i * 3] + wind) * dt,
        pos.getY(i) + this.puffVel[i * 3 + 1] * dt,
        pos.getZ(i) + this.puffVel[i * 3 + 2] * dt,
      )
      size.setX(i, 0.5 + (1 - l) * 1.6)
      alpha.setX(i, l * l * 0.55)
    }
    pos.needsUpdate = size.needsUpdate = alpha.needsUpdate = true

    // Air: blows past; more of it, faster, thicker as the storm grows
    const storm = this.shown.storm
    this.windBoost = Math.max(0, this.windBoost - dt * 0.9)
    const speed = this.reduced ? 0 : 1.5 + storm * 13 + this.windBoost * 22
    const ap = this.air.geometry.attributes.position as THREE.BufferAttribute
    const cx = this.camera.position.x
    const cz = this.camera.position.z
    const cy = this.lift
    for (let i = 0; i < this.airCount; i++) {
      let x = ap.getX(i) + speed * dt
      let z = ap.getZ(i) + speed * dt * 0.35
      let y = ap.getY(i)
      // Keep every mote inside a 70 m box around the camera
      x = cx + ((((x - cx + 35) % 70) + 70) % 70) - 35
      z = cz + ((((z - cz + 35) % 70) + 70) % 70) - 35
      if (y < cy - 2 || y > cy + 18) y = cy + Math.random() * 16
      ap.setXYZ(i, x, y, z)
    }
    ap.needsUpdate = true
    this.air.geometry.setDrawRange(0, Math.round(this.airCount * (0.2 + 0.8 * storm)))
    this.air.material.uniforms.uOpacity.value = 0.35 + storm * 0.65 + this.windBoost * 0.3
  }

  private study(dt: number) {
    if (this.mode !== 'drive') return
    const t = this.path[this.target]
    const d = Math.hypot(t.x - this.x, t.z - this.z)
    const near = d < NEAR
    const working = near && Math.abs(this.speed) < 0.4
    if (working) {
      this.progress = Math.min(1, this.progress + dt / STUDY_SECONDS)
      this.setStatus('studying')
    } else this.setStatus(near ? 'near' : 'far')
    this.markerFill.geometry.setDrawRange(0, Math.floor(this.progress * 64) * 6)

    if (this.progress >= 1) {
      this.flash = 1
      this.markerPop = 1
      this.events.onStudied()
      this.target = (this.target + 1) % this.path.length
      this.progress = 0
      this.setStatus('far')
      this.placeMarker()
    }
    // A short pop on the new marker so the eye finds it
    this.markerPop = Math.max(0, this.markerPop - dt * 2.5)
    const pop = this.reduced ? 1 : 1 + Math.sin((1 - this.markerPop) * Math.PI) * this.markerPop * 0.35
    this.markerRing.scale.setScalar(pop)
  }

  private setStatus(s: Status) {
    if (s === this.status) return
    this.status = s
    this.events.onStatus(s)
  }

  private placeMarker() {
    const t = this.path[this.target]
    this.marker.position.set(t.x, heightAt(t.x, t.z) + 0.12, t.z)
    this.markerFill.geometry.setDrawRange(0, 0)
  }

  private updatePacket(dt: number) {
    if (this.packetT < 0) return
    this.packetT += dt / (this.reduced ? 0.9 : 1.5)
    const t = Math.min(1, this.packetT)
    const rise = this.reduced ? 12 : t * t * 70
    this.packet.position.copy(this.packetFrom).add(new THREE.Vector3(0, rise, 0))
    this.packet.material.opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
    this.packet.scale.setScalar(this.reduced ? 1.1 : 0.9 + t * 1.4)
    if (t >= 1) {
      this.packetT = -1
      this.packet.visible = false
    }
  }

  private addTrauma(a: number) {
    if (this.reduced) return
    this.trauma = Math.min(1, this.trauma + a)
  }

  private snapCamera() {
    this.chaseTarget(this.cam, this.camLook)
    this.camera.position.copy(this.cam)
    this.camera.lookAt(this.camLook)
  }

  private chaseTarget(pos: THREE.Vector3, look: THREE.Vector3) {
    const fx = Math.sin(this.yaw)
    const fz = Math.cos(this.yaw)
    // Aimed below the rover, so it rides in the open upper part of the screen, clear of the controls
    const back = this.narrow ? 9 : 7.4
    pos.set(this.x - fx * back, this.lift + (this.narrow ? 4.4 : 3.3), this.z - fz * back)
    look.set(this.x + fx * 3.5, this.lift + (this.narrow ? -2.2 : 0.1), this.z + fz * 3.5)
  }

  private updateCamera(dt: number) {
    const pos = new THREE.Vector3()
    const look = new THREE.Vector3()
    if (this.mode === 'intro' && !this.reduced) {
      // Before the game: a slow walk round the rover
      this.orbit += dt * 0.16
      const r = this.narrow ? 8 : 6.6
      pos.set(this.x + Math.sin(this.orbit + 2.4) * r, this.lift + 2.3, this.z + Math.cos(this.orbit + 2.4) * r)
      look.set(this.x, this.lift + 0.75, this.z)
      // Keep the rover clear of the intro words: to their right on wide screens, above them on phones
      if (this.narrow) look.y -= 1.6
      else {
        const right = new THREE.Vector3().subVectors(look, pos).cross(THREE.Object3D.DEFAULT_UP).normalize()
        look.addScaledVector(right, -2.4)
      }
    } else {
      this.chaseTarget(pos, look)
    }
    const k = this.reduced ? 40 : 3.2
    this.cam.x = damp(this.cam.x, pos.x, k, dt)
    this.cam.y = damp(this.cam.y, pos.y, k, dt)
    this.cam.z = damp(this.cam.z, pos.z, k, dt)
    this.camLook.x = damp(this.camLook.x, look.x, k * 1.6, dt)
    this.camLook.y = damp(this.camLook.y, look.y, k * 1.6, dt)
    this.camLook.z = damp(this.camLook.z, look.z, k * 1.6, dt)
    // Never under the ground
    this.cam.y = Math.max(this.cam.y, heightAt(this.cam.x, this.cam.z) + 1.2)

    this.camera.position.copy(this.cam)
    this.camera.lookAt(this.camLook)

    // Shake: decaying trauma, summed sines (never random buzz), added to the view only
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.4)
      this.shakeT += dt * 30
      const s = this.trauma * this.trauma
      this.camera.position.x += Math.sin(this.shakeT * 1.7) * 0.25 * s
      this.camera.position.y += Math.sin(this.shakeT * 2.3) * 0.16 * s
      this.camera.rotation.z += Math.sin(this.shakeT * 1.1) * 0.02 * s
    }

    this.sky.position.copy(this.camera.position)
    this.sun.position.copy(this.camera.position).addScaledVector(this.sunDir, 400)
  }

  /** Points the DOM arrow at the rock when it is behind or beside the camera. */
  private updatePointer() {
    const el = this.pointer
    if (!el) return
    const t = this.path[this.target]
    const p = new THREE.Vector3(t.x, heightAt(t.x, t.z) + 1, t.z).project(this.camera)
    const behind = p.z > 1
    const onScreen = !behind && Math.abs(p.x) < 0.9 && Math.abs(p.y) < 0.85
    if (this.mode !== 'drive' || onScreen) {
      el.style.opacity = '0'
      return
    }
    let x = behind ? -p.x : p.x
    let y = behind ? -p.y : p.y
    if (behind && Math.abs(y) < 0.2) y = -0.9 // behind: point down, "turn round"
    const angle = Math.atan2(-y, x)
    const m = Math.max(Math.abs(x) / 0.86, Math.abs(y) / 0.78)
    x /= m
    y /= m
    // The lower part of the screen belongs to the words and switches
    y = Math.max(y, this.narrow ? 0.25 : -0.05)
    el.style.opacity = '1'
    el.style.transform = `translate(${(x * 0.5 + 0.5) * 100}cqw, ${(-y * 0.5 + 0.5) * 100}cqh) translate(-50%, -50%) rotate(${angle}rad)`
  }
}
