import { accessConfig, accessCookie, codeMatches, makeAccessToken, readAccess, verifyAccessToken, type AccessConfig } from './access'
import { hex, hmac } from './crypto'
import { admin, clientIp, json, preflight, smallJson } from './http'
import { supabaseRateStore, type RateStore } from './ratelimit'
import { readSessionToken, verifySession, type SessionUser } from './session'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The API, as plain (Request) => Response handlers. api/*.ts exposes them as
 * Vercel functions; the Vite dev server mounts the same handlers (see
 * scripts/dev-api.ts). Dependencies are injectable so tests can run them
 * without a database.
 */
export interface Deps {
  config: AccessConfig | null
  rate: RateStore | null
  db: SupabaseClient | null
  verify: (token: string | null) => Promise<SessionUser | null>
  now: () => number
}

export function defaultDeps(env: Record<string, string | undefined> = process.env): Deps {
  const db = admin(env)
  return { config: accessConfig(env), rate: db && supabaseRateStore(db), db, verify: (t) => verifySession(t, env), now: Date.now }
}

const unconfigured = (req: Request) => json(req, { error: 'This site is not configured yet.' }, 503)

// ----------------------------------------------------------------- /api/access

/**
 * GET: { access: boolean } for the caller's current token.
 * POST { code, app? }: checks the code (rate limited per client); on success
 * sets the httpOnly cookie, or for the Mac app (app: true) returns the token.
 */
export async function access(req: Request, d: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight(req)
  if (!d.config) return unconfigured(req)
  if (req.method === 'GET') return json(req, { access: await verifyAccessToken(readAccess(req), d.config, d.now()) })
  if (req.method !== 'POST') return json(req, { error: 'method not allowed' }, 405)
  if (!d.rate) return unconfigured(req)

  // a keyed hash of the address: the raw IP is never stored
  const client = hex(await hmac(d.config.secret, 'atlas-rate\0' + clientIp(req))).slice(0, 32)
  let wait: number
  try {
    wait = await d.rate.blockedFor(client)
  } catch {
    return unconfigured(req)
  }
  if (wait > 0) return json(req, { error: 'Too many attempts. Try again later.', retryAfter: wait }, 429, { 'Retry-After': String(wait) })

  const body = await smallJson<{ code?: unknown; app?: unknown }>(req, 1024)
  const code = typeof body?.code === 'string' ? body.code.slice(0, 200) : ''
  if (!code || !(await codeMatches(code, d.config.code))) {
    await d.rate.failed(client).catch(() => {})
    return json(req, { error: 'That access code is not right.' }, 401)
  }
  await d.rate.succeeded(client).catch(() => {})
  const { token, expires } = await makeAccessToken(d.config, d.now())
  if (body?.app === true) return json(req, { access: true, token, expires })
  const secure = new URL(req.url).protocol === 'https:'
  return json(req, { access: true }, 200, { 'Set-Cookie': accessCookie(token, secure) })
}

/** both gates, for the API routes behind them (the middleware checks too; this is belt and braces) */
async function caller(req: Request, d: Deps): Promise<SessionUser | Response> {
  if (!d.config) return unconfigured(req)
  if (!(await verifyAccessToken(readAccess(req), d.config, d.now()))) return json(req, { error: 'access code required' }, 401)
  const user = await d.verify(readSessionToken(req))
  return user ?? json(req, { error: 'sign-in required' }, 401)
}

// ----------------------------------------------------------------- /api/slides

export const SLIDE_URL_SECONDS = 300
const SLIDE_PATH = /^topic\d{1,2}\/slide-\d{2,3}\.jpg$/

/** POST { paths: ["topic2/slide-01.jpg", …] } → { urls: { path: signedUrl }, expiresIn } */
export async function slides(req: Request, d: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'POST') return json(req, { error: 'method not allowed' }, 405)
  const who = await caller(req, d)
  if (who instanceof Response) return who
  if (!d.db) return unconfigured(req)
  const body = await smallJson<{ paths?: unknown }>(req)
  const paths = Array.isArray(body?.paths) ? [...new Set(body.paths.filter((p): p is string => typeof p === 'string' && SLIDE_PATH.test(p)))].slice(0, 40) : []
  if (!paths.length) return json(req, { error: 'no valid slide paths' }, 400)
  const { data, error } = await d.db.storage.from('slides').createSignedUrls(paths, SLIDE_URL_SECONDS)
  if (error) return json(req, { error: 'slides unavailable' }, 502)
  const urls: Record<string, string> = {}
  for (const r of data ?? []) if (r.path && r.signedUrl && !r.error) urls[r.path] = r.signedUrl
  return json(req, { urls, expiresIn: SLIDE_URL_SECONDS })
}

// ---------------------------------------------------------------- /api/account

/** DELETE: deletes the caller's account; every progress row goes with it (on delete cascade) */
export async function account(req: Request, d: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight(req)
  if (req.method !== 'DELETE') return json(req, { error: 'method not allowed' }, 405)
  const who = await caller(req, d)
  if (who instanceof Response) return who
  if (!d.db) return unconfigured(req)
  const { error } = await d.db.auth.admin.deleteUser(who.id)
  if (error) return json(req, { error: 'could not delete the account' }, 502)
  return json(req, { deleted: true })
}
