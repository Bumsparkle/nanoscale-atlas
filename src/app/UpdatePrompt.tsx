import { useEffect, useState } from 'react'
import './update.css'

type Update = Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>>

/**
 * Desktop app only: on launch, ask the latest GitHub Release whether a newer
 * signed build exists, and offer to install it. Quietly does nothing when
 * offline or already up to date.
 */
export default function UpdatePrompt() {
  const [update, setUpdate] = useState<NonNullable<Update> | null>(null)
  const [state, setState] = useState<'offer' | 'downloading' | 'failed'>('offer')
  const [pct, setPct] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let live = true
    const t = setTimeout(async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const u = await check()
        if (live && u) setUpdate(u)
      } catch {
        /* offline, or no release yet: try again next launch */
      }
    }, 2500)
    return () => {
      live = false
      clearTimeout(t)
    }
  }, [])

  if (!update || hidden) return null

  const install = async () => {
    setState('downloading')
    try {
      let total = 0
      let got = 0
      await update.downloadAndInstall((e) => {
        if (e.event === 'Started') total = e.data.contentLength ?? 0
        if (e.event === 'Progress') {
          got += e.data.chunkLength
          if (total) setPct(Math.round((got / total) * 100))
        }
      })
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch {
      setState('failed')
    }
  }

  return (
    <aside className="update" role="status" aria-live="polite">
      <p>
        <span className="eyebrow">update</span> Nanoscale Atlas {update.version} is available
        {update.currentVersion ? <span className="update-from mono"> (you have {update.currentVersion})</span> : null}.
      </p>
      {state === 'offer' && (
        <div className="update-actions">
          <button className="lp-next" onClick={install}>
            Update and restart
          </button>
          <button className="chip" onClick={() => setHidden(true)}>
            Later
          </button>
        </div>
      )}
      {state === 'downloading' && <p className="mono update-progress">downloading… {pct ? pct + '%' : ''}</p>}
      {state === 'failed' && (
        <p className="update-failed">
          The update could not be installed. It will be offered again next launch.{' '}
          <button className="chip" onClick={() => setHidden(true)}>
            Close
          </button>
        </p>
      )}
    </aside>
  )
}
