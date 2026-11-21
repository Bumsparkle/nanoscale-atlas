import { useEffect } from 'react'
import { useAtlas } from '../state/store'
import { SPEED_SNAPS, setSpeed } from '../state/timescale'
import { playPause, speedDown, speedUp, stepFab } from './play'

const fmt = (v: number) => (v < 1 ? String(v).replace(/^0/, '') : String(v)) + '×'

/**
 * Fab replay controls, shown only in the Fab view: previous / play-pause /
 * next step, and the replay speed (0.25–2×, snapping at ¼, ½, 1, 2). Keys:
 * [ and ] step the speed, space plays or pauses when the scene has focus.
 * Everything else in the atlas always runs at its natural speed.
 */
export function SpeedBar() {
  const speed = useAtlas((s) => s.speed)
  const playing = useAtlas((s) => s.playing)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t?.closest?.('input, textarea, select')) return
      const st = useAtlas.getState()
      if (st.page !== 'atlas' || st.layer !== 'cell' || st.view !== 'fab') return
      if (e.key === '[') speedDown()
      else if (e.key === ']') speedUp()
      else if (e.key === ' ' && (t === document.body || t?.tagName === 'CANVAS' || t?.closest?.('.stage'))) {
        e.preventDefault()
        playPause()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="speedbar" role="group" aria-label="Fab replay">
      <button className="sb-btn" onClick={() => stepFab(-1)} aria-label="Previous step" title="Previous step (←)">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 1v10M11 1 4 6l7 5z" /></svg>
      </button>
      <button className="sb-btn sb-play" onClick={playPause} aria-label={playing ? 'Pause' : 'Play'} aria-pressed={playing} title={`${playing ? 'Pause' : 'Play'} (space)`} data-testid="play">
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 1 11 6l-8.5 5z" /></svg>
        )}
      </button>
      <button className="sb-btn" onClick={() => stepFab(1)} aria-label="Next step" title="Next step (→)">
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M10 1v10M1 1l7 5-7 5z" /></svg>
      </button>
      <label className="sb-speed">
        <span className="sb-lbl mono">speed</span>
        <span className="sb-track">
          <input type="range" min={-2} max={1} step={0.01} value={Math.log2(speed)} onChange={(e) => setSpeed(2 ** +e.target.value)} aria-label="Replay speed" aria-valuetext={fmt(speed)} data-testid="speed" />
          <span className="sb-ticks" aria-hidden>
            {SPEED_SNAPS.map((s) => (
              <i key={s} style={{ left: `${((Math.log2(s) + 2) / 3) * 100}%` }} className={Math.abs(s - speed) < 1e-6 ? 'on' : ''} />
            ))}
          </span>
        </span>
        <output className="sb-val mono">{fmt(speed)}</output>
      </label>
    </div>
  )
}
