// Frame-by-frame scroll capture of the built site for the long demo video.
// Usage: node capture.mjs <take> [maxSeconds]   (site served by `vite preview` on :4173)
// The page clock is faked, so every frame advances exactly 1/30 s of page time however long the screenshot takes:
// GSAP's scrub smoothing and model-viewer's turntable move at true speed in the video.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const exe = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
const BASE = 'http://localhost:4173/'
const FPS = 30
const OUT = '../remotion/public/long'
// Used for the start page (no 3D model). Pages with a model: capture-rt.mjs.
import { TAKES } from './takes.mjs'

const name = process.argv[2]
const maxS = Number(process.argv[3] || 1e9)
const take = TAKES[name]
if (!take) throw new Error(`take? ${Object.keys(TAKES).join(', ')}`)

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
function yAt(t) {
  const k = take.keys
  if (t <= k[0][0]) return k[0][1]
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i][0]) {
      const [t0, y0] = k[i - 1], [t1, y1] = k[i]
      return y0 + (y1 - y0) * ease((t - t0) / (t1 - t0))
    }
  }
  return k[k.length - 1][1]
}

const browser = await chromium.launch({
  executablePath: exe,
  headless: false,
  args: ['--window-size=1920,1080', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
})
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.clock.install({ time: Date.now() })
await page.goto(BASE + take.url)

// Pump the fake clock while real network loads finish.
const pump = async (ms) => { for (let i = 0; i < ms / 100; i++) { await page.clock.runFor(100); await page.waitForTimeout(15) } }
const ready = () => page.evaluate(() => {
  const imgs = [...document.images].every((i) => i.complete)
  const mvs = [...document.querySelectorAll('model-viewer')].every((m) => m.loaded)
  return imgs && mvs && document.fonts.status === 'loaded'
})
await pump(1500)
// Pre-pass: travel the whole path so lazy pictures load, then settle back at the start.
const last = take.keys[take.keys.length - 1][1]
for (let y = 0; y <= last + 1080; y += 540) { await page.evaluate((v) => scrollTo(0, v), y); await pump(300) }
for (let i = 0; i < 60 && !(await ready()); i++) await pump(500)
console.log('ready:', await ready())
await page.evaluate(() => scrollTo(0, 0))
await pump(3000)
// Reload-free reset: the title's load entrance already ran; for the hub take, reload so it plays on camera.
if (take.reload !== false) {
  await page.reload()
  // Everything is cached now; let it load while page time barely moves, so the title entrance plays on camera.
  for (let i = 0; i < 60 && !(await ready()); i++) { await page.waitForTimeout(200); await page.clock.runFor(16) }
  console.log('ready after reload:', await ready())
  // A take that starts mid-page: put the scroll there and let the scrubs settle before the first frame.
  if (take.keys[0][1] > 0) {
    await page.evaluate((v) => scrollTo(0, v), take.keys[0][1])
    await pump(2500)
  }
}

mkdirSync(OUT, { recursive: true })
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', String(FPS), `${OUT}/${name}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] })

const dur = Math.min(take.keys[take.keys.length - 1][0], maxS)
const frames = Math.round(dur * FPS)
const t0 = Date.now()
for (let f = 0; f < frames; f++) {
  await page.evaluate((v) => scrollTo(0, v), Math.round(yAt(f / FPS)))
  await page.clock.runFor(1000 / FPS)
  const buf = await page.screenshot({ type: 'jpeg', quality: 93 })
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  if (f % 90 === 0) console.log(`${name} ${f}/${frames} ${((Date.now() - t0) / 1000).toFixed(0)}s`)
}
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
await browser.close()
console.log(`${name} done: ${dur}s`)
