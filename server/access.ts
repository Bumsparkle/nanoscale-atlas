import { b64url, equalBytes, fromB64url, hex, hmac, sha256 } from './crypto.js'

/**
 * The site access code: the first of the two gates (the second is a signed-in
 * Supabase session, see session.ts).
 *
 * SITE_ACCESS_CODE is only ever read from the environment and compared by
 * hash; it is never logged, returned, or put in a token. A correct code earns
 * an access token, `v1.<expiry>.<signature>`, signed with ACCESS_COOKIE_SECRET
 * over the expiry and a fingerprint of the current code, so changing the code
 * (and redeploying) invalidates every token issued for the old one.
 *
 * On the web the token is an httpOnly cookie; the Mac app keeps it in the
 * Keychain and sends it as the x-atlas-access header.
 */
export const ACCESS_COOKIE = 'atlas_access'
export const ACCESS_HEADER = 'x-atlas-access'
export const ACCESS_DAYS = 30
const DAY_S = 86_400

export interface AccessConfig {
  code: string
  secret: string
}

/** null when either variable is missing or the secret is too short: the site then fails closed */
export function accessConfig(env: Record<string, string | undefined> = process.env): AccessConfig | null {
  const code = env.SITE_ACCESS_CODE ?? ''
  const secret = env.ACCESS_COOKIE_SECRET ?? ''
  if (!code.trim() || secret.length < 32) return null
  return { code, secret }
}

const normalise = (code: string) => code.trim()

/** constant-time: compares SHA-256 digests, never the strings */
export async function codeMatches(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256('atlas-code\0' + normalise(given)), sha256('atlas-code\0' + normalise(expected))])
  return equalBytes(a, b)
}

async function fingerprint(cfg: AccessConfig) {
  return hex(await sha256('atlas-code-version\0' + normalise(cfg.code))).slice(0, 16)
}

async function signature(cfg: AccessConfig, exp: number) {
  return hmac(cfg.secret, `atlas-access.v1.${exp}.${await fingerprint(cfg)}`)
}

export async function makeAccessToken(cfg: AccessConfig, now = Date.now()): Promise<{ token: string; expires: number }> {
  const exp = Math.floor(now / 1000) + ACCESS_DAYS * DAY_S
  return { token: `v1.${exp}.${b64url(await signature(cfg, exp))}`, expires: exp }
}

export async function verifyAccessToken(token: string | null | undefined, cfg: AccessConfig, now = Date.now()): Promise<boolean> {
  if (!token) return false
  const m = /^v1\.(\d{1,12})\.([A-Za-z0-9_-]{20,100})$/.exec(token)
  if (!m) return false
  const exp = Number(m[1])
  if (exp * 1000 <= now) return false
  let given: Uint8Array
  try {
    given = fromB64url(m[2])
  } catch {
    return false
  }
  return equalBytes(given, await signature(cfg, exp))
}

export function cookies(req: Request): Map<string, string> {
  const out = new Map<string, string>()
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    if (!k || out.has(k)) continue
    try {
      out.set(k, decodeURIComponent(part.slice(i + 1).trim()))
    } catch {
      out.set(k, part.slice(i + 1).trim())
    }
  }
  return out
}

/** the access token from the cookie (web) or the header (Mac app) */
export function readAccess(req: Request): string | null {
  return req.headers.get(ACCESS_HEADER) || cookies(req).get(ACCESS_COOKIE) || null
}

export function accessCookie(token: string, secure: boolean, maxAge = ACCESS_DAYS * DAY_S) {
  return `${ACCESS_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}
