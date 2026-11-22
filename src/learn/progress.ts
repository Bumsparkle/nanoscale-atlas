import { FACTS, QUESTIONS, QUESTIONS_FOR_FACT, FACT_BY_ID } from './bank'
import { chapterOfPosition, POSITIONS, positionsOf, STEPS } from './lesson'
import { factsOfSlide, FACT_FILES } from './bank'
import type { TopicId } from '../sources'
import type { Question } from './schema'

/**
 * Learning progress in localStorage (per browser): Leitner boxes for every
 * question, and the lesson position. Every read and write is guarded, so a
 * private window or blocked storage just means nothing is remembered.
 */
const KEY_L = 'atlas.leitner.v1'
const KEY_LESSON = 'atlas.lesson.v2'
const DAY = 86_400_000
/** box → review interval: box 1 is due again at once, box 5 after three weeks */
export const INTERVALS = [0, 0, DAY, 3 * DAY, 7 * DAY, 21 * DAY]
export const BOXES = 5

export interface Card {
  box: number
  due: number
  seen: number
  right: number
}
export interface LessonProgress {
  /** where you are: a step id, or 'review:<section>' */
  at: string
  /** positions finished (checks answered or their solutions opened) */
  done: string[]
}
/** a first attempt: right, wrong, or right after re-opening the step text */
export type Result = boolean | 'peeked'

const read = <T,>(k: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(k)
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* storage unavailable: progress is just not kept */
  }
}

let cards: Record<string, Card> = read(KEY_L, {})
let lesson: LessonProgress = read(KEY_LESSON, { at: POSITIONS[0], done: [] })
if (!POSITIONS.includes(lesson.at)) lesson = { at: POSITIONS[0], done: lesson.done.filter((d) => POSITIONS.includes(d)) }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())

export const progress = {
  subscribe(f: () => void) {
    listeners.add(f)
    return () => void listeners.delete(f)
  },
  card: (id: string): Card | undefined => cards[id],

  /**
   * Leitner: right on the first attempt moves up a box; any miss sends the
   * card back to box 1; right after a peek keeps its box and is due again now.
   */
  record(id: string, result: Result, now = Date.now()) {
    const c = cards[id] ?? { box: 1, due: now, seen: 0, right: 0 }
    const correct = result === true
    if (result === 'peeked') {
      cards = { ...cards, [id]: { ...c, due: now, seen: c.seen + 1 } }
      write(KEY_L, cards)
      emit()
      return
    }
    const box = correct ? Math.min(BOXES, c.seen === 0 ? 2 : c.box + 1) : 1
    cards = { ...cards, [id]: { box, due: now + INTERVALS[box], seen: c.seen + 1, right: c.right + (correct ? 1 : 0) } }
    write(KEY_L, cards)
    emit()
  },

  lesson: () => lesson,
  setAt(at: string) {
    if (!POSITIONS.includes(at) || lesson.at === at) return
    lesson = { ...lesson, at }
    write(KEY_LESSON, lesson)
    emit()
  },
  complete(pos: string) {
    if (lesson.done.includes(pos)) return
    lesson = { ...lesson, done: [...lesson.done, pos] }
    write(KEY_LESSON, lesson)
    emit()
  },
  /**
   * Furthest position you may open (index into POSITIONS): one past the last
   * finished in sequence, within the chapter of `pos` (each chapter's lesson
   * can be started on its own).
   */
  reachable(pos: string = lesson.at): number {
    const list = positionsOf(chapterOfPosition(pos))
    let i = 0
    while (i < list.length && lesson.done.includes(list[i])) i++
    return POSITIONS.indexOf(list[Math.min(i, list.length - 1)])
  },
  canOpen: (pos: string) => POSITIONS.indexOf(pos) <= progress.reachable(pos),

  reset() {
    cards = {}
    lesson = { at: POSITIONS[0], done: [] }
    write(KEY_L, cards)
    write(KEY_LESSON, lesson)
    emit()
  },
  /** tests */
  _load(c: Record<string, Card>) {
    cards = c
    emit()
  },
}

/** 0 (unknown) … 1 (secure): box 1 → 0, box 4+ → 1 */
export const cardScore = (id: string) => {
  const c = cards[id]
  return c ? Math.min(1, (c.box - 1) / 3) : 0
}
export const MASTERED = 2 / 3

