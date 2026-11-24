import { afterAll, describe, expect, it } from 'vitest'
import { admin, anon, cleanup, makeUser } from './helpers'
import { access, defaultDeps } from '../../server/handlers'
import { MAX_FAILURES } from '../../server/ratelimit'

afterAll(cleanup)

describe('sign-up is limited to @ucl.ac.uk, enforced by Supabase Auth', () => {
  const bad = ['someone@gmail.com', 'someone@ucl.ac.uk.evil.com', 'someone@cs.ucl.ac.uk', 'someone@notucl.ac.uk', 'ucl.ac.uk@gmail.com']

  it('magic link / OTP sign-up refuses other addresses', async () => {
    for (const email of bad) {
      const { error } = await anon().auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
      expect(error?.message, email).toMatch(/ucl\.ac\.uk/)
    }
  })

  it('password sign-up refuses other addresses', async () => {
    for (const email of bad) {
      const { error } = await anon().auth.signUp({ email, password: 'a-long-password-123' })
      expect(error?.message, email).toMatch(/ucl\.ac\.uk/)
    }
  })

  it('even the admin API cannot create one (the hook runs for every new user)', async () => {
    const { error } = await admin.auth.admin.createUser({ email: 'someone@gmail.com', password: 'a-long-password-123', email_confirm: true })
    expect(error).not.toBeNull()
  })

  it('a UCL address can sign up, and gets no session until the email is confirmed', async () => {
    const email = `unconfirmed-${Date.now()}@ucl.ac.uk`
    const { data, error } = await anon().auth.signUp({ email, password: 'a-long-password-123' })
    expect(error).toBeNull()
    expect(data.session).toBeNull()
    const signIn = await anon().auth.signInWithPassword({ email, password: 'a-long-password-123' })
    expect(signIn.error?.message).toMatch(/not confirmed/i)
    if (data.user) await admin.auth.admin.deleteUser(data.user.id)
  })

  it('an account cannot change its email to a non-UCL address', async () => {
    const u = await makeUser('change')
    const { error } = await u.client.auth.updateUser({ email: 'someone@gmail.com' })
    expect(error).not.toBeNull()
    const viaAdmin = await admin.auth.admin.updateUserById(u.id, { email: 'someone@gmail.com' })
    expect(viaAdmin.error).not.toBeNull()
  })
})

describe('the access code, with the real rate-limit store', () => {
  it('rejects wrong codes, then blocks, and the block is shared across requests', async () => {
    const d = defaultDeps({ ...process.env, SITE_ACCESS_CODE: 'db-test-code', ACCESS_COOKIE_SECRET: 'x'.repeat(40) })
    const ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`
    const post = (code: string) => new Request('http://localhost/api/access', { method: 'POST', headers: { 'x-real-ip': ip, 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
    for (let i = 0; i < MAX_FAILURES; i++) expect((await access(post('wrong'), d)).status).toBe(401)
    const r = await access(post('db-test-code'), d)
    expect(r.status).toBe(429)
    // a fresh set of deps (another serverless instance) sees the same block
    expect((await access(post('db-test-code'), defaultDeps({ ...process.env, SITE_ACCESS_CODE: 'db-test-code', ACCESS_COOKIE_SECRET: 'x'.repeat(40) }))).status).toBe(429)
  })
})
