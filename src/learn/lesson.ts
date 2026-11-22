import { LessonSectionSchema, type LessonSection, type LessonStep } from './schema'
import type { ChapterId } from '../chapters/cmos/layers'

/**
 * The lessons, one per chapter: Topic 2 → Chapter 1, Topic 3 → Chapter 2,
 * Topic 4 → Chapter 3. Each is a run of sections of 3–6 teaching steps, each
 * step followed by its check, each section ending in a mixed mini-review.
 * Section files also export their check questions, which bank.ts adds.
 */
const modules = import.meta.glob('../../content/topic*/lesson/[0-9]*.ts', { eager: true }) as Record<string, { sections: unknown[] }>
const CHAPTER_OF_TOPIC: Record<string, ChapterId> = { topic2: 'ch1', topic3: 'ch2', topic4: 'ch3' }

export type Section = LessonSection & { chapter: ChapterId }
export const SECTIONS: Section[] = Object.keys(modules)
  .sort()
  .flatMap((path) =>
    modules[path].sections.map((raw, i) => {
      const r = LessonSectionSchema.safeParse(raw)
      if (!r.success) throw new Error(`Invalid lesson section ${path} #${i}: ${r.error.message}`)
      return { ...r.data, chapter: CHAPTER_OF_TOPIC[path.match(/topic\d/)![0]] }
    }),
  )
export const sectionsOf = (ch: ChapterId) => SECTIONS.filter((s) => s.chapter === ch)

export interface FlatStep extends LessonStep {
  section: string
  chapter: ChapterId
}
export const STEPS: FlatStep[] = SECTIONS.flatMap((s) => s.steps.map((st) => ({ ...st, section: s.id, chapter: s.chapter })))
export const STEP_BY_ID: Record<string, FlatStep> = Object.fromEntries(STEPS.map((s) => [s.id, s]))
export const SECTION_BY_ID: Record<string, Section> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))
export const sectionIndex = (id: string | null) => Math.max(0, SECTIONS.findIndex((s) => s.id === id))
export const stepIndex = (id: string | null) => Math.max(0, STEPS.findIndex((s) => s.id === id))

/** lesson positions: every step, then each section's review */
export const reviewKey = (section: string) => `review:${section}`
export const POSITIONS: string[] = SECTIONS.flatMap((s) => [...s.steps.map((st) => st.id), reviewKey(s.id)])
export const chapterOfPosition = (pos: string): ChapterId =>
  (pos.startsWith('review:') ? SECTION_BY_ID[pos.slice(7)] : SECTION_BY_ID[STEP_BY_ID[pos]?.section])?.chapter ?? 'ch1'
export const positionsOf = (ch: ChapterId) => POSITIONS.filter((p) => chapterOfPosition(p) === ch)

/** rough minutes for a section: reading at 200 wpm, ¾ min per check, ⅗ min per review question */
export function sectionMinutes(s: LessonSection) {
  const words = s.steps.reduce((n, st) => n + wordCount(st.text) + wordCount(st.example?.text ?? ''), wordCount(s.intro))
  const checks = s.steps.reduce((n, st) => n + st.checks.length, 0)
  return words / 200 + checks * 0.75 + s.review.length * 0.6
}
export const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length
