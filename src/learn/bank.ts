import t2 from '../../content/topic2/facts.json'
import t3 from '../../content/topic3/facts.json'
import t4 from '../../content/topic4/facts.json'
import { FactFileSchema, QuestionSchema, type Fact, type Question } from './schema'
import type { TopicId } from '../sources'

/** The fact inventories of every topic and the question bank, validated at load. */
export const FACT_FILES = { topic2: FactFileSchema.parse(t2), topic3: FactFileSchema.parse(t3), topic4: FactFileSchema.parse(t4) } as Record<TopicId, ReturnType<typeof FactFileSchema.parse>>
/** Topic 2's file (Chapter 1), as before */
export const FACT_FILE = FACT_FILES.topic2
export const FACTS: Fact[] = Object.values(FACT_FILES).flatMap((f) => f.facts)
export const FACT_BY_ID: Record<string, Fact> = Object.fromEntries(FACTS.map((f) => [f.id, f]))
/** Topic 2's slides (Chapter 1) */
export const SLIDES = FACT_FILE.slides
export const SLIDES_OF = (topic: TopicId) => FACT_FILES[topic].slides
export const factsOfTopic = (topic: TopicId) => FACTS.filter((f) => f.source.topic === topic)
/** facts that a slide teaches, including earlier-topic facts it links to instead of repeating */
export function factsOfSlide(topic: TopicId, slide: number): Fact[] {
  const own = FACTS.filter((f) => f.source.topic === topic && f.source.slide === slide)
  const linked = FACT_FILES[topic].links.filter((l) => l.slide === slide).flatMap((l) => l.facts.map((id) => FACT_BY_ID[id]).filter(Boolean))
  return [...own, ...linked]
}

const modules = import.meta.glob('../../content/topic*/questions/[0-9]*.ts', { eager: true }) as Record<string, { default: unknown[] }>
const lessonModules = import.meta.glob('../../content/topic*/lesson/[0-9]*.ts', { eager: true }) as Record<string, { questions: unknown[] }>

const sources: [string, unknown[]][] = [
  ...Object.keys(modules).sort().map((p): [string, unknown[]] => [p, modules[p].default]),
  ...Object.keys(lessonModules).sort().map((p): [string, unknown[]] => [p, lessonModules[p].questions]),
]

/** the bank: the slide-by-slide questions, then the lessons' step checks */
export const QUESTIONS: Question[] = sources.flatMap(([path, list]) =>
  list.map((raw, i) => {
    const r = QuestionSchema.safeParse(raw)
    if (!r.success) throw new Error(`Invalid question ${path} #${i}: ${r.error.message}`)
    return r.data
  }),
)

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

/** questions testing each fact */
export const QUESTIONS_FOR_FACT: Record<string, Question[]> = Object.fromEntries(FACTS.map((f) => [f.id, QUESTIONS.filter((q) => q.factIds.includes(f.id))]))

export const isKey = (f: Fact) => f.key
