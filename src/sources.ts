import { z } from 'zod'

/**
 * A reference to a lecture slide. Stored as {topic, slide} everywhere
 * (facts, questions, panels, lesson steps, fab steps) so later chapters can
 * cite their own decks. The slide image is served from /slides/<topic>/,
 * which is not in the repository and sits behind the site password.
 */
export const TOPIC_IDS = ['topic2'] as const
export type TopicId = (typeof TOPIC_IDS)[number]
export const TOPIC_NAME: Record<TopicId, string> = { topic2: 'Topic 2' }

export const SourceRefSchema = z.object({ topic: z.enum(TOPIC_IDS), slide: z.number().int().min(1) })
export type SourceRef = z.infer<typeof SourceRefSchema>

export const T2 = (slide: number): SourceRef => ({ topic: 'topic2', slide })
export const slideUrl = (r: SourceRef) => `/slides/${r.topic}/slide-${String(r.slide).padStart(2, '0')}.jpg`
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
