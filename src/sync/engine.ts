import { create } from 'zustand'
import { COLLECTIONS, type LocalDB } from './db'
import type { Remote } from './remote'

/**
 * One sync pass: push what changed here, then pull what changed elsewhere.
 * Pushing first means a pull never undoes a local change: the server only
 * keeps a row if it is newer than what it has (latest write wins, enforced
 * by a trigger), and mergeRemote only takes a row newer than the local one.
 */
export async function syncOnce(db: LocalDB, remote: Remote) {
  let pushed = 0
  let pulled = 0
  for (const c of COLLECTIONS) {
    const dirty = db.dirty(c)
    if (!dirty.length) continue
    await remote.push(c, dirty)
    db.markPushed(c, dirty)
    pushed += dirty.length
  }
  const attempts = db.pendingAttempts()
  if (attempts.length) {
    await remote.pushAttempts(attempts)
    db.markAttemptsPushed(attempts.map((a) => a.id))
    pushed += attempts.length
  }
  for (const c of COLLECTIONS) {
    const rows = await remote.pull(c, db.cursor(c))
    pulled += db.mergeRemote(c, rows).length
  }
  db.setLastSync(Date.now())
  return { pushed, pulled }
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'
export const useSync = create<{ state: SyncState; last: number | null; pending: number; error: string | null }>(() => ({
  state: 'idle',
  last: null,
  pending: 0,
  error: null,
}))

const online = () => typeof navigator === 'undefined' || navigator.onLine !== false

/**
 * Keep syncing while the page is open: at start, a moment after each local
 * change, when the connection comes back, when the page is hidden or shown
 * again, and once a minute. Offline, changes wait in the local store.
 */
export function startSync(db: LocalDB, remote: Remote, opts: { debounceMs?: number; intervalMs?: number } = {}) {
  const debounce = opts.debounceMs ?? 1500
  let running: Promise<void> | null = null
  let again = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let failures = 0
  let stopped = false

  const run = async (): Promise<void> => {
    if (stopped) return
    if (running) {
      again = true
      return running
    }
    if (!online()) {
      useSync.setState({ state: 'offline', pending: db.pendingCount() })
      return
    }
    useSync.setState({ state: 'syncing' })
    running = (async () => {
      try {
        await syncOnce(db, remote)
        failures = 0
        useSync.setState({ state: 'idle', last: db.lastSync(), pending: db.pendingCount(), error: null })
      } catch (e) {
        failures++
        useSync.setState({ state: online() ? 'error' : 'offline', pending: db.pendingCount(), error: e instanceof Error ? e.message : 'sync failed' })
        // back off: 5 s, 10 s, 20 s … up to 5 minutes
        clearTimeout(timer)
        timer = setTimeout(() => void run(), Math.min(300_000, 5000 * 2 ** (failures - 1)))
      } finally {
        running = null
      }
      if (again) {
        again = false
        await run()
      }
    })()
    return running
  }

  const soon = () => {
    useSync.setState({ pending: db.pendingCount() })
    clearTimeout(timer)
    timer = setTimeout(() => void run(), debounce)
  }
  const unsub = db.subscribe((c) => c.source === 'local' && soon())
  const onOnline = () => void run()
  const onOffline = () => useSync.setState({ state: 'offline' })
  const onVis = () => void run()
  const tick = setInterval(() => void run(), opts.intervalMs ?? 60_000)
  if (typeof window !== 'undefined') {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVis)
  }
  useSync.setState({ last: db.lastSync(), pending: db.pendingCount() })
  void run()
  return {
    now: run,
    stop() {
      stopped = true
      unsub()
      clearTimeout(timer)
      clearInterval(tick)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline)
        window.removeEventListener('offline', onOffline)
        document.removeEventListener('visibilitychange', onVis)
      }
    },
  }
}
