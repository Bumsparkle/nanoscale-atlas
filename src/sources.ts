import { z } from 'zod'

/**
 * A reference to a lecture slide. Stored as {topic, slide} everywhere
 * (facts, questions, panels, lesson steps, fab steps) so later chapters can
 * cite their own decks. The slide image is in the private Supabase Storage
 * bucket `slides` at slidePath(ref), never in the repository or a build, and
 * is shown through a short-lived signed URL (src/account/slides.ts).
 */
export const TOPIC_IDS = ['topic2', 'topic3', 'topic4', 'topic5', 'topic6', 'topic7', 'topic8'] as const
export type TopicId = (typeof TOPIC_IDS)[number]
export const TOPIC_NAME: Record<TopicId, string> = { topic2: 'Topic 2', topic3: 'Topic 3', topic4: 'Topic 4', topic5: 'Topic 5', topic6: 'Topic 6', topic7: 'Topic 7', topic8: 'Topic 8' }
/** slides per deck (PDF page = slide) */
export const TOPIC_SLIDES: Record<TopicId, number> = { topic2: 49, topic3: 32, topic4: 21, topic5: 53, topic6: 31, topic7: 22, topic8: 34 }

export const SourceRefSchema = z.object({ topic: z.enum(TOPIC_IDS), slide: z.number().int().min(1) })
export type SourceRef = z.infer<typeof SourceRefSchema>

export const T2 = (slide: number): SourceRef => ({ topic: 'topic2', slide })
export const T3 = (slide: number): SourceRef => ({ topic: 'topic3', slide })
export const T4 = (slide: number): SourceRef => ({ topic: 'topic4', slide })
export const T5 = (slide: number): SourceRef => ({ topic: 'topic5', slide })
export const T6 = (slide: number): SourceRef => ({ topic: 'topic6', slide })
export const T7 = (slide: number): SourceRef => ({ topic: 'topic7', slide })
export const T8 = (slide: number): SourceRef => ({ topic: 'topic8', slide })
export const slidePath = (r: SourceRef) => `${r.topic}/slide-${String(r.slide).padStart(2, '0')}.jpg`
export const sourceLabel = (r: SourceRef) => `${TOPIC_NAME[r.topic]} · slide ${r.slide}`

/** dedupe and order references */
export function uniqueRefs(refs: SourceRef[]): SourceRef[] {
  const seen = new Set<string>()
  return refs
    .filter((r) => {
      const k = r.topic + ':' + r.slide
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((a, b) => (a.topic === b.topic ? a.slide - b.slide : String(a.topic).localeCompare(String(b.topic))))
}
