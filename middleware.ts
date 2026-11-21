import { next } from '@vercel/functions'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Vercel Routing Middleware: HTTP basic auth for the whole site.
 * No matcher, so it runs on every request: pages, JS/CSS assets, the OG
 * image and the lecture slides under /slides/.
 *
 * Fail closed: if SITE_PASSWORD is not set, nothing is served (503), so the
 * slides can never be exposed by a deployment that forgot the variable.
 * Any username is accepted; only the password is checked.
 */
const REALM = 'Nanoscale Atlas'

const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest()
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b))

function passwordFrom(header: string | null): string | null {
  if (!header?.startsWith('Basic ')) return null
  try {
    const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8')
    const i = decoded.indexOf(':')
    return i < 0 ? null : decoded.slice(i + 1)
  } catch {
    return null
  }
}

export default function middleware(request: Request): Response {
  const expected = process.env.SITE_PASSWORD
  if (!expected) {
    return new Response('This site is not configured: SITE_PASSWORD is not set, so nothing (including the lecture slides) is served.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
  const given = passwordFrom(request.headers.get('authorization'))
  if (given == null || !same(given, expected)) {
    return new Response('Password required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
  return next()
}
