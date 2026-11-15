import type { Chapter } from '../types'
import { eagle } from './eagle'
import { insight } from './insight'
import { ingenuity } from './ingenuity'
import { opportunity } from './opportunity'
import { sojourner } from './sojourner'

/** All chapters, in the order they appear on the start page. */
export const chapters: Chapter[] = [eagle, opportunity, ingenuity, insight, sojourner]

export function getChapter(slug: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.slug === slug)
}
