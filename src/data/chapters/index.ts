import type { Chapter } from '../types'
import { opportunity } from './opportunity'

/** All chapters, in the order they appear on the tuner dial. */
export const chapters: Chapter[] = [opportunity]

export function getChapter(slug: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.slug === slug)
}
