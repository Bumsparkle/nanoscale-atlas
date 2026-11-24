/**
 * The local-first store behind all progress: every read and write happens
 * here, synchronously, so the app works the same online, offline, and in the
 * Mac app. The sync engine (engine.ts) pushes local changes to Supabase and
 * pulls changes made on other devices.
 *
 * Conflicts: each item (one Revise card, one lesson position, one fact, one
 * setting) carries the time it was last changed, and the latest change wins,
 * item by item. Deleting is a change too (a tombstone), so a reset reaches
 * every device. Question attempts are an append-only log: pushed once, never
 * changed.
 *
 * Persistence: one localStorage entry per signed-in user
 * (`atlas.db.v1.<user id>`); with no user (tests, before sign-in) it lives in
 * memory only.
 */
export type Collection = 'cards' | 'lesson' | 'mastery' | 'settings'
export const COLLECTIONS: Collection[] = ['cards', 'lesson', 'mastery', 'settings']

export interface Item {
  v: unknown
  /** last changed, ms since epoch */
  t: number
  /** deleted */
  d?: true
}
export type AttemptResult = 'right' | 'wrong' | 'peeked'
export interface Attempt {
  id: string
  q: string
  r: AttemptResult
  t: number
}

interface State {
  v: 1
  items: Record<Collection, Record<string, Item>>
  /** keys changed here and not yet pushed */
  dirty: Record<Collection, string[]>
  /** this device's attempts not yet pushed */
  pending: Attempt[]
  /** recent attempts made on this device (for the summary while offline) */
  recent: Attempt[]
  /** per collection: the server's synced_at of the newest row pulled */
  cursor: Partial<Record<Collection, string>>
  lastSync?: number
}

export interface Change {
  source: 'local' | 'remote' | 'open'
  collection: Collection | 'attempts' | 'all'
  keys: string[]
}

export interface KV {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

const RECENT_MAX = 500
const fresh = (): State => ({
  v: 1,
  items: { cards: {}, lesson: {}, mastery: {}, settings: {} },
  dirty: { cards: [], lesson: [], mastery: [], settings: [] },
  pending: [],
  recent: [],
  cursor: {},
})

const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })

export const dbKey = (user: string) => `atlas.db.v1.${user}`

export class LocalDB {
  private s: State = fresh()
  private user: string | null = null
  private kv: KV | null
  private listeners = new Set<(c: Change) => void>()
  /** a monotonic clock: never stamps two changes with the same or an earlier time */
  private lastT = 0

  constructor(kv?: KV | null) {
    this.kv = kv === undefined ? (typeof localStorage !== 'undefined' ? localStorage : null) : kv
  }

  get userId() {
    return this.user
  }

  /** switch to a user's store (loads what this device already has for them) */
  open(user: string | null) {
    this.user = user
    this.s = fresh()
    if (user && this.kv) {
      try {
        const raw = this.kv.getItem(dbKey(user))
        if (raw) {
          const parsed = JSON.parse(raw) as State
          if (parsed?.v === 1) this.s = { ...fresh(), ...parsed, items: { ...fresh().items, ...parsed.items }, dirty: { ...fresh().dirty, ...parsed.dirty } }
        }
      } catch {
        /* unreadable: start empty, the server copy comes back on the next sync */
      }
    }
    this.emit({ source: 'open', collection: 'all', keys: [] })
  }

  /** forget this user's data on this device (account deleted) */
  wipe() {
    if (this.user && this.kv) {
      try {
        this.kv.removeItem(dbKey(this.user))
      } catch {
        /* nothing stored */
      }
    }
    this.s = fresh()
    this.emit({ source: 'open', collection: 'all', keys: [] })
  }

  subscribe(f: (c: Change) => void) {
    this.listeners.add(f)
    return () => void this.listeners.delete(f)
  }
  private emit(c: Change) {
    this.listeners.forEach((f) => f(c))
  }
  private save() {
    if (!this.user || !this.kv) return
    try {
      this.kv.setItem(dbKey(this.user), JSON.stringify(this.s))
    } catch {
      /* storage full or blocked: kept in memory, and the server has a copy once synced */
    }
  }
  now(t = Date.now()) {
    this.lastT = Math.max(t, this.lastT + 1)
    return this.lastT
  }

