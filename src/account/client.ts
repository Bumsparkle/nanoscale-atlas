import { createBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IS_APP } from '../platform'

/**
 * The Supabase client, one per page.
 *
 * Web: @supabase/ssr keeps the session in the `atlas-auth` cookie (so the
 * Vercel middleware can check it on every request) and finishes magic-link
 * sign-ins from the URL. Mac app: the session lives in the macOS Keychain
 * (src-tauri/src/lib.rs), never in the webview's storage.
 *
 * Only the project URL and the publishable (anon) key are in the bundle;
 * row-level security is what keeps each user's rows to themselves.
 */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
/** where the API lives: the same origin on the web, the deployed site from the Mac app */
export const SITE_URL = IS_APP ? ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/+$/, '') : ''
export const AUTH_COOKIE = 'atlas-auth'
export const configured = () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY

type Invoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>
let invoker: Promise<Invoke> | null = null
const invoke: Invoke = async (cmd, args) => {
  invoker ??= import('@tauri-apps/api/core').then((m) => m.invoke as Invoke)
  return (await invoker)(cmd, args)
}

/** the Keychain, through the app's secret_* commands (an allow-list of item names) */
export const keychain = {
  get: (key: 'session' | 'access') => invoke<string | null>('secret_get', { key }),
  set: (key: 'session' | 'access', value: string) => invoke<void>('secret_set', { key, value }),
  remove: (key: 'session' | 'access') => invoke<void>('secret_delete', { key }),
}

const keychainStorage = {
  getItem: () => keychain.get('session'),
  setItem: (_: string, v: string) => keychain.set('session', v),
  removeItem: () => keychain.remove('session'),
}

let client: SupabaseClient | null = null
export function supabase(): SupabaseClient {
  if (client) return client
  if (IS_APP) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage: keychainStorage, storageKey: 'session', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    })
  } else {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookieOptions: { name: AUTH_COOKIE, path: '/', sameSite: 'lax', secure: location.protocol === 'https:', maxAge: 60 * 60 * 24 * 90 },
      isSingleton: true,
    })
  }
  return client
}

export interface User {
  id: string
  email: string
}

/**
 * Who is signed in. Web: the session from the cookie (refreshed if needed).
 * App: read straight from the Keychain first, so the app opens offline with
 * the last session; the client refreshes it once it is back online.
 */
export async function currentUser(): Promise<User | null> {
  if (!configured()) return null
  if (IS_APP) {
    try {
      const raw = await keychain.get('session')
      const s = raw ? (JSON.parse(raw) as { user?: { id?: string; email?: string } }) : null
      if (s?.user?.id && s.user.email) return { id: s.user.id, email: s.user.email }
    } catch {
      /* no Keychain item */
    }
    return null
  }
  const { data } = await supabase().auth.getSession()
  const u = data.session?.user
  return u?.id && u.email ? { id: u.id, email: u.email } : null
}

/** the access token for API calls: the Mac app sends it as a header; the web has the httpOnly cookie */
async function accessHeader(): Promise<Record<string, string>> {
  if (!IS_APP) return {}
  const t = await keychain.get('access').catch(() => null)
  return t ? { 'x-atlas-access': t } : {}
}

/** a call to this site's API with both gates' credentials */
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase().auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(await accessHeader()) }
  if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`
  return fetch(SITE_URL + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, credentials: 'same-origin' })
}

/** has this device passed the access code? */
export async function hasAccess(): Promise<boolean> {
  if (IS_APP) {
    const t = await keychain.get('access').catch(() => null)
    if (!t) return false
    const exp = Number(t.split('.')[1])
    return exp * 1000 > Date.now()
  }
  try {
    const r = await fetch('/api/access', { credentials: 'same-origin', cache: 'no-store' })
    return r.ok && ((await r.json()) as { access?: boolean }).access === true
  } catch {
    return false
  }
}

/** check the access code with the server; the web gets a cookie, the app a token for its Keychain */
export async function submitCode(code: string): Promise<{ ok: true } | { ok: false; error: string; retryAfter?: number }> {
  let r: Response
  try {
    r = await fetch(SITE_URL + '/api/access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(IS_APP ? { code, app: true } : { code }),
      credentials: 'same-origin',
    })
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection.' }
  }
  const body = (await r.json().catch(() => ({}))) as { error?: string; token?: string; retryAfter?: number }
  if (!r.ok) return { ok: false, error: body.error ?? 'Something went wrong.', retryAfter: body.retryAfter }
  if (IS_APP && body.token) await keychain.set('access', body.token)
  return { ok: true }
}

export const isUclEmail = (email: string) => /^[a-z0-9._%+'-]+@ucl\.ac\.uk$/i.test(email.trim())
