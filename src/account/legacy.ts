import type { LocalDB } from '../sync/db'

/**
 * Progress saved by earlier versions, straight in localStorage and tied to
 * one browser. On the first sign-in on a device that has some, the app offers
 * to bring it into the account (ImportPrompt). Either answer is remembered
 * for this device and user; importing also retires the old keys.
 */
export const LEGACY_KEYS = { cards: 'atlas.leitner.v1', lesson: 'atlas.lesson.v2', speed: 'atlas.speed.v1', gowned: 'atlas.gowned' } as const
export const decisionKey = (user: string) => `atlas.legacy.v1.${user}`

interface LegacyCard {
  box: number
  due: number
  seen: number
  right: number
}
export interface Legacy {
  cards: Record<string, LegacyCard>
  lesson: { at?: string; done: string[] } | null
  speed: number | null
  gowned: boolean
}

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const store = (): KV | null => (typeof localStorage !== 'undefined' ? localStorage : null)

const parse = <T,>(kv: KV, k: string): T | null => {
  try {
    const s = kv.getItem(k)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}

const validCard = (c: unknown): c is LegacyCard => {
  const x = c as LegacyCard
  return !!x && Number.isInteger(x.box) && x.box >= 1 && x.box <= 5 && Number.isFinite(x.due) && Number.isInteger(x.seen) && Number.isInteger(x.right)
}

/** the old progress on this device, or null when there is nothing worth importing */
export function readLegacy(kv: KV | null = store()): Legacy | null {
  if (!kv) return null
  const rawCards = parse<Record<string, unknown>>(kv, LEGACY_KEYS.cards) ?? {}
  const cards: Record<string, LegacyCard> = {}
  for (const [k, v] of Object.entries(rawCards)) if (validCard(v)) cards[k] = v
  const l = parse<{ at?: unknown; done?: unknown }>(kv, LEGACY_KEYS.lesson)
  const lesson = l ? { at: typeof l.at === 'string' ? l.at : undefined, done: Array.isArray(l.done) ? l.done.filter((d): d is string => typeof d === 'string') : [] } : null
  if (!Object.keys(cards).length && !lesson?.done.length) return null
  const speed = Number(kv.getItem(LEGACY_KEYS.speed))
  return { cards, lesson, speed: speed >= 0.25 && speed <= 2 ? speed : null, gowned: kv.getItem(LEGACY_KEYS.gowned) === '1' }
}

export const legacySummary = (l: Legacy) => ({ cards: Object.keys(l.cards).length, done: l.lesson?.done.length ?? 0 })

export function decision(user: string, kv: KV | null = store()): 'imported' | 'declined' | null {
  const v = kv?.getItem(decisionKey(user))
  return v === 'imported' || v === 'declined' ? v : null
}

/** should this device offer the import to this user? */
export function shouldOffer(user: string, kv: KV | null = store()): Legacy | null {
  if (decision(user, kv)) return null
  return readLegacy(kv)
}

/**
 * Merge the old progress into the account's store. Nothing already in the
 * account is lost: a card is taken from the old data only if the account has
 * none or has seen it fewer times; finished lesson positions are added.
 */
export function importLegacy(db: LocalDB, user: string, l: Legacy, kv: KV | null = store()) {
  const cards: [string, unknown][] = []
  for (const [id, c] of Object.entries(l.cards)) {
    const mine = db.get<LegacyCard>('cards', id)
    if (!mine || mine.seen < c.seen) cards.push([id, { box: c.box, due: c.due, seen: c.seen, right: c.right }])
  }
  db.putMany('cards', cards)
  const done = (l.lesson?.done ?? []).filter((p) => !db.get<{ done: boolean }>('lesson', p)?.done)
  db.putMany(
    'lesson',
    done.map((p) => [p, { done: true, peeked: false }]),
  )
  if (l.lesson?.at && db.get('settings', 'last_position') === undefined) db.put('settings', 'last_position', l.lesson.at)
  if (l.speed && db.get('settings', 'speed') === undefined) db.put('settings', 'speed', l.speed)
  if (l.gowned && db.get('settings', 'gowned') === undefined) db.put('settings', 'gowned', true)
  if (kv) {
    try {
      // retire the old keys (kept under another name, in case)
      for (const k of [LEGACY_KEYS.cards, LEGACY_KEYS.lesson]) {
        const v = kv.getItem(k)
        if (v != null) kv.setItem(k + '.imported', v)
        kv.removeItem(k)
      }
      kv.setItem(decisionKey(user), 'imported')
    } catch {
      /* storage blocked */
    }
  }
  return { cards: cards.length, done: done.length }
}

export function declineLegacy(user: string, kv: KV | null = store()) {
  try {
    kv?.setItem(decisionKey(user), 'declined')
  } catch {
    /* storage blocked: asked again next time */
  }
}
