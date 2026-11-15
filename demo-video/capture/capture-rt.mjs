// Real-time scroll capture with Chrome's screencast, for pages with a 3D model (where capture.mjs's fake clock
// is too slow and crashes the renderer). The page scrolls itself along the same eased keyframes in real time.
// Usage: node capture-rt.mjs <take> [<take> ...]   (site served by `vite preview` on :4173)
import { chromium } from 'playwright-core'
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { TAKES } from './takes.mjs'

const exe = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
const OUT = '../remotion/public/long'

const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--window-size=1920,1080', '--hide-scrollbars'] })
for (const name of process.argv.slice(2)) {
  const take = TAKES[name]
  if (!take) throw new Error(`take? ${Object.keys(TAKES).join(', ')}`)
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const ready = () => page.evaluate(() =>
    [...document.images].every((i) => i.complete) && [...document.querySelectorAll('model-viewer')].every((m) => m.loaded) && document.fonts.status === 'loaded')
  await page.goto('http://localhost:4173/' + take.url)
  await page.waitForTimeout(1500)
  // Pre-pass so lazy pictures load, then reload so the title's entrance plays on camera.
  const last = Math.max(...take.keys.map((k) => k[1]))
  for (let y = 0; y <= last + 1080; y += 540) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(150) }
  for (let i = 0; i < 40 && !(await ready()); i++) await page.waitForTimeout(250)
  await page.reload()
  for (let i = 0; i < 40 && !(await ready()); i++) await page.waitForTimeout(100)
  if (take.keys[0][1] > 0) { await page.evaluate((v) => scrollTo(0, v), take.keys[0][1]); await page.waitForTimeout(2500) }
  else await page.waitForTimeout(300)

  const shots = []
  const cdp = await page.context().newCDPSession(page)
  cdp.on('Page.screencastFrame', async (f) => {
    shots.push({ t: f.metadata.timestamp, data: f.data })
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
  // The scroll path runs inside the page on requestAnimationFrame, so it is as smooth as the page itself.
  await page.evaluate((keys) => new Promise((done) => {
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    const yAt = (t) => {
      if (t <= keys[0][0]) return keys[0][1]
      for (let i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) { const [t0, y0] = keys[i - 1], [t1, y1] = keys[i]; return y0 + (y1 - y0) * ease((t - t0) / (t1 - t0)) }
      }
      return keys[keys.length - 1][1]
    }
    const end = keys[keys.length - 1][0]
    const t0 = performance.now()
    const step = (now) => {
      const t = (now - t0) / 1000
      scrollTo(0, Math.round(yAt(t)))
      if (t < end) requestAnimationFrame(step); else done()
    }
    requestAnimationFrame(step)
  }), take.keys)
  await cdp.send('Page.stopScreencast')
  await page.close()

  const tmp = `frames-${name}`
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp)
  const list = []
  shots.forEach((sh, i) => {
    const f = `${String(i).padStart(5, '0')}.jpg`
    writeFileSync(`${tmp}/${f}`, Buffer.from(sh.data, 'base64'))
    // The screencast sends nothing while the picture is still, so the last frame lasts until the take ends.
    const d = i + 1 < shots.length ? shots[i + 1].t - sh.t : Math.max(1 / 30, shots[0].t + take.keys.at(-1)[0] - sh.t)
    list.push(`file '${f}'`, `duration ${d.toFixed(4)}`)
  })
  writeFileSync(`${tmp}/list.txt`, list.join('\n') + '\n')
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-vf', 'fps=30,scale=1920:1080',
    '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', `${OUT}/${name}.mp4`], { stdio: 'inherit' })
  rmSync(tmp, { recursive: true, force: true })
  const span = shots.length ? shots.at(-1).t - shots[0].t : 0
  console.log(`${name} done: ${shots.length} frames over ${span.toFixed(1)}s (${(shots.length / span).toFixed(0)} fps), ffmpeg ${r.status}`)
}
await browser.close()
