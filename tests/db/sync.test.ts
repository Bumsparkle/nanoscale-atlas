import { afterAll, describe, expect, it } from 'vitest'
import { cleanup, makeUser } from './helpers'
import { LocalDB, type KV } from '../../src/sync/db'
import { syncOnce } from '../../src/sync/engine'
import { supabaseRemote, type Remote } from '../../src/sync/remote'
import { importLegacy, LEGACY_KEYS, readLegacy } from '../../src/account/legacy'

/** Sync and import end to end, through the real tables, triggers and RLS. */
afterAll(cleanup)

const kv = (init: Record<string, string> = {}): KV => {
  const m = new Map(Object.entries(init))
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}
/** a remote that can be switched off, as when the laptop loses its connection */
const switchable = (r: Remote) => {
  let online = true
  const guard = <A extends unknown[], T>(f: (...a: A) => Promise<T>) => async (...a: A) => {
    if (!online) throw new TypeError('Failed to fetch')
    return f(...a)
  }
  return { remote: { push: guard(r.push), pull: guard(r.pull), pushAttempts: guard(r.pushAttempts) } as Remote, set: (v: boolean) => void (online = v) }
}

describe('sync against Supabase', () => {
  it('offline, then online: queued changes reach the server; a second device gets them', async () => {
    const u = await makeUser('sync')
    const laptop = new LocalDB(kv())
    laptop.open(u.id)
    const net = switchable(supabaseRemote(u.client, u.id))
    net.set(false)
    laptop.put('cards', 'q-1', { box: 2, due: Date.now() + 86_400_000, seen: 1, right: 1 })
    laptop.put('lesson', 'step-1', { done: true, peeked: true })
    laptop.put('settings', 'theme', 'light')
    laptop.attempt('q-1', 'right')
    await expect(syncOnce(laptop, net.remote)).rejects.toThrow()
    expect(laptop.pendingCount()).toBe(4)
    expect((await u.client.from('revise_cards').select('*')).data).toEqual([])

    net.set(true)
    await syncOnce(laptop, net.remote)
    expect(laptop.pendingCount()).toBe(0)
    expect((await u.client.from('revise_cards').select('box, seen, right_count')).data).toEqual([{ box: 2, seen: 1, right_count: 1 }])
    expect((await u.client.from('lesson_progress').select('done, peeked')).data).toEqual([{ done: true, peeked: true }])
    expect((await u.client.from('question_attempts').select('result')).data).toEqual([{ result: 'right' }])

    const mac = new LocalDB(kv())
    mac.open(u.id)
    await syncOnce(mac, supabaseRemote(u.client, u.id))
    expect(mac.get('cards', 'q-1')).toMatchObject({ box: 2, seen: 1, right: 1 })
    expect(mac.get('settings', 'theme')).toBe('light')
  })

  it('two devices editing offline: latest write wins per item', async () => {
    const u = await makeUser('conflict')
    const r = supabaseRemote(u.client, u.id)
    const web = new LocalDB(kv())
    const mac = new LocalDB(kv())
    web.open(u.id)
    mac.open(u.id)
    const t = Date.now()
    web.put('settings', 'speed', 0.5, t - 2000)
    web.put('settings', 'theme', 'dark', t - 2000)
    mac.put('settings', 'speed', 2, t - 1000) // newer
    await syncOnce(mac, r)
    await syncOnce(web, r)
    await syncOnce(mac, r)
    for (const d of [web, mac]) {
      expect(d.get('settings', 'speed')).toBe(2)
      expect(d.get('settings', 'theme')).toBe('dark')
    }
  })

  it('a retried attempt push never duplicates the log', async () => {
    const u = await makeUser('attempts')
    const r = supabaseRemote(u.client, u.id)
    const d = new LocalDB(kv())
    d.open(u.id)
    const a = d.attempt('q-2', 'wrong')
    await r.pushAttempts([a])
    await r.pushAttempts([a]) // the response was lost the first time
    expect((await u.client.from('question_attempts').select('id')).data).toHaveLength(1)
  })

  it('first sign-in: importing old browser progress puts it in the account', async () => {
    const u = await makeUser('import')
    const store = kv({
      [LEGACY_KEYS.cards]: JSON.stringify({ 'q-a': { box: 4, due: Date.now(), seen: 5, right: 4 } }),
      [LEGACY_KEYS.lesson]: JSON.stringify({ at: 's2', done: ['s1'] }),
    })
    const d = new LocalDB(kv())
    d.open(u.id)
    importLegacy(d, u.id, readLegacy(store)!, store)
    await syncOnce(d, supabaseRemote(u.client, u.id))
    expect((await u.client.from('revise_cards').select('question_id, box')).data).toEqual([{ question_id: 'q-a', box: 4 }])
    expect((await u.client.from('lesson_progress').select('position, done')).data).toEqual([{ position: 's1', done: true }])
    expect((await u.client.from('user_settings').select('key, value')).data).toEqual([{ key: 'last_position', value: 's2' }])
  })
})
