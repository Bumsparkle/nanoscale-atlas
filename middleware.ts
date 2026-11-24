import { next } from '@vercel/functions'
import { accessConfig, readAccess, verifyAccessToken } from './server/access.js'
import { cors, preflight } from './server/http.js'
import { readSessionToken, supabaseUrl, verifySession } from './server/session.js'

/**
 * Vercel Routing Middleware: the two gates in front of the whole site.
 * No matcher, so it runs on every request: pages, JS/CSS assets and the API.
 *
 * Public: only the landing page (/gate/, with its own assets under
 * /gate/assets/ and the privacy page), the access-code endpoint, and the
 * favicon, OG image and robots.txt. Everything else needs both
 *   1. a valid access token (the httpOnly atlas_access cookie, or the
 *      x-atlas-access header from the Mac app), and
 *   2. a verified Supabase session for an @ucl.ac.uk address (the atlas-auth
 *      cookie, or a bearer token from the Mac app).
 * A page request without them is sent to the landing page; anything else
 * gets a 401.
 *
 * Fail closed: without SITE_ACCESS_CODE, ACCESS_COOKIE_SECRET and the
 * Supabase URL, nothing behind the gate is served (503).
 */
const PUBLIC_FILES = new Set(['/favicon.svg', '/og.png', '/robots.txt', '/api/access'])
// the gate's own files only: plain names, no dots-in-a-row and no escapes
const GATE = /^\/gate(?:\/(?:[a-z0-9-]+(?:\.html)?|assets\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9]+){1,2})?)?\/?$/

export const isPublic = (path: string) => PUBLIC_FILES.has(path) || GATE.test(path)

const isPage = (req: Request) =>
  req.method === 'GET' && (req.headers.get('sec-fetch-mode') === 'navigate' || (req.headers.get('accept') ?? '').includes('text/html'))

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  if (isPublic(path)) return next()
  if (request.method === 'OPTIONS' && path.startsWith('/api/')) return preflight(request)

  const cfg = accessConfig()
  if (!cfg || !supabaseUrl()) {
    return new Response('This site is not configured: SITE_ACCESS_CODE, ACCESS_COOKIE_SECRET or SUPABASE_URL is not set, so nothing is served.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }

  const hasAccess = await verifyAccessToken(readAccess(request), cfg)
  const user = hasAccess ? await verifySession(readSessionToken(request)) : null
  if (user) return next()

  if (isPage(request)) {
    const to = new URL('/gate/', url)
    if (path !== '/' || url.search) to.searchParams.set('next', path + url.search)
    return new Response(null, { status: 302, headers: { Location: to.pathname + to.search, 'Cache-Control': 'no-store' } })
  }
  return new Response(JSON.stringify({ error: hasAccess ? 'sign-in required' : 'access code required' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(request) },
  })
}
