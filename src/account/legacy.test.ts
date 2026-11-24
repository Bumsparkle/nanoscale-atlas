import { describe, expect, it } from 'vitest'
import { LocalDB, type KV } from '../sync/db'
import { syncOnce } from '../sync/engine'
import type { Remote, RemoteRow } from '../sync/remote'
import { decision, declineLegacy, importLegacy, LEGACY_KEYS, readLegacy, shouldOffer } from './legacy'

const kv = (init: Record<string, string> = {}): KV & { data: Map<string, string> } => {
  const data = new Map(Object.entries(init))
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
}
const oldBrowser = () =>
  kv({
    [LEGACY_KEYS.cards]: JSON.stringify({
      'q-a': { box: 3, due: 1000, seen: 4, right: 3 },
      'q-b': { box: 1, due: 2000, seen: 1, right: 0 },
      'q-bad': { box: 9, due: 'x' },
    }),
    [LEGACY_KEYS.lesson]: JSON.stringify({ at: 'review:well', done: ['s1', 's2', 42] }),
    [LEGACY_KEYS.speed]: '0.5',
    [LEGACY_KEYS.gowned]: '1',
    'atlas.theme.v1': 'light',
  })

describe('importing progress from before accounts', () => {
  it('reads only valid old data, and offers nothing when there is none', () => {
    const l = readLegacy(oldBrowser())!
    expect(Object.keys(l.cards)).toEqual(['q-a', 'q-b'])
    expect(l.lesson).toEqual({ at: 'review:well', done: ['s1', 's2'] })
    expect(l.speed).toBe(0.5)
    expect(l.gowned).toBe(true)
    expect(readLegacy(kv({ 'atlas.theme.v1': 'dark' }))).toBeNull()
    expect(readLegacy(kv({ [LEGACY_KEYS.lesson]: JSON.stringify({ at: 's1', done: [] }) }))).toBeNull()
  })

  it('merges into the account without losing what is already there', () => {
    const store = oldBrowser()
    const db = new LocalDB(kv())
    db.open('u1')
    db.put('cards', 'q-a', { box: 5, due: 9, seen: 10, right: 9 }) // the account knows q-a better
    db.put('lesson', 's2', { done: true, peeked: true })
    db.put('settings', 'speed', 2)
    const r = importLegacy(db, 'u1', readLegacy(store)!, store)
    expect(r).toEqual({ cards: 1, done: 1 })
    expect(db.get('cards', 'q-a')).toEqual({ box: 5, due: 9, seen: 10, right: 9 })
    expect(db.get('cards', 'q-b')).toEqual({ box: 1, due: 2000, seen: 1, right: 0 })
    expect(db.get('lesson', 's1')).toEqual({ done: true, peeked: false })
    expect(db.get('lesson', 's2')).toEqual({ done: true, peeked: true })
    expect(db.get('settings', 'last_position')).toBe('review:well')
    expect(db.get('settings', 'speed')).toBe(2)
    expect(db.get('settings', 'gowned')).toBe(true)
  })

  it('retires the old keys and remembers the answer for this user on this device', () => {
    const store = oldBrowser()
    const db = new LocalDB(kv())
    db.open('u1')
    importLegacy(db, 'u1', readLegacy(store)!, store)
    expect(store.getItem(LEGACY_KEYS.cards)).toBeNull()
    expect(store.getItem(LEGACY_KEYS.cards + '.imported')).toContain('q-a')
    expect(decision('u1', store)).toBe('imported')
    expect(shouldOffer('u1', store)).toBeNull()
  })

  it('declining is remembered too, and leaves the old data alone', () => {
    const store = oldBrowser()
    expect(shouldOffer('u2', store)).not.toBeNull()
    declineLegacy('u2', store)
    expect(shouldOffer('u2', store)).toBeNull()
    expect(store.getItem(LEGACY_KEYS.cards)).not.toBeNull()
  })

  it('imported progress syncs up to the account and down to another device', async () => {
    const server: Record<string, Map<string, RemoteRow>> = {}
    let n = 0
    const remote: Remote = {
      async push(c, rows) {
        server[c] ??= new Map()
        for (const { key, item } of rows) server[c].set(key, { key, item, synced: new Date(Date.UTC(2026, 10, 24) + ++n).toISOString() })
      },
      async pull(c) {
        return [...(server[c]?.values() ?? [])]
      },
      async pushAttempts() {},
    }
    const store = oldBrowser()
    const browser = new LocalDB(kv())
    browser.open('u1')
    importLegacy(browser, 'u1', readLegacy(store)!, store)
    await syncOnce(browser, remote)
    expect(server.cards.size).toBe(2)
    const mac = new LocalDB(kv())
    mac.open('u1')
    await syncOnce(mac, remote)
    expect(mac.get('cards', 'q-a')).toEqual({ box: 3, due: 1000, seen: 4, right: 3 })
    expect(mac.get('lesson', 's1')).toEqual({ done: true, peeked: false })
  })
})
