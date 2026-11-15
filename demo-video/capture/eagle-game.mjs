// Scripted play of "Find the mirrors" (Eagle chapter), recorded in real time with Chrome's screencast.
// (The game's own animation loop does not follow Playwright's fake clock, so capture.mjs's method can't be used.)
// Aims at Apollo 11, 15 and 14 in turn and fires until each one's light comes back.
import { chromium } from 'playwright-core'
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'

const exe = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
const SITES = { 11: [0.6755, 0.476], 14: [0.3385, 0.5125], 15: [0.511, 0.2705] }
const GAME_Y = 12528
const TMP = 'eagle-frames'

const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--window-size=1920,1080', '--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('http://localhost:4173/#/signal/eagle')
await page.waitForTimeout(2000)
for (let y = 0; y <= GAME_Y + 1080; y += 540) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120) }
await page.evaluate((v) => scrollTo(0, v), GAME_Y - 600)
await page.waitForTimeout(2500)

rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP)
const shots = []
const cdp = await page.context().newCDPSession(page)
cdp.on('Page.screencastFrame', async (f) => {
  shots.push({ t: f.metadata.timestamp, data: f.data })
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })

const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
// Scroll the game in, eased, in real time.
for (let i = 1; i <= 45; i++) { await page.evaluate((v) => scrollTo(0, v), Math.round(GAME_Y - 600 + 600 * ease(i / 45))); await page.waitForTimeout(33) }
await page.waitForTimeout(1500)

let cursor = { x: 1500, y: 950 }
await page.mouse.move(cursor.x, cursor.y)
async function moveTo(p, ms) {
  const from = { ...cursor }, n = Math.round(ms / 33)
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n)
    cursor = { x: from.x + (p.x - from.x) * k, y: from.y + (p.y - from.y) * k }
    await page.mouse.move(cursor.x, cursor.y)
    await page.waitForTimeout(33)
  }
}
// Each mirror site found draws a green panel in the "Mirrors found" row.
const foundCount = () => page.evaluate(() => document.querySelectorAll('svg rect[stroke="var(--color-laser)"]').length)
const box = await page.getByLabel('The Moon. Tap a spot', { exact: false }).boundingBox()
let have = 0
for (const n of [11, 15, 14]) {
  const [fx, fy] = SITES[n]
  await moveTo({ x: box.x + fx * box.width, y: box.y + fy * box.height }, 1100)
  await page.waitForTimeout(300)
  for (let shot = 0; shot < 6; shot++) {
    await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up()
    await page.waitForTimeout(3300) // 2.5 s there and back, then the distance counts up
    if ((await foundCount()) > have) break
  }
  have = await foundCount()
  console.log('after', n, 'found', have)
  await page.waitForTimeout(1500)
}
await page.waitForTimeout(3000)
await cdp.send('Page.stopScreencast')
await browser.close()

// Each frame lasts until the next one (the screencast only sends a frame when the picture changes).
const list = []
shots.forEach((s, i) => {
  const f = `${TMP}/${String(i).padStart(5, '0')}.jpg`
  writeFileSync(f, Buffer.from(s.data, 'base64'))
  const d = i + 1 < shots.length ? shots[i + 1].t - s.t : 1 / 30
  list.push(`file '${f.split('/')[1]}'`, `duration ${d.toFixed(4)}`)
})
writeFileSync(`${TMP}/list.txt`, list.join('\n') + '\n')
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}/list.txt`, '-vf', 'fps=30,scale=1920:1080',
  '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '../remotion/public/long/eagle-game.mp4'], { stdio: 'inherit' })
console.log('eagle-game done', shots.length, 'frames over', (shots.at(-1).t - shots[0].t).toFixed(1), 's, ffmpeg', r.status)
