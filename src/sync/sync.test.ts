import { describe, expect, it } from 'vitest'
import { LocalDB, type Attempt, type Collection, type Item, type KV } from './db'
import { syncOnce } from './engine'
import type { Remote, RemoteRow } from './remote'

/** an in-memory server that behaves like the Postgres tables: latest write wins, attempts append-only */
function fakeServer() {
  let clock = Date.parse('2026-11-24T12:00:00Z')
  const tables: Record<Collection, Map<string, RemoteRow>> = { cards: new Map(), lesson: new Map(), mastery: new Map(), settings: new Map() }
  const attempts = new Map<string, Attempt>()
  let online = true
  let loseNextResponse = false
  const net = () => {
    if (!online) throw new TypeError('Failed to fetch')
  }
  const remote: Remote = {
    async push(c, rows) {
      net()
      for (const { key, item } of rows) {
        const cur = tables[c].get(key)
        if (cur && cur.item.t > item.t) continue // the lww_guard trigger
        tables[c].set(key, { key, item: { ...item }, synced: new Date(++clock).toISOString() })
      }
    },
    async pull(c, since) {
      net()
      return [...tables[c].values()].filter((r) => !since || r.synced > new Date(Date.parse(since) - 30_000).toISOString())
    },
    async pushAttempts(list) {
      net()
      for (const a of list) if (!attempts.has(a.id)) attempts.set(a.id, a)
      if (loseNextResponse) {
        loseNextResponse = false
        throw new TypeError('connection reset')
      }
    },
  }
  return {
    remote,
    tables,
    attempts,
    setOnline: (v: boolean) => void (online = v),
    loseNextResponse: () => void (loseNextResponse = true),
  }
}

const memKV = (): KV & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
}
const device = (user = 'u1', kv: KV = memKV()) => {
  const db = new LocalDB(kv)
  db.open(user)
  return db
}

describe('local-first store', () => {
  it('works with no server at all, and keeps everything across a reload', () => {
    const kv = memKV()
    const a = device('u1', kv)
    a.put('cards', 'q1', { box: 2, due: 5, seen: 1, right: 1 })
    a.attempt('q1', 'right')
    const again = device('u1', kv)
    expect(again.get('cards', 'q1')).toEqual({ box: 2, due: 5, seen: 1, right: 1 })
    expect(again.pendingCount()).toBe(2)
    // another user on the same device sees none of it
    expect(device('u2', kv).get('cards', 'q1')).toBeUndefined()
  })
})

