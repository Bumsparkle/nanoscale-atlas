import { LESSON as RAW } from '../../content/topic2/lesson'
import { ChunkSchema, type Chunk } from './schema'

/** the lesson, validated */
export const LESSON: Chunk[] = RAW.map((c) => ChunkSchema.parse(c))
export const CHUNK_BY_ID: Record<string, Chunk> = Object.fromEntries(LESSON.map((c) => [c.id, c]))
export const chunkIndex = (id: string | null) => Math.max(0, LESSON.findIndex((c) => c.id === id))
