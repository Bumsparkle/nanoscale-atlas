/**
 * The two public Supabase values the client build needs. Vercel's Supabase
 * integration provides them under its own names (SUPABASE_URL,
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, …); copy them to the VITE_ names
 * Vite exposes, unless those are set. Only the URL and the publishable/anon
 * key: never a secret or service-role key.
 */
export function publicSupabaseEnv(env: Record<string, string | undefined>) {
  const first = (...k: string[]) => k.map((x) => env[x]).find((v) => v)
  process.env.VITE_SUPABASE_URL ??= first('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  process.env.VITE_SUPABASE_ANON_KEY ??= first('VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')
  for (const k of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) if (!process.env[k]) delete process.env[k]
}
