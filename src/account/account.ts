import { create } from 'zustand'
import { db } from '../sync/db'
import { startSync } from '../sync/engine'
import { supabaseRemote } from '../sync/remote'
import { useTheme, type ThemePref } from '../theme/theme'
import { IS_APP } from '../platform'
import { useApp } from '../state/store'
import { api, keychain, supabase, type User } from './client'

/**
 * The signed-in account, once the app is past the gate: opens this user's
 * local store, keeps it syncing, and applies synced settings (theme, speed)
 * when they change on another device.
 */
export const useAccount = create<{ user: User | null }>(() => ({ user: null }))

let sync: ReturnType<typeof startSync> | null = null

export function startAccount(user: User) {
  useAccount.setState({ user })
  db.open(user.id)
  bindTheme()
  sync?.stop()
  sync = startSync(db, supabaseRemote(supabase(), user.id))
  // a sign-out (or a deleted account) in another tab or window
  supabase().auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') leave()
  })
}

export const syncNow = () => sync?.now()

let applying = false
let themeBound = false
function bindTheme() {
  const apply = () => {
    const pref = db.get<ThemePref>('settings', 'theme')
    if (pref && pref !== useTheme.getState().pref) {
      applying = true
      useTheme.getState().setPref(pref)
      applying = false
    }
    const speed = Number(db.get('settings', 'speed'))
    if (speed >= 0.25 && speed <= 2 && speed !== useApp.getState().speed) useApp.getState().set({ speed })
  }
  apply()
  if (themeBound) return
  themeBound = true
  db.subscribe((c) => {
    if (c.source === 'local') return
    if (c.collection === 'settings' || c.collection === 'all') apply()
    // progress from another device: redraw what depends on it
    if (c.collection !== 'settings') {
      const st = useApp.getState()
      st.set({ progressVersion: st.progressVersion + 1 })
    }
  })
  useTheme.subscribe((s, prev) => {
    if (!applying && s.pref !== prev.pref && db.userId) db.put('settings', 'theme', s.pref)
  })
}

/** back to the gate */
function leave() {
  sync?.stop()
  sync = null
  if (IS_APP) location.reload()
  else location.replace('/gate/')
}

/** sign out on this device. The local copy is removed once everything is synced. */
export async function signOut(): Promise<void> {
  await syncNow()?.catch(() => {})
  if (db.pendingCount() === 0) db.wipe()
  await supabase()
    .auth.signOut({ scope: 'local' })
    .catch(() => {})
  if (IS_APP) await keychain.remove('session').catch(() => {})
  leave()
}

/** everything stored about you, from the server and this device, as one JSON file */
export async function exportData(): Promise<Blob> {
  const sb = supabase()
  const tables = ['profiles', 'lesson_progress', 'revise_cards', 'fact_mastery', 'user_settings', 'question_attempts'] as const
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), account: useAccount.getState().user }
  for (const t of tables) {
    const rows: unknown[] = []
    for (let i = 0; ; i += 1000) {
      const { data, error } = await sb.from(t).select('*').range(i, i + 999)
      if (error) {
        out[t] = { error: 'could not be read (offline?)' }
        break
      }
      rows.push(...(data ?? []))
      if ((data?.length ?? 0) < 1000) {
        out[t] = rows
        break
      }
    }
  }
  out.this_device = db.snapshot()
  return new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
}

/** deletes the account on the server (every row goes with it), then this device's copy */
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  let r: Response
  try {
    r = await api('/api/account', { method: 'DELETE' })
  } catch {
    return { ok: false, error: 'Could not reach the server. Deleting needs a connection.' }
  }
  if (!r.ok) return { ok: false, error: ((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not delete the account.' }
  db.wipe()
  sync?.stop()
  await supabase()
    .auth.signOut({ scope: 'local' })
    .catch(() => {})
  if (IS_APP) {
    await keychain.remove('session').catch(() => {})
  }
  leave()
  return { ok: true }
}

/** server-side count of logged attempts (null offline) */
export async function attemptCount(): Promise<number | null> {
  const { count, error } = await supabase().from('question_attempts').select('id', { count: 'exact', head: true })
  return error ? null : (count ?? 0)
}

export async function recordImportChoice(choice: 'imported' | 'declined') {
  const user = useAccount.getState().user
  if (!user) return
  await supabase()
    .from('profiles')
    .update({ local_import: choice, local_import_at: new Date().toISOString() })
    .eq('id', user.id)
    .then(
      () => {},
      () => {},
    )
}
