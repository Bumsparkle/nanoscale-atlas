import { afterEach, describe, expect, it, vi } from 'vitest'

// @vercel/functions' next() marks "continue to the static file"; stand in for it
vi.mock('@vercel/functions', () => ({ next: () => new Response(null, { headers: { 'x-middleware-next': '1' } }) }))
const { default: middleware, ...rest } = await import('../middleware')

const req = (path: string, password?: string, user = 'any') =>
  new Request('https://atlas.example' + path, password == null ? {} : { headers: { authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64') } })
const passes = (r: Response) => r.headers.get('x-middleware-next') === '1'

afterEach(() => vi.unstubAllEnvs())

describe('site password middleware', () => {
  it('runs on every route: no matcher is exported', () => {
    expect('config' in rest).toBe(false)
  })
  it('fails closed: with no SITE_PASSWORD nothing is served, slides included', () => {
    vi.stubEnv('SITE_PASSWORD', '')
    for (const p of ['/', '/cmos/inverter', '/assets/index.js', '/slides/topic2/slide-01.jpg']) {
      const r = middleware(req(p, 'whatever'))
      expect(r.status, p).toBe(503)
      expect(passes(r)).toBe(false)
    }
  })
  it('asks for credentials on every path, assets and slides included', () => {
    vi.stubEnv('SITE_PASSWORD', 'correct horse')
    for (const p of ['/', '/cmos/inverter/nmos?cut=slide27', '/assets/AtlasShell.js', '/og.png', '/slides/topic2/slide-47.jpg']) {
      const r = middleware(req(p))
      expect(r.status, p).toBe(401)
      expect(r.headers.get('www-authenticate')).toMatch(/^Basic realm=/)
    }
  })
  it('rejects a wrong password and malformed headers', () => {
    vi.stubEnv('SITE_PASSWORD', 'correct horse')
    expect(middleware(req('/slides/topic2/slide-01.jpg', 'battery staple')).status).toBe(401)
    expect(middleware(new Request('https://atlas.example/', { headers: { authorization: 'Basic !!!' } })).status).toBe(401)
    expect(middleware(new Request('https://atlas.example/', { headers: { authorization: 'Bearer correct horse' } })).status).toBe(401)
  })
  it('lets the right password through (any username, colons allowed in the password)', () => {
    vi.stubEnv('SITE_PASSWORD', 'correct:horse')
    expect(passes(middleware(req('/slides/topic2/slide-01.jpg', 'correct:horse', 'felix')))).toBe(true)
    expect(passes(middleware(req('/', 'correct:horse', '')))).toBe(true)
  })
})
