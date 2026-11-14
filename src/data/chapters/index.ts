import type { Chapter } from '../types'
import { eagle } from './eagle'
import { ingenuity } from './ingenuity'
import { opportunity } from './opportunity'

/** All chapters, in the order they appear on the start page. */
export const chapters: Chapter[] = [eagle, opportunity, ingenuity]

export function getChapter(slug: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.slug === slug)
}
