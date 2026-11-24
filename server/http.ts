import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseUrl } from './session.js'

/**
 * The Mac app's webview runs on tauri:// (or http://tauri.localhost), so its
 * calls to the API are cross-origin. Only those origins get CORS headers;
 * the web app is same-origin and needs none.
 */
export const APP_ORIGINS = ['tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost']

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin')
  if (!origin || !APP_ORIGINS.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-atlas-access',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  }
}

export function json(req: Request, body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors(req), ...extra },
  })
}

export const preflight = (req: Request) => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', ...cors(req) } })

/** the service-role client: server only, never sent to a browser */
export function admin(env: Record<string, string | undefined> = process.env): SupabaseClient | null {
  const url = supabaseUrl(env)
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** the caller's address, as Vercel reports it (x-real-ip, else the first x-forwarded-for hop) */
export function clientIp(req: Request): string {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}

/** read a small JSON body; null when it is missing, too large or not JSON */
export async function smallJson<T>(req: Request, max = 4096): Promise<T | null> {
  try {
    const text = await req.text()
    if (text.length > max) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}
