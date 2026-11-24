import { useEffect, useRef, useState } from 'react'
import { useAccount, attemptCount, deleteAccount, exportData, signOut, syncNow } from './account'
import { useSync } from '../sync/engine'
import { db } from '../sync/db'
import { POSITIONS } from '../learn/lesson'
import { FACTS, QUESTIONS } from '../learn/bank'
import { factMastered, progress } from '../learn/progress'
import { svg } from '../ui/ThemeIcon'
import { Privacy } from '../gate/PrivacyText'
import { IS_APP } from '../platform'
import '../gate/gate.css'
import './account.css'

/**
 * The account menu: a person icon in the top bar. Who you are, whether your
 * progress is synced, a short summary, and export / sign out / delete.
 */
const Person = () => (
  <svg {...svg}>
    <circle cx="12" cy="8.4" r="3.6" />
    <path d="M4.8 19.6c1.2-3.4 4-5.2 7.2-5.2s6 1.8 7.2 5.2" />
  </svg>
)

const ago = (t: number | null) => {
  if (!t) return 'not yet'
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 45) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return new Date(t).toLocaleDateString()
}

function SyncLine() {
  const { state, last, pending, error } = useSync()
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 20_000)
    return () => clearInterval(t)
  }, [])
  const waiting = pending ? ` · ${pending} change${pending === 1 ? '' : 's'} waiting` : ''
  const text =
    state === 'syncing' ? 'syncing…' : state === 'offline' ? `offline: saved on this device${waiting}` : state === 'error' ? `sync failed, will retry${waiting}` : `synced ${ago(last)}${waiting}`
  return (
    <p className={'acct-sync mono acct-sync-' + state} data-testid="sync-state" data-state={state} title={state === 'error' ? (error ?? '') : undefined}>
      <i aria-hidden /> {text}
    </p>
  )
}

function Summary() {
  const [attempts, setAttempts] = useState<number | null>(null)
  useEffect(() => {
    let live = true
    void attemptCount().then((n) => live && setAttempts(n))
    return () => {
      live = false
    }
  }, [])
  const lesson = progress.lesson()
  const cards = Object.keys(db.all('cards')).length
  const now = Date.now()
  const due = QUESTIONS.filter((q) => {
    const c = progress.card(q.id)
    return c && c.due <= now
  }).length
  const mastered = FACTS.filter((f) => factMastered(f.id)).length
  const rows: [string, string][] = [
    ['lesson', `${lesson.done.length} of ${POSITIONS.length} steps done`],
    ['revise', `${cards} of ${QUESTIONS.length} cards seen · ${due} due`],
    ['facts', `${mastered} of ${FACTS.length} mastered`],
    ['answers', attempts == null ? `${db.recentAttempts().length}+ on this device` : `${attempts} logged`],
  ]
  return (
    <dl className="acct-summary" data-testid="acct-summary">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="mono">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AccountIcon() {
  const user = useAccount((s) => s.user)
  const state = useSync((s) => s.state)
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    void syncNow()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])
  useEffect(() => {
    if (!open) {
      setConfirm(false)
      setTyped('')
      setError(null)
    }
  }, [open])

  if (!user) return null

  const doExport = async () => {
    setBusy('export')
    try {
      const blob = await exportData()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `nanoscale-atlas-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    } catch {
      setError('Export failed. Try again when online.')
    } finally {
      setBusy(null)
    }
  }
  const doSignOut = async () => {
    const pending = db.pendingCount()
    if (pending && !window.confirm(`${pending} change${pending === 1 ? ' has' : 's have'} not synced yet (you are offline). Sign out anyway? They stay on this device until you sign in again.`)) return
    setBusy('signout')
    await signOut()
  }
  const doDelete = async () => {
    setBusy('delete')
    const r = await deleteAccount()
    if (!r.ok) {
      setError(r.error ?? 'Could not delete the account.')
      setBusy(null)
    }
  }

  return (
    <div className="acct" ref={box}>
      <button
        className="top-icon acct-icon"
        data-testid="account-icon"
        data-sync={state}
        aria-label={`Account: ${user.email}`}
        aria-expanded={open}
        title={user.email}
        onClick={() => setOpen(!open)}
      >
        <Person />
      </button>
      {open && (
        <div className="acct-menu" role="dialog" aria-label="Account" data-testid="account-menu">
          <p className="eyebrow">signed in</p>
          <p className="acct-email">{user.email}</p>
          <SyncLine />
          <Summary />
          {!confirm ? (
            <div className="acct-actions">
              <button onClick={doExport} disabled={!!busy} data-testid="export">
                {busy === 'export' ? 'exporting…' : 'Export my data (JSON)'}
              </button>
              {IS_APP ? (
                <button onClick={() => setPrivacy(true)}>Privacy</button>
              ) : (
                <a href="/gate/privacy" target="_blank" rel="noreferrer">
                  Privacy
                </a>
              )}
              <button onClick={doSignOut} disabled={!!busy} data-testid="sign-out">
                {busy === 'signout' ? 'signing out…' : 'Sign out'}
              </button>
              <button className="acct-danger" onClick={() => setConfirm(true)} disabled={!!busy} data-testid="delete-start">
                Delete my account…
              </button>
            </div>
          ) : (
            <div className="acct-confirm">
              <p>This deletes your account and all your synced progress now, and the copy on this device. It can't be undone. Export first if you want a copy.</p>
              <label>
                <span className="mono">type DELETE to confirm</span>
                <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus data-testid="delete-confirm" />
              </label>
              <div className="acct-actions">
                <button className="acct-danger" disabled={typed !== 'DELETE' || !!busy} onClick={doDelete} data-testid="delete-account">
                  {busy === 'delete' ? 'deleting…' : 'Delete my account and data'}
                </button>
                <button onClick={() => setConfirm(false)} disabled={!!busy}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && (
            <p className="acct-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
      {privacy && (
        <div className="gate-scrim acct-privacy" onClick={() => setPrivacy(false)}>
          <article className="gate-privacy" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Privacy">
            <Privacy />
            <button className="home-cta" onClick={() => setPrivacy(false)}>
              Close
            </button>
          </article>
        </div>
      )}
    </div>
  )
}
