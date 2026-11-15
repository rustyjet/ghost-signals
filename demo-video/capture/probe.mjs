// Print each page's scroll height and the top of its main blocks, to plan the capture paths.
import { chromium } from 'playwright-core'
const exe = `${process.env.LOCALAPPDATA}/ms-playwright/chromium-1243/chrome-win64/chrome.exe`
const browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--window-size=1920,1080'] })
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
const BASE = 'http://localhost:4173/'
for (const p of ['', '#/signal/opportunity', '#/signal/ingenuity', '#/signal/eagle', '#/signal/insight', '#/signal/sojourner']) {
  await page.goto(BASE + p)
  await page.waitForTimeout(2500)
  const info = await page.evaluate(() => {
    const out = { h: document.documentElement.scrollHeight, y: scrollY, blocks: [] }
    document.querySelectorAll('section, h1, h2, model-viewer, [data-step]').forEach((el) => {
      const r = el.getBoundingClientRect()
      out.blocks.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ${Math.round(r.top + scrollY)} h${Math.round(r.height)} ${(el.textContent || '').trim().slice(0, 50).replace(/\s+/g, ' ')}`)
    })
    return out
  })
  console.log(`\n== ${p || 'hub'} height ${info.h} start ${info.y}`)
  console.log(info.blocks.join('\n'))
}
await browser.close()
