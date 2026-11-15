// Fails the build if any story step breaks the writing limits.
// Short copy is a design rule: it is what keeps one idea per screen and makes phones readable.
// Runs the chapter .ts files directly (Node strips the type-only imports).
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const MAX_HEADING_WORDS = 5
const MAX_BODY_CHARS = 150
const MAX_TAGLINE_CHARS = 70
const MAX_LEARN_CHARS = 90
const MAX_GAME_FACT_CHARS = 120
const MAX_SOUND_LABEL_WORDS = 6
const MAX_SOUND_CAPTION_CHARS = 140
const BANNED = [/\bjourney\b/i, /look closer/i, /!/, /\?$/]

const dir = join(import.meta.dirname, '..', 'src', 'data', 'chapters')
const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')
const problems = []

for (const file of files) {
  const mod = await import(pathToFileURL(join(dir, file)).href)
  for (const chapter of Object.values(mod)) {
    if (!chapter?.steps) continue
    if (chapter.tagline.length > MAX_TAGLINE_CHARS)
      problems.push(`${chapter.slug} tagline: ${chapter.tagline.length} chars (max ${MAX_TAGLINE_CHARS})`)
    // The learning line, the closing and the game's real sentence (list of games): short, and no banned patterns
    const extra = [
      ['learn', chapter.learn, MAX_LEARN_CHARS],
      ['closing body', chapter.closing?.body, MAX_BODY_CHARS],
      ['game fact', chapter.game?.fact, MAX_GAME_FACT_CHARS],
    ]
    if (!chapter.learn) problems.push(`${chapter.slug}: no learn line`)
    for (const [what, text, max] of extra) {
      if (!text) continue
      if (text.length > max) problems.push(`${chapter.slug} ${what}: ${text.length} chars (max ${max})`)
      for (const re of BANNED) if (re.test(text)) problems.push(`${chapter.slug} ${what}: uses banned pattern ${re}`)
    }
    if (chapter.closing) {
      const words = chapter.closing.heading.trim().split(/\s+/).length
      if (words > MAX_HEADING_WORDS) problems.push(`${chapter.slug} closing heading: ${words} words (max ${MAX_HEADING_WORDS})`)
    }
    chapter.steps.forEach((s, i) => {
      const where = `${chapter.slug} step ${i + 1} "${s.heading}"`
      const words = s.heading.trim().split(/\s+/).length
      if (words > MAX_HEADING_WORDS) problems.push(`${where}: heading has ${words} words (max ${MAX_HEADING_WORDS})`)
      if (s.body.length > MAX_BODY_CHARS) problems.push(`${where}: body has ${s.body.length} chars (max ${MAX_BODY_CHARS})`)
      for (const re of BANNED) {
        if (re.test(s.heading) || re.test(s.body)) problems.push(`${where}: uses banned pattern ${re}`)
      }
      if (s.sound) {
        const labelWords = s.sound.label.trim().split(/\s+/).length
        if (labelWords > MAX_SOUND_LABEL_WORDS) problems.push(`${where}: sound label has ${labelWords} words (max ${MAX_SOUND_LABEL_WORDS})`)
        if (s.sound.caption.length > MAX_SOUND_CAPTION_CHARS)
          problems.push(`${where}: sound caption has ${s.sound.caption.length} chars (max ${MAX_SOUND_CAPTION_CHARS})`)
        for (const re of BANNED) {
          if (re.test(s.sound.label) || re.test(s.sound.caption)) problems.push(`${where}: sound uses banned pattern ${re}`)
        }
      }
    })
  }
}

if (problems.length) {
  console.error('Copy check failed:\n  ' + problems.join('\n  '))
  process.exit(1)
}
console.log(`Copy check passed (${files.length} chapter file${files.length === 1 ? '' : 's'}).`)