export function factScore(factId: string) {
  const qs = QUESTIONS_FOR_FACT[factId] ?? []
  if (!qs.length) return 0
  return qs.reduce((s, q) => s + cardScore(q.id), 0) / qs.length
}
export const factSeen = (factId: string) => (QUESTIONS_FOR_FACT[factId] ?? []).some((q) => cards[q.id])
export const factMastered = (factId: string) => factScore(factId) >= MASTERED

export interface SlideCoverage {
  slide: number
  facts: number
  mastered: number
  seen: number
  pct: number
}
export function slideCoverage(topic: TopicId = 'topic2'): SlideCoverage[] {
  return FACT_FILES[topic].slides.map(({ slide }) => {
    const fs = factsOfSlide(topic, slide)
    const mastered = fs.filter((f) => factMastered(f.id)).length
    return { slide, facts: fs.length, mastered, seen: fs.filter((f) => factSeen(f.id)).length, pct: fs.length ? mastered / fs.length : 0 }
  })
}

export type Level = 'untested' | 'weak' | 'learning' | 'strong'
/** how well you know the facts about a model object */
export function objectMastery(contentId: string): { level: Level; score: number; facts: string[] } | null {
  const facts = FACTS.filter((f) => f.objects.includes(contentId)).map((f) => f.id)
  if (!facts.length) return null
  if (!facts.some(factSeen)) return { level: 'untested', score: 0, facts }
  const score = facts.reduce((s, f) => s + factScore(f), 0) / facts.length
  return { level: score >= MASTERED ? 'strong' : score >= 0.3 ? 'learning' : 'weak', score, facts }
}

/** the lesson step teaching an object's weakest fact */
export function stepForObject(contentId: string): string | null {
  const m = objectMastery(contentId)
  if (!m) return null
  const weakest = [...m.facts].sort((a, b) => factScore(a) - factScore(b) || FACT_BY_ID[a].source.slide - FACT_BY_ID[b].source.slide)
  for (const f of weakest) {
    const c = STEPS.find((st) => st.factIds.includes(f))
    if (c) return c.id
  }
  return null
}

export interface Filter {
  /** null: every topic */
  topic?: TopicId | null
  from: number
  to: number
  area: string | null
}
export const inFilter = (q: Question, f: Filter) => {
  // a topic narrows to its deck and slide range; no topic means every deck
  if (f.topic && (q.source.topic !== f.topic || q.source.slide < f.from || q.source.slide > f.to)) return false
  if (f.area && !q.factIds.some((id) => FACT_BY_ID[id].area === f.area)) return false
  return true
}

/**
 * Drill order: missed cards first, then unseen ones in lecture order, then
 * the rest that are due, lowest box first. `ahead` includes cards not yet due.
 */
export function queue(f: Filter, now = Date.now(), ahead = false): Question[] {
  const qs = QUESTIONS.filter((q) => inFilter(q, f))
  const rank = (q: Question) => {
    const c = cards[q.id]
    if (!c) return 1
    if (c.box === 1) return 0
    return 1 + c.box
  }
  return qs
    .filter((q) => ahead || !cards[q.id] || cards[q.id].due <= now)
    .sort((a, b) => rank(a) - rank(b) || (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0) || a.source.slide - b.source.slide)
}

export function boxCounts(f: Filter): number[] {
  const out = Array(BOXES + 1).fill(0)
  for (const q of QUESTIONS) if (inFilter(q, f)) out[cards[q.id]?.box ?? 0]++
  return out
}

/** a timed paper: calc and recall only, mixed, seeded so a paper is stable while you sit it */
export function examPaper(seed: number, f: Filter, n = 14): Question[] {
  let s = seed >>> 0
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  const pool = QUESTIONS.filter((q) => inFilter(q, f) && (q.type === 'calc' || q.type === 'recall'))
  const pick = (arr: Question[], k: number) => [...arr].sort(() => rnd() - 0.5).slice(0, k)
  const calcs = pool.filter((q) => q.type === 'calc')
  const recalls = pool.filter((q) => q.type === 'recall')
  const nc = Math.min(calcs.length, Math.round(n * 0.4))
  return [...pick(calcs, nc), ...pick(recalls, n - nc)].sort((a, b) => a.source.topic.localeCompare(b.source.topic) || a.source.slide - b.source.slide)
}
export const EXAM_MINUTES = 20
