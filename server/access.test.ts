import { afterEach, describe, expect, it, vi } from 'vitest'
import { access, slides, type Deps } from './handlers'
import { memoryRateStore, MAX_FAILURES, type RateStore } from './ratelimit'
import { verifyAccessToken } from './access'

const CODE = 'tidy-wafer-4417'
const config = { code: CODE, secret: 'a-cookie-secret-that-is-at-least-32-characters' }

function deps(over: Partial<Deps> = {}): Deps & { rate: ReturnType<typeof memoryRateStore> } {
  return { config, rate: memoryRateStore(), db: null, verify: async () => null, now: Date.now, ...over } as never
}
const post = (body: unknown, ip = '203.0.113.7', url = 'https://app.example/api/access') =>
  new Request(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-real-ip': ip }, body: JSON.stringify(body) })

afterEach(() => vi.restoreAllMocks())

describe('/api/access', () => {
  it('rejects a wrong code without setting a cookie', async () => {
    const r = await access(post({ code: 'tidy-wafer-4418' }), deps())
    expect(r.status).toBe(401)
    expect(r.headers.get('set-cookie')).toBeNull()
  })

  it('rate limits: after five wrong codes even the right one is refused, with Retry-After', async () => {
    const d = deps()
    for (let i = 0; i < MAX_FAILURES; i++) expect((await access(post({ code: 'guess' + i }), d)).status).toBe(401)
    const blocked = await access(post({ code: CODE }), d)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(blocked.headers.get('set-cookie')).toBeNull()
    // another client is not affected
    expect((await access(post({ code: CODE }, '198.51.100.2'), d)).status).toBe(200)
  })

  it('stores a keyed hash of the client, never the IP address', async () => {
    const d = deps()
    await access(post({ code: 'nope' }, '203.0.113.99'), d)
    const keys = [...d.rate.failures.keys()]
    expect(keys).toHaveLength(1)
    expect(keys[0]).toMatch(/^[0-9a-f]{32}$/)
    expect(keys[0]).not.toContain('203.0.113.99')
  })

  it('the block lifts after the window', async () => {
    let now = 1_000_000
    const d = deps({ rate: memoryRateStore(() => now) as RateStore })
    for (let i = 0; i < MAX_FAILURES; i++) await access(post({ code: 'x' }), d)
    expect((await access(post({ code: CODE }), d)).status).toBe(429)
    now += 15 * 60 * 1000 + 1
    expect((await access(post({ code: CODE }), d)).status).toBe(200)
  })

  it('a right code sets a signed, httpOnly, Secure, SameSite cookie that verifies', async () => {
    const r = await access(post({ code: `  ${CODE} ` }), deps())
    expect(r.status).toBe(200)
    const c = r.headers.get('set-cookie')!
    expect(c).toMatch(/^atlas_access=v1\.\d+\.[A-Za-z0-9_-]+; Path=\/; Max-Age=\d+; HttpOnly; SameSite=Lax; Secure$/)
    const token = /atlas_access=([^;]+)/.exec(c)![1]
    expect(await verifyAccessToken(token, config)).toBe(true)
    expect(await (await access(new Request('https://app.example/api/access', { headers: { cookie: `atlas_access=${token}` } }), deps())).json()).toEqual({ access: true })
  })

  it('gives the Mac app its token in the body instead of a cookie', async () => {
    const r = await access(post({ code: CODE, app: true }), deps())
    const body = (await r.json()) as { token: string }
    expect(r.headers.get('set-cookie')).toBeNull()
    expect(await verifyAccessToken(body.token, config)).toBe(true)
  })

  it('never puts the code in a response, a header or a log line', async () => {
    const logs: unknown[] = []
    for (const m of ['log', 'info', 'warn', 'error', 'debug'] as const) vi.spyOn(console, m).mockImplementation((...a) => void logs.push(...a))
    const d = deps()
    const out: string[] = []
    for (const body of [{ code: CODE }, { code: CODE, app: true }, { code: 'wrong' }]) {
      const r = await access(post(body), d)
      out.push(await r.text(), JSON.stringify([...r.headers]))
    }
    out.push(await (await access(new Request('https://app.example/api/access'), d)).text())
    expect(out.join('\n')).not.toContain(CODE)
    expect(JSON.stringify(logs)).not.toContain(CODE)
  })

  it('fails closed when not configured or when the rate store is down', async () => {
    expect((await access(post({ code: CODE }), deps({ config: null }))).status).toBe(503)
    const down: RateStore = { blockedFor: async () => Promise.reject(new Error('db down')), failed: async () => {}, succeeded: async () => {} }
    expect((await access(post({ code: CODE }), deps({ rate: down }))).status).toBe(503)
  })

  it('rejects oversized or malformed bodies as a wrong code', async () => {
    expect((await access(post({ code: 'x'.repeat(5000) }), deps())).status).toBe(401)
    const bad = new Request('https://app.example/api/access', { method: 'POST', body: 'not json', headers: { 'x-real-ip': '1.2.3.4' } })
    expect((await access(bad, deps())).status).toBe(401)
  })
})

describe('/api/slides', () => {
  it('needs both gates, even past the middleware', async () => {
    const r = await slides(new Request('https://app.example/api/slides', { method: 'POST', body: '{"paths":["topic2/slide-01.jpg"]}' }), deps())
    expect(r.status).toBe(401)
  })
})
