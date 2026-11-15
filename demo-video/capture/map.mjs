// Contact sheet of a page every <step> px, to find where each scene sits. node map.mjs <hash> <step> <out>
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
const [hash = '', step = '500', out = 'map.png'] = process.argv.slice(2)
const exe = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--window-size=1920,1080', '--hide-scrollbars'] })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
// Pass a chapter slug (Git Bash rewrites "#/..." arguments into Windows paths).
await page.goto('http://localhost:4173/' + (hash ? `#/signal/${hash}` : ''))
await page.waitForTimeout(2500)
const h = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const shots = []
for (let y = 0; y <= h; y += Number(step)) {
  await page.evaluate((v) => scrollTo(0, v), y)
  await page.waitForTimeout(900)
  shots.push(await page.screenshot({ type: 'jpeg', quality: 70 }))
}
await browser.close()
const cols = 6, rows = Math.ceil(shots.length / cols)
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', '-', '-vf',
  `scale=400:-1,drawtext=fontfile='C\\:/Windows/Fonts/segoeui.ttf':text='%{eif\\:n*${step}\\:d}':fontsize=40:fontcolor=yellow:box=1:boxcolor=black:x=8:y=180,tile=${cols}x${rows}`,
  '-frames:v', '1', out], { stdio: ['pipe', 'inherit', 'inherit'] })
for (const s of shots) ff.stdin.write(s)
ff.stdin.end()
await new Promise((r) => ff.on('close', r))
console.log(shots.length, 'shots, height', h)
