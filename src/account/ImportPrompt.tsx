import { useState } from 'react'
import { useAccount, recordImportChoice, syncNow } from './account'
import { declineLegacy, importLegacy, legacySummary, shouldOffer } from './legacy'
import { db } from '../sync/db'
import { reloadProgress } from '../learn/progress'
import { useApp } from '../state/store'
import './account.css'

/**
 * First sign-in on a device that has progress from before accounts (kept in
 * this browser only): offer to bring it into the account.
 */
export function ImportPrompt() {
  const user = useAccount((s) => s.user)
  const [legacy, setLegacy] = useState(() => (user ? shouldOffer(user.id) : null))
  const [done, setDone] = useState<string | null>(null)
  if (!user || (!legacy && !done)) return null
  const n = legacy ? legacySummary(legacy) : null

  const accept = () => {
    if (!legacy) return
    const r = importLegacy(db, user.id, legacy)
    reloadProgress()
    const st = useApp.getState()
    st.set({ progressVersion: st.progressVersion + 1 })
    void recordImportChoice('imported')
    void syncNow()
    setLegacy(null)
    setDone(`Imported ${r.cards} card${r.cards === 1 ? '' : 's'} and ${r.done} finished step${r.done === 1 ? '' : 's'} into your account.`)
  }
  const decline = () => {
    declineLegacy(user.id)
    void recordImportChoice('declined')
    setLegacy(null)
  }

  return (
    <div className="acct-import" role="dialog" aria-label="Import progress" data-testid="import-prompt">
      {n ? (
        <>
          <p className="eyebrow">progress found in this browser</p>
          <p>
            This {typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? 'app' : 'browser'} has progress from before accounts: <strong>{n.cards}</strong> Revise card
            {n.cards === 1 ? '' : 's'} and <strong>{n.done}</strong> finished lesson step{n.done === 1 ? '' : 's'}. Add it to {user.email}? Nothing already in your
            account is overwritten.
          </p>
          <div className="acct-actions acct-actions-row">
            <button className="acct-primary" onClick={accept} data-testid="import-accept">
              Import into my account
            </button>
            <button onClick={decline} data-testid="import-decline">
              Start fresh
            </button>
          </div>
        </>
      ) : (
        <>
          <p>{done}</p>
          <div className="acct-actions acct-actions-row">
            <button onClick={() => setDone(null)}>OK</button>
          </div>
        </>
      )}
    </div>
  )
}
