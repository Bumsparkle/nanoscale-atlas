import factFile from '../../content/topic2/facts.json'
import { FactFileSchema, QuestionSchema, type Fact, type Question } from './schema'

/** The fact inventory and the question bank, validated at load. */
export const FACT_FILE = FactFileSchema.parse(factFile)
export const FACTS: Fact[] = FACT_FILE.facts
export const FACT_BY_ID: Record<string, Fact> = Object.fromEntries(FACTS.map((f) => [f.id, f]))
export const SLIDES = FACT_FILE.slides

const modules = import.meta.glob('../../content/topic2/questions/[0-9]*.ts', { eager: true }) as Record<string, { default: unknown[] }>

export const QUESTIONS: Question[] = Object.keys(modules)
  .sort()
  .flatMap((path) =>
    modules[path].default.map((raw, i) => {
      const r = QuestionSchema.safeParse(raw)
      if (!r.success) throw new Error(`Invalid question ${path} #${i}: ${r.error.message}`)
      return r.data
    }),
  )

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

/** questions testing each fact */
export const QUESTIONS_FOR_FACT: Record<string, Question[]> = Object.fromEntries(FACTS.map((f) => [f.id, QUESTIONS.filter((q) => q.factIds.includes(f.id))]))

/** a fact is key if it is a number, a fab step, a rule, or a truth-table row */
export const isKey = (f: Fact) => f.key
