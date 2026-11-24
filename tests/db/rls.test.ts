import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { admin, anon, cleanup, iso, makeUser, type TestUser } from './helpers'

/** Row-level security: a user can read and write only their own rows. */
const TABLES = {
  lesson_progress: (u: string) => ({ user_id: u, position: 'step-1', done: true, peeked: true, updated_at: iso(Date.now()) }),
  revise_cards: (u: string) => ({ user_id: u, question_id: 'q1', box: 3, due: iso(Date.now()), seen: 2, right_count: 2, updated_at: iso(Date.now()) }),
  fact_mastery: (u: string) => ({ user_id: u, fact_id: 'f1', score: 0.8, mastered: true, updated_at: iso(Date.now()) }),
  user_settings: (u: string) => ({ user_id: u, key: 'theme', value: 'light', updated_at: iso(Date.now()) }),
} as const
const KEY = { lesson_progress: 'position', revise_cards: 'question_id', fact_mastery: 'fact_id', user_settings: 'key' } as const

let a: TestUser
let b: TestUser

beforeAll(async () => {
  a = await makeUser('a')
  b = await makeUser('b')
  for (const [t, row] of Object.entries(TABLES)) {
    const { error } = await a.client.from(t).insert(row(a.id) as Record<string, unknown>)
    expect(error, t).toBeNull()
  }
  const { error } = await a.client.from('question_attempts').insert({ id: crypto.randomUUID(), user_id: a.id, question_id: 'q1', result: 'right', answered_at: iso(Date.now()) })
  expect(error).toBeNull()
})
afterAll(cleanup)