  get<T>(c: Collection, key: string): T | undefined {
    const it = this.s.items[c][key]
    return it && !it.d ? (it.v as T) : undefined
  }
  all<T>(c: Collection): Record<string, T> {
    const out: Record<string, T> = {}
    for (const [k, it] of Object.entries(this.s.items[c])) if (!it.d) out[k] = it.v as T
    return out
  }
  item(c: Collection, key: string): Item | undefined {
    return this.s.items[c][key]
  }

  private touch(c: Collection, key: string, it: Item) {
    this.s.items[c][key] = it
    if (!this.s.dirty[c].includes(key)) this.s.dirty[c].push(key)
  }
  put(c: Collection, key: string, v: unknown, t?: number) {
    this.touch(c, key, { v, t: this.now(t) })
    this.save()
    this.emit({ source: 'local', collection: c, keys: [key] })
  }
  /** several puts, one save and one notification */
  putMany(c: Collection, entries: [string, unknown][], t?: number) {
    if (!entries.length) return
    const stamp = this.now(t)
    for (const [k, v] of entries) this.touch(c, k, { v, t: stamp })
    this.save()
    this.emit({ source: 'local', collection: c, keys: entries.map(([k]) => k) })
  }
  remove(c: Collection, key: string, t?: number) {
    if (!this.s.items[c][key] || this.s.items[c][key].d) return
    this.touch(c, key, { v: null, t: this.now(t), d: true })
    this.save()
    this.emit({ source: 'local', collection: c, keys: [key] })
  }
  clear(c: Collection) {
    const keys = Object.keys(this.s.items[c]).filter((k) => !this.s.items[c][k].d)
    if (!keys.length) return
    const t = this.now()
    for (const k of keys) this.touch(c, k, { v: null, t, d: true })
    this.save()
    this.emit({ source: 'local', collection: c, keys })
  }

  attempt(q: string, r: AttemptResult, t?: number): Attempt {
    const a = { id: uuid(), q, r, t: t ?? Date.now() }
    this.s.pending.push(a)
    this.s.recent = [...this.s.recent, a].slice(-RECENT_MAX)
    this.save()
    this.emit({ source: 'local', collection: 'attempts', keys: [a.id] })
    return a
  }
  recentAttempts(): Attempt[] {
    return this.s.recent
  }

  // ------------------------------------------------------------- for the sync engine

  dirty(c: Collection): { key: string; item: Item }[] {
    return this.s.dirty[c].filter((k) => this.s.items[c][k]).map((key) => ({ key, item: { ...this.s.items[c][key] } }))
  }
  /** pushed: clear the dirty mark, unless the item changed again meanwhile */
  markPushed(c: Collection, pushed: { key: string; item: Item }[]) {
    const done = new Set(pushed.filter(({ key, item }) => this.s.items[c][key]?.t === item.t).map(({ key }) => key))
    this.s.dirty[c] = this.s.dirty[c].filter((k) => !done.has(k))
    this.save()
  }
  pendingAttempts(): Attempt[] {
    return [...this.s.pending]
  }
  markAttemptsPushed(ids: string[]) {
    const s = new Set(ids)
    this.s.pending = this.s.pending.filter((a) => !s.has(a.id))
    this.save()
  }
  pendingCount() {
    return COLLECTIONS.reduce((n, c) => n + this.s.dirty[c].length, 0) + this.s.pending.length
  }
  cursor(c: Collection) {
    return this.s.cursor[c] ?? null
  }

  /** rows from the server: each replaces the local item only if it is newer */
  mergeRemote(c: Collection, rows: { key: string; item: Item; synced: string }[]): string[] {
    const changed: string[] = []
    let cursor = this.s.cursor[c] ?? ''
    for (const { key, item, synced } of rows) {
      if (synced > cursor) cursor = synced
      const local = this.s.items[c][key]
      if (local && local.t >= item.t) continue
      this.s.items[c][key] = item
      this.s.dirty[c] = this.s.dirty[c].filter((k) => k !== key)
      changed.push(key)
    }
    if (cursor) this.s.cursor[c] = cursor
    this.save()
    if (changed.length) this.emit({ source: 'remote', collection: c, keys: changed })
    return changed
  }
  setLastSync(t: number) {
    this.s.lastSync = t
    this.save()
  }
  lastSync() {
    return this.s.lastSync ?? null
  }

  /** everything this device holds, for "export my data" */
  snapshot() {
    return JSON.parse(JSON.stringify(this.s)) as State
  }
}

/** the app's store (one per page) */
export const db = new LocalDB()
