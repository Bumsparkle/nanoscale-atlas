import { LessonSectionSchema, type LessonSection, type LessonStep } from './schema'

/**
 * The Topic 2 lesson: 15 sections of 3–6 teaching steps, each step followed
 * by its check, each section ending in a mixed mini-review. Section files
 * also export their check questions, which bank.ts adds to the bank.
 */
const modules = import.meta.glob('../../content/topic2/lesson/[0-9]*.ts', { eager: true }) as Record<string, { sections: unknown[] }>

export const SECTIONS: LessonSection[] = Object.keys(modules)
  .sort()
  .flatMap((path) =>
    modules[path].sections.map((raw, i) => {
      const r = LessonSectionSchema.safeParse(raw)
      if (!r.success) throw new Error(`Invalid lesson section ${path} #${i}: ${r.error.message}`)
      return r.data
    }),
  )

export interface FlatStep extends LessonStep {
  section: string
}
export const STEPS: FlatStep[] = SECTIONS.flatMap((s) => s.steps.map((st) => ({ ...st, section: s.id })))
export const STEP_BY_ID: Record<string, FlatStep> = Object.fromEntries(STEPS.map((s) => [s.id, s]))
export const SECTION_BY_ID: Record<string, LessonSection> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]))
export const sectionIndex = (id: string | null) => Math.max(0, SECTIONS.findIndex((s) => s.id === id))
export const stepIndex = (id: string | null) => Math.max(0, STEPS.findIndex((s) => s.id === id))

/** lesson positions: every step, then each section's review */
export const reviewKey = (section: string) => `review:${section}`
export const POSITIONS: string[] = SECTIONS.flatMap((s) => [...s.steps.map((st) => st.id), reviewKey(s.id)])

/** rough minutes for a section: reading at 200 wpm, ¾ min per check, ⅗ min per review question */
export function sectionMinutes(s: LessonSection) {
  const words = s.steps.reduce((n, st) => n + wordCount(st.text) + wordCount(st.example?.text ?? ''), wordCount(s.intro))
  const checks = s.steps.reduce((n, st) => n + st.checks.length, 0)
  return words / 200 + checks * 0.75 + s.review.length * 0.6
}
export const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length