describe('sync', () => {
  it('offline, then online: changes wait on the device and go up when the connection returns', async () => {
    const s = fakeServer()
    const db = device()
    s.setOnline(false)
    db.put('lesson', 'step-1', { done: true, peeked: true })
    db.put('settings', 'theme', 'light')
    db.attempt('q1', 'peeked')
    await expect(syncOnce(db, s.remote)).rejects.toThrow()
    expect(db.pendingCount()).toBe(3)
    expect(s.tables.lesson.size).toBe(0)

    s.setOnline(true)
    await syncOnce(db, s.remote)
    expect(db.pendingCount()).toBe(0)
    expect(s.tables.lesson.get('step-1')!.item.v).toEqual({ done: true, peeked: true })
    expect(s.tables.settings.get('theme')!.item.v).toBe('light')
    expect([...s.attempts.values()].map((a) => a.r)).toEqual(['peeked'])
  })

  it('another device gets the changes on its next sync', async () => {
    const s = fakeServer()
    const web = device()
    const mac = device()
    web.put('cards', 'q1', { box: 3, due: 9, seen: 2, right: 2 })
    await syncOnce(web, s.remote)
    await syncOnce(mac, s.remote)
    expect(mac.get('cards', 'q1')).toEqual({ box: 3, due: 9, seen: 2, right: 2 })
  })

  it('conflicts: the latest write wins, item by item', async () => {
    const s = fakeServer()
    const web = device()
    const mac = device()
    // both offline, each changes something; the Mac changes q1 later than the web
    web.put('cards', 'q1', { box: 2, due: 1, seen: 1, right: 1 }, 1000)
    web.put('settings', 'speed', 0.5, 1000)
    mac.put('cards', 'q1', { box: 1, due: 2, seen: 2, right: 1 }, 2000)
    mac.put('settings', 'theme', 'dark', 1500)
    await syncOnce(mac, s.remote)
    await syncOnce(web, s.remote) // its older q1 is refused by the server…
    await syncOnce(mac, s.remote)
    for (const d of [web, mac]) {
      expect(d.get('cards', 'q1')).toEqual({ box: 1, due: 2, seen: 2, right: 1 }) // …and replaced by the newer one
      expect(d.get('settings', 'speed')).toBe(0.5) // different items both survive
      expect(d.get('settings', 'theme')).toBe('dark')
    }
  })

  it('a newer local change is never overwritten by an older one pulled from the server', async () => {
    const s = fakeServer()
    const db = device()
    s.tables.cards.set('q1', { key: 'q1', item: { v: { box: 5, due: 0, seen: 9, right: 9 }, t: 100 }, synced: '2026-11-24T12:00:00.000Z' })
    db.put('cards', 'q1', { box: 1, due: 0, seen: 10, right: 9 }, 200)
    await syncOnce(db, s.remote)
    expect(db.get('cards', 'q1')).toEqual({ box: 1, due: 0, seen: 10, right: 9 })
    expect(s.tables.cards.get('q1')!.item.t).toBe(200)
  })

  it('attempts are append-only: a retried push after a lost response never records one twice', async () => {
    const s = fakeServer()
    const db = device()
    db.attempt('q1', 'wrong')
    db.attempt('q1', 'right')
    s.loseNextResponse()
    await expect(syncOnce(db, s.remote)).rejects.toThrow()
    expect(s.attempts.size).toBe(2) // stored, but the device did not hear back
    await syncOnce(db, s.remote)
    expect(s.attempts.size).toBe(2)
    expect(db.pendingCount()).toBe(0)
  })

  it('a reset (tombstones) reaches the other devices', async () => {
    const s = fakeServer()
    const a = device()
    const b = device()
    a.put('lesson', 'step-1', { done: true, peeked: false })
    await syncOnce(a, s.remote)
    await syncOnce(b, s.remote)
    expect(b.get('lesson', 'step-1')).toBeTruthy()
    a.clear('lesson')
    await syncOnce(a, s.remote)
    await syncOnce(b, s.remote)
    expect(b.get('lesson', 'step-1')).toBeUndefined()
  })

  it('a change made while a push is in flight stays queued', async () => {
    const s = fakeServer()
    const db = device()
    db.put('settings', 'speed', 1)
    const dirty = db.dirty('settings')
    db.put('settings', 'speed', 2) // changed again before the push finished
    await s.remote.push('settings', dirty)
    db.markPushed('settings', dirty)
    expect(db.pendingCount()).toBe(1)
    await syncOnce(db, s.remote)
    expect(s.tables.settings.get('speed')!.item.v).toBe(2)
  })

  it('the cursor only moves forward, and pulls overlap so nothing is missed', async () => {
    const s = fakeServer()
    const db = device()
    await syncOnce(db, s.remote)
    s.tables.mastery.set('f1', { key: 'f1', item: { v: { score: 1, mastered: true }, t: 5 } as Item, synced: '2026-11-24T12:00:10.000Z' })
    await syncOnce(db, s.remote)
    expect(db.cursor('mastery')).toBe('2026-11-24T12:00:10.000Z')
    // committed a little out of order: older synced_at, arrives after the pull
    s.tables.mastery.set('f2', { key: 'f2', item: { v: { score: 0.5, mastered: false }, t: 6 } as Item, synced: '2026-11-24T12:00:00.000Z' })
    await syncOnce(db, s.remote)
    expect(db.get('mastery', 'f2')).toEqual({ score: 0.5, mastered: false })
    expect(db.cursor('mastery')).toBe('2026-11-24T12:00:10.000Z')
  })
})
