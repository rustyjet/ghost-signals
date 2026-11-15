import { chapters } from '../data/chapters'

// The stories the reader has read to the end. Stored per browser; the site works without it.
const KEY = 'ghost-signals:patches'

export function getPatches(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function earnPatch(slug: string): string[] {
  const next = Array.from(new Set([...getPatches(), slug]))
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Private windows can refuse storage; the patch still shows for this visit.
  }
  return next
}

/** True once every chapter has been read to its end: then the start page offers the games again, to replay. */
export function finishedEveryStory(): boolean {
  const done = getPatches()
  return chapters.every((c) => done.includes(c.slug))
}