describe('row-level security', () => {
  it('each user reads only their own rows', async () => {
    for (const t of [...Object.keys(TABLES), 'question_attempts']) {
      const mine = await a.client.from(t).select('*')
      expect(mine.data?.length, t).toBe(1)
      const theirs = await b.client.from(t).select('*')
      expect(theirs.error, t).toBeNull()
      expect(theirs.data, t).toEqual([])
      const filtered = await b.client.from(t).select('*').eq('user_id', a.id)
      expect(filtered.data, t).toEqual([])
    }
  })

  it("nobody can write rows into another user's account", async () => {
    for (const [t, row] of Object.entries(TABLES)) {
      const { error } = await b.client.from(t).insert({ ...row(a.id), [KEY[t as keyof typeof KEY]]: 'planted' })
      expect(error?.code, t).toBe('42501') // new row violates row-level security policy
    }
    const { error } = await b.client.from('question_attempts').insert({ id: crypto.randomUUID(), user_id: a.id, question_id: 'q', result: 'right', answered_at: iso(Date.now()) })
    expect(error?.code).toBe('42501')
  })

  it("nobody can change or delete another user's rows", async () => {
    for (const t of Object.keys(TABLES)) {
      const up = await b.client.from(t).update({ updated_at: iso(Date.now() + 1000) }).eq('user_id', a.id).select()
      expect(up.data, t).toEqual([])
      const del = await b.client.from(t).delete().eq('user_id', a.id).select()
      expect(del.data, t).toEqual([])
      expect((await a.client.from(t).select('*')).data?.length, t + ' still there').toBe(1)
    }
  })

  it("an upsert can't take over another user's row by its key", async () => {
    const { error } = await b.client.from('user_settings').upsert({ ...TABLES.user_settings(a.id), value: 'dark' }, { onConflict: 'user_id,key' })
    expect(error?.code).toBe('42501')
    expect((await a.client.from('user_settings').select('value')).data).toEqual([{ value: 'light' }])
  })

  it('a row cannot be moved to another user', async () => {
    const { error } = await a.client.from('user_settings').update({ user_id: b.id }).eq('key', 'theme')
    expect(error).not.toBeNull()
  })

  it('attempts are append-only, even for their owner', async () => {
    const up = await a.client.from('question_attempts').update({ result: 'wrong' }).eq('user_id', a.id).select()
    expect(up.error?.code ?? (up.data?.length === 0 ? 'none' : 'updated')).not.toBe('updated')
    const del = await a.client.from('question_attempts').delete().eq('user_id', a.id).select()
    expect(del.error?.code ?? (del.data?.length === 0 ? 'none' : 'deleted')).not.toBe('deleted')
    expect((await a.client.from('question_attempts').select('result')).data).toEqual([{ result: 'right' }])
  })

  it('profiles: read only your own; you may change only the import choice', async () => {
    expect((await b.client.from('profiles').select('*').eq('id', a.id)).data).toEqual([])
    const own = await a.client.from('profiles').select('email').single()
    expect(own.data?.email).toBe(a.email)
    expect((await b.client.from('profiles').update({ local_import: 'declined' }).eq('id', a.id).select()).data).toEqual([])
    expect((await a.client.from('profiles').update({ email: 'x@ucl.ac.uk' }).eq('id', a.id)).error).not.toBeNull()
    expect((await a.client.from('profiles').update({ local_import: 'imported' }).eq('id', a.id)).error).toBeNull()
  })

  it('the signed-out (anon) role can read and write nothing', async () => {
    const c = anon()
    for (const t of [...Object.keys(TABLES), 'question_attempts', 'profiles']) {
      const r = await c.from(t).select('*')
      expect(r.data ?? [], t).toEqual([])
      expect((await c.from(t).insert({} as never)).error, t).not.toBeNull()
    }
  })

  it('the rate-limit functions are for the server only', async () => {
    for (const c of [anon(), a.client]) {
      const r = await c.rpc('access_blocked_for', { p_client: 'x', p_max: 5, p_window_seconds: 60 })
      expect(r.error).not.toBeNull()
      expect((await c.rpc('access_succeeded', { p_client: 'x' })).error).not.toBeNull()
    }
  })

  it('slides: the bucket is private; only the server can sign URLs', async () => {
    const pub = await fetch(`${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/storage/v1/object/public/slides/topic2/slide-01.jpg`)
    expect(pub.ok).toBe(false)
    for (const c of [anon(), a.client]) {
      expect((await c.storage.from('slides').list('topic2')).data ?? []).toEqual([])
      expect((await c.storage.from('slides').download('topic2/slide-01.jpg')).error).not.toBeNull()
      expect((await c.storage.from('slides').createSignedUrl('topic2/slide-01.jpg', 60)).error).not.toBeNull()
    }
    const bucket = await admin.storage.getBucket('slides')
    expect(bucket.data?.public).toBe(false)
  })

  it('deleting an account removes every row of it', async () => {
    const c = await makeUser('gone')
    await c.client.from('user_settings').insert(TABLES.user_settings(c.id))
    await c.client.from('question_attempts').insert({ id: crypto.randomUUID(), user_id: c.id, question_id: 'q', result: 'right', answered_at: iso(Date.now()) })
    await admin.auth.admin.deleteUser(c.id)
    for (const t of [...Object.keys(TABLES), 'question_attempts', 'profiles']) {
      const { count } = await admin.from(t).select('*', { count: 'exact', head: true }).eq(t === 'profiles' ? 'id' : 'user_id', c.id)
      expect(count, t).toBe(0)
    }
  })
})

describe('latest write wins on the server', () => {
  it('an older write never replaces a newer row; a newer one does', async () => {
    const t0 = Date.now()
    await a.client.from('user_settings').upsert({ user_id: a.id, key: 'speed', value: 2, updated_at: iso(t0) }, { onConflict: 'user_id,key' })
    await a.client.from('user_settings').upsert({ user_id: a.id, key: 'speed', value: 0.5, updated_at: iso(t0 - 60_000) }, { onConflict: 'user_id,key' })
    expect((await a.client.from('user_settings').select('value').eq('key', 'speed').single()).data?.value).toBe(2)
    await a.client.from('user_settings').upsert({ user_id: a.id, key: 'speed', value: 1, updated_at: iso(t0 + 1000) }, { onConflict: 'user_id,key' })
    expect((await a.client.from('user_settings').select('value').eq('key', 'speed').single()).data?.value).toBe(1)
  })

  it('a clock far in the future is clamped, so it cannot win forever', async () => {
    await a.client.from('user_settings').upsert({ user_id: a.id, key: 'gowned', value: true, updated_at: iso(Date.now() + 365 * 86_400_000) }, { onConflict: 'user_id,key' })
    const row = (await a.client.from('user_settings').select('updated_at').eq('key', 'gowned').single()).data!
    expect(Date.parse(row.updated_at)).toBeLessThan(Date.now() + 6 * 60_000)
  })
})
