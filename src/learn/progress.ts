import { db, type Change } from '../sync/db'
import { FACTS, QUESTIONS, QUESTIONS_FOR_FACT, FACT_BY_ID } from './bank'
import { chapterOfPosition, POSITIONS, positionsOf, STEPS } from './lesson'
import { factsOfSlide, FACT_FILES } from './bank'
import { TOPIC_IDS, TOPIC_NAME, type TopicId } from '../sources'
import type { Question } from './schema'


/**
 * Learning progress: Leitner boxes for every question, the lesson position,
 * what is finished (and whether it was finished after a peek), mastery per
 * fact and a log of every first attempt. All of it lives in the local-first
 * store (src/sync/db.ts), which keeps it on this device and syncs it to the
 * signed-in account.
 */
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
  /** finished positions whose checks were answered after peeking at the step */
  peeked: string[]
}
/** a first attempt: right, wrong, or right after re-opening the step text */
export type Result = boolean | 'peeked'
interface LessonItem {
  done: boolean
  peeked: boolean
}

let cards: Record<string, Card> = {}
let lesson: LessonProgress = { at: POSITIONS[0], done: [], peeked: [] }

function load() {
  cards = db.all<Card>('cards')
  const items = db.all<LessonItem>('lesson')
  const done = Object.keys(items).filter((k) => items[k].done && POSITIONS.includes(k))
  const at = db.get<string>('settings', 'last_position')
  lesson = {
    at: at && POSITIONS.includes(at) ? at : POSITIONS[0],
    done,
    peeked: done.filter((k) => items[k].peeked),
  }
}
load()

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())
// another device's changes (or switching account) arrive through the store
db.subscribe((c: Change) => {
  if (c.source === 'local') return
  if (c.collection === 'all' || c.collection === 'cards' || c.collection === 'lesson' || (c.collection === 'settings' && c.keys.includes('last_position'))) {
    load()
    emit()
  }
})

/** keep the stored per-fact mastery in step with the cards of a question */
function updateMastery(questionId: string) {
  const q = QUESTIONS.find((x) => x.id === questionId)
  if (!q?.factIds.length) return
  db.putMany(
    'mastery',
    q.factIds.map((f) => {
      const score = factScore(f)
      return [f, { score: Math.round(score * 1000) / 1000, mastered: score >= MASTERED }]
    }),
  )
}

/** re-read everything from the store (after an import) and bring per-fact mastery up to date */
export function reloadProgress() {
  load()
  const facts = new Set(Object.keys(cards).flatMap((id) => QUESTIONS.find((q) => q.id === id)?.factIds ?? []))
  db.putMany(
    'mastery',
    [...facts].map((f) => {
      const score = factScore(f)
      return [f, { score: Math.round(score * 1000) / 1000, mastered: score >= MASTERED }]
    }),
  )
  emit()
}

export const progress = {
  subscribe(f: () => void) {
    listeners.add(f)
    return () => void listeners.delete(f)
  },
  card: (id: string): Card | undefined => cards[id],

  /**
   * Leitner: right on the first attempt moves up a box; any miss sends the
   * card back to box 1; right after a peek keeps its box and is due again now.
   * Every call is also logged as an attempt.
   */
  record(id: string, result: Result, now = Date.now()) {
    const c = cards[id] ?? { box: 1, due: now, seen: 0, right: 0 }
    const correct = result === true
    let next: Card
    if (result === 'peeked') next = { ...c, due: now, seen: c.seen + 1 }
    else {
      const box = correct ? Math.min(BOXES, c.seen === 0 ? 2 : c.box + 1) : 1
      next = { box, due: now + INTERVALS[box], seen: c.seen + 1, right: c.right + (correct ? 1 : 0) }
    }
    cards = { ...cards, [id]: next }
    db.put('cards', id, next)
    db.attempt(id, result === 'peeked' ? 'peeked' : correct ? 'right' : 'wrong', now)
    updateMastery(id)
    emit()
  },

  lesson: () => lesson,
  setAt(at: string) {
    if (!POSITIONS.includes(at) || lesson.at === at) return
    lesson = { ...lesson, at }
    db.put('settings', 'last_position', at)
    emit()
  },
  /** `peeked`: its checks were answered after re-opening the step text */
  complete(pos: string, peeked = false) {
    if (lesson.done.includes(pos)) return
    lesson = { ...lesson, done: [...lesson.done, pos], peeked: peeked ? [...lesson.peeked, pos] : lesson.peeked }
    db.put('lesson', pos, { done: true, peeked })
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
    lesson = { at: POSITIONS[0], done: [], peeked: [] }
    db.clear('cards')
    db.clear('lesson')
    db.clear('mastery')
    db.remove('settings', 'last_position')
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

/** the processing ("Make") half of the course: Topics 2–8, complete since Chapter 7 */
export const MAKE_TOPICS: TopicId[] = TOPIC_IDS.filter((t) => ['topic2', 'topic3', 'topic4', 'topic5', 'topic6', 'topic7', 'topic8'].includes(t))
export const MAKE_MINUTES = 40
/**
 * The combined "all processing" paper: four questions from every Make topic
 * (two calculations where the topic has them, the rest recall), seeded.
 */
export function processingPaper(seed: number, perTopic = 4): Question[] {
  let s = seed >>> 0
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  const pick = (arr: Question[], k: number) => [...arr].sort(() => rnd() - 0.5).slice(0, k)
  const out: Question[] = []
  for (const t of MAKE_TOPICS) {
    const pool = QUESTIONS.filter((q) => q.source.topic === t && (q.type === 'calc' || q.type === 'recall'))
    const calcs = pick(pool.filter((q) => q.type === 'calc'), 2)
    out.push(...calcs, ...pick(pool.filter((q) => q.type === 'recall'), perTopic - calcs.length))
  }
  return out.sort((a, b) => a.source.topic.localeCompare(b.source.topic) || a.source.slide - b.source.slide)
}
export const paperTitle = (f: Filter) => (f.topic ? `${TOPIC_NAME[f.topic]} · timed paper` : 'All topics · timed paper')

/** cards that must come between two showings of the same card in a drill */
export const DRILL_GAP = 3

/**
 * The next card of a drill. `recent` lists the ids shown so far this
 * session, latest last. A card shown within the last DRILL_GAP cards waits
 * (a missed card is due again at once, but comes back after a few others);
 * it is only repeated sooner when nothing else is left in the queue.
 */
export function pickNext(list: Question[], recent: string[], gap = DRILL_GAP): Question | null {
  if (!list.length) return null
  const held = new Set(recent.slice(-gap))
  return list.find((q) => !held.has(q.id)) ?? list.find((q) => q.id !== recent[recent.length - 1]) ?? list[0]
}
