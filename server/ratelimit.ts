import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Failed access-code attempts, counted per client in Postgres (shared by all
 * serverless instances). See public.access_blocked_for in the migrations.
 */
export const MAX_FAILURES = 5
export const WINDOW_SECONDS = 15 * 60

export interface RateStore {
  /** seconds until the client may try again; 0 = allowed */
  blockedFor(client: string): Promise<number>
  failed(client: string): Promise<void>
  succeeded(client: string): Promise<void>
}

export function supabaseRateStore(db: SupabaseClient): RateStore {
  const call = async (fn: string, args: object) => {
    const { data, error } = await db.rpc(fn, args)
    if (error) throw new Error(`rate limit store: ${error.code ?? 'error'}`)
    return data
  }
  return {
    blockedFor: async (client) => Number(await call('access_blocked_for', { p_client: client, p_max: MAX_FAILURES, p_window_seconds: WINDOW_SECONDS })) || 0,
    failed: async (client) => void (await call('access_failed', { p_client: client })),
    succeeded: async (client) => void (await call('access_succeeded', { p_client: client })),
  }
}

/** in memory, for tests */
export function memoryRateStore(now = () => Date.now()): RateStore & { failures: Map<string, number[]> } {
  const failures = new Map<string, number[]>()
  const recent = (c: string) => (failures.get(c) ?? []).filter((t) => t > now() - WINDOW_SECONDS * 1000)
  return {
    failures,
    async blockedFor(c) {
      const r = recent(c)
      return r.length < MAX_FAILURES ? 0 : Math.max(1, Math.ceil((r[0] + WINDOW_SECONDS * 1000 - now()) / 1000))
    },
    async failed(c) {
      failures.set(c, [...recent(c), now()])
    },
    async succeeded(c) {
      failures.delete(c)
    },
  }
}
