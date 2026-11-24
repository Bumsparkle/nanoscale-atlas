import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from './access'
import { fromB64url } from './crypto'

/**
 * The second gate: a Supabase Auth session for a verified @ucl.ac.uk address.
 *
 * The web client (@supabase/ssr) keeps its session in the `atlas-auth`
 * cookie, split into `atlas-auth.0`, `.1`… when long, as `base64-<json>`.
 * The Mac app sends its access token as `Authorization: Bearer`. Either way
 * the JWT is verified here against the project's signing keys (JWKS), or with
 * SUPABASE_JWT_SECRET on a project still on the legacy shared secret.
 */
export const AUTH_COOKIE = 'atlas-auth'

export const supabaseUrl = (env: Record<string, string | undefined> = process.env) => (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')

export const isUclEmail = (email: unknown) => typeof email === 'string' && /^[a-z0-9._%+'-]+@ucl\.ac\.uk$/i.test(email.trim())

/** the session's access token from the bearer header or the (chunked) auth cookie */
export function readSessionToken(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null
  const jar = cookies(req)
  let raw = jar.get(AUTH_COOKIE) ?? ''
  if (!raw) {
    for (let i = 0; jar.has(`${AUTH_COOKIE}.${i}`); i++) raw += jar.get(`${AUTH_COOKIE}.${i}`)
  }
  if (!raw) return null
  try {
    const json = raw.startsWith('base64-') ? new TextDecoder().decode(fromB64url(raw.slice(7))) : raw
    const s = JSON.parse(json) as { access_token?: unknown }
    return typeof s.access_token === 'string' ? s.access_token : null
  } catch {
    return null
  }
}

export interface SessionUser {
  id: string
  email: string
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()
const jwks = (url: string) => {
  let set = jwksCache.get(url)
  if (!set) jwksCache.set(url, (set = createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`), { cooldownDuration: 60_000, cacheMaxAge: 600_000 })))
  return set
}

export async function verifySession(token: string | null, env: Record<string, string | undefined> = process.env): Promise<SessionUser | null> {
  if (!token) return null
  const url = supabaseUrl(env)
  if (!url) return null
  let payload: JWTPayload
  try {
    const opts = { audience: 'authenticated', clockTolerance: 30 }
    const secret = env.SUPABASE_JWT_SECRET
    const header = JSON.parse(new TextDecoder().decode(fromB64url(token.split('.')[0] ?? ''))) as { alg?: string }
    if (header.alg === 'HS256') {
      if (!secret) return null
      payload = (await jwtVerify(token, new TextEncoder().encode(secret), { ...opts, algorithms: ['HS256'] })).payload
    } else {
      payload = (await jwtVerify(token, jwks(url), { ...opts, algorithms: ['ES256', 'RS256'] })).payload
    }
  } catch {
    return null
  }
  const p = payload as JWTPayload & { email?: unknown; role?: unknown; is_anonymous?: unknown }
  if (p.role !== 'authenticated' || p.is_anonymous === true || typeof p.sub !== 'string') return null
  if (!isUclEmail(p.email)) return null
  return { id: p.sub, email: String(p.email) }
}
