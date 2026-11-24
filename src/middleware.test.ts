import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { makeAccessToken } from '../server/access'

// @vercel/functions' next() marks "continue to the static file"; stand in for it
vi.mock('@vercel/functions', () => ({ next: () => new Response(null, { headers: { 'x-middleware-next': '1' } }) }))
const { default: middleware, isPublic, ...rest } = await import('../middleware')

const SECRET = 'a-cookie-secret-that-is-at-least-32-characters'
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'
const CODE = 'correct horse'
const passes = (r: Response) => r.headers.get('x-middleware-next') === '1'

async function jwt(claims: Record<string, unknown> = {}, exp = '1h', secret = JWT_SECRET) {
  return new SignJWT({ role: 'authenticated', email: 'ada@ucl.ac.uk', aud: 'authenticated', ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('11111111-1111-4111-8111-111111111111')
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(secret))
}
const authCookie = (token: string) => 'atlas-auth=base64-' + Buffer.from(JSON.stringify({ access_token: token, refresh_token: 'r' })).toString('base64url')

function req(path: string, o: { access?: string; session?: string; page?: boolean; headers?: Record<string, string>; method?: string } = {}) {
  const cookies = [o.access ? `atlas_access=${o.access}` : '', o.session ? authCookie(o.session) : ''].filter(Boolean).join('; ')
  return new Request('https://atlas.example' + path, {
    method: o.method ?? 'GET',
    headers: { ...(cookies ? { cookie: cookies } : {}), ...(o.page ? { accept: 'text/html', 'sec-fetch-mode': 'navigate' } : {}), ...o.headers },
  })
}

beforeEach(() => {
  vi.stubEnv('SITE_ACCESS_CODE', CODE)
  vi.stubEnv('ACCESS_COOKIE_SECRET', SECRET)
  vi.stubEnv('SUPABASE_URL', 'https://project.supabase.co')
  vi.stubEnv('SUPABASE_JWT_SECRET', JWT_SECRET)
})
afterEach(() => vi.unstubAllEnvs())

const access = async () => (await makeAccessToken({ code: CODE, secret: SECRET })).token

describe('access gate middleware', () => {
  it('runs on every route: no matcher is exported', () => {
    expect('config' in rest).toBe(false)
  })

  it('leaves only the landing page, its assets, the access endpoint and the favicon/OG/robots public', async () => {
    for (const p of ['/gate', '/gate/', '/gate/index.html', '/gate/privacy', '/gate/privacy.html', '/gate/assets/gate-Ab12_c.js', '/gate/assets/ibm-plex-sans-latin-400-normal-x1.woff2', '/api/access', '/favicon.svg', '/og.png', '/robots.txt']) {
      expect(isPublic(p), p).toBe(true)
      expect(passes(await middleware(req(p))), p).toBe(true)
    }
    for (const p of ['/', '/index.html', '/assets/index-abc.js', '/assets/AtlasShell-x.js', '/api/slides', '/api/account', '/cmos/inverter', '/gate/../assets/index.js', '/gate/..%2Fassets/index.js', '/gate/assets/../../assets/x.js', '/gate%2F..%2Fassets/x.js', '/gatex', '/slides/topic2/slide-01.jpg']) {
      expect(isPublic(new URL('https://a.b' + p).pathname), p).toBe(false)
    }
  })

  it('fails closed: without the access code, cookie secret or Supabase URL nothing behind the gate is served', async () => {
    for (const [k, v] of [
      ['SITE_ACCESS_CODE', ''],
      ['ACCESS_COOKIE_SECRET', 'short'],
      ['SUPABASE_URL', ''],
    ]) {
      vi.stubEnv(k, v)
      if (k === 'SUPABASE_URL') vi.stubEnv('VITE_SUPABASE_URL', '')
      const r = await middleware(req('/assets/index.js', { access: await access().catch(() => 'x'), session: await jwt() }))
      expect(r.status, k).toBe(503)
      vi.stubEnv('SITE_ACCESS_CODE', CODE)
      vi.stubEnv('ACCESS_COOKIE_SECRET', SECRET)
      vi.stubEnv('SUPABASE_URL', 'https://project.supabase.co')
    }
  })

  it('sends page requests without both gates to the landing page, keeping where they were going', async () => {
    const r = await middleware(req('/cmos/inverter?view=fab', { page: true }))
    expect(r.status).toBe(302)
    expect(r.headers.get('location')).toBe('/gate/?next=%2Fcmos%2Finverter%3Fview%3Dfab')
    const home = await middleware(req('/', { page: true, access: await access() }))
    expect(home.headers.get('location')).toBe('/gate/')
  })

  it('refuses assets and API calls without both gates (401, never the file)', async () => {
    const a = await access()
    const s = await jwt()
    for (const p of ['/assets/index.js', '/api/slides', '/index.html']) {
      expect((await middleware(req(p))).status, p).toBe(401)
      expect((await middleware(req(p, { access: a }))).status, p + ' access only').toBe(401)
      expect((await middleware(req(p, { session: s }))).status, p + ' session only').toBe(401)
    }
  })

  it('lets a valid access cookie plus a valid UCL session through', async () => {
    expect(passes(await middleware(req('/assets/index.js', { access: await access(), session: await jwt() })))).toBe(true)
    expect(passes(await middleware(req('/', { page: true, access: await access(), session: await jwt() })))).toBe(true)
  })

  it('accepts the Mac app credentials as headers', async () => {
    const r = await middleware(req('/api/slides', { method: 'POST', headers: { 'x-atlas-access': await access(), authorization: `Bearer ${await jwt()}` } }))
    expect(passes(r)).toBe(true)
  })

  it('rejects forged, expired or old-code access tokens', async () => {
    const s = await jwt()
    const good = await access()
    const forged = good.slice(0, -4) + (good.endsWith('AAAA') ? 'BBBB' : 'AAAA')
    const expired = (await makeAccessToken({ code: CODE, secret: SECRET }, Date.now() - 31 * 86_400_000)).token
    const oldCode = (await makeAccessToken({ code: 'the previous code', secret: SECRET })).token
    for (const t of [forged, expired, oldCode, 'v1.9999999999.abc', 'garbage']) expect((await middleware(req('/assets/x.js', { access: t, session: s }))).status, t).toBe(401)
  })

  it('rejects sessions that are expired, wrongly signed, anonymous or not @ucl.ac.uk', async () => {
    const a = await access()
    const bad = [
      await jwt({}, '-1h'),
      await jwt({}, '1h', 'another-secret-another-secret-another-secret'),
      await jwt({ is_anonymous: true }),
      await jwt({ email: 'ada@gmail.com' }),
      await jwt({ email: 'ada@ucl.ac.uk.evil.com' }),
      await jwt({ role: 'anon' }),
      await jwt({ aud: 'other' }),
    ]
    for (const t of bad) expect((await middleware(req('/assets/x.js', { access: a, session: t }))).status).toBe(401)
  })

  it('answers CORS preflights from the Mac app, and only from it', async () => {
    const ok = await middleware(req('/api/slides', { method: 'OPTIONS', headers: { origin: 'tauri://localhost' } }))
    expect(ok.status).toBe(204)
    expect(ok.headers.get('access-control-allow-origin')).toBe('tauri://localhost')
    const other = await middleware(req('/api/slides', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }))
    expect(other.headers.get('access-control-allow-origin')).toBeNull()
  })
})
