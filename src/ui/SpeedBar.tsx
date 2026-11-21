import { useEffect } from 'react'
import { useAtlas } from '../state/store'
import { SPEED_SNAPS, setSpeed } from '../state/timescale'
import { isRunning, playPause, speedDown, speedUp, stepContent } from './play'

const fmt = (v: number) => (v < 1 ? String(v).replace(/^0/, '') : String(v)) + '×'

/**
 * The global animation speed (0.25–2×, snapping at ¼, ½, 1, 2) with play /
 * pause and step buttons. Keys: [ and ] step the speed, space plays or
 * pauses when the scene has focus. Under reduced motion the scene starts
 * paused and the step buttons are shown.
 */
export function SpeedBar() {
  const speed = useAtlas((s) => s.speed)
  // subscribe to everything isRunning() reads
  const paused = useAtlas((s) => s.paused)
  const playing = useAtlas((s) => s.playing)
  const view = useAtlas((s) => s.view)
  const layer = useAtlas((s) => s.layer)
  const reduced = useAtlas((s) => s.reducedMotion)
  void paused
  void playing
  const running = isRunning()
  const fab = view === 'fab' && layer === 'cell'
  const showStep = !running || reduced || fab

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t?.closest?.('input, textarea, select')) return
      if (useAtlas.getState().page !== 'atlas') return
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

  const pos = Math.log2(speed) // −2 … 1
  return (
    <div className="speedbar" role="group" aria-label="Animation speed">
      {showStep && fab && (
        <button className="sb-btn" onClick={() => stepContent(-1)} aria-label="Previous step" title="Previous step (←)">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 1v10M11 1 4 6l7 5z" /></svg>
        </button>
      )}
      <button className="sb-btn sb-play" onClick={playPause} aria-label={running ? 'Pause' : 'Play'} aria-pressed={running} title={`${running ? 'Pause' : 'Play'} (space)`} data-testid="play">
        {running ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2.5 1 11 6l-8.5 5z" /></svg>
        )}
      </button>
      {showStep && (
        <button className="sb-btn" onClick={() => stepContent(1)} aria-label={fab ? 'Next step' : 'Step forward'} title={fab ? 'Next step (→)' : 'Step the animation forward'}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M10 1v10M1 1l7 5-7 5z" /></svg>
        </button>
      )}
      <label className="sb-speed">
        <span className="sr-only">Animation speed</span>
        <span className="sb-track">
          <input
            type="range"
            min={-2}
            max={1}
            step={0.01}
            value={pos}
            onChange={(e) => setSpeed(2 ** +e.target.value)}
            aria-valuetext={fmt(speed)}
            list="speed-snaps"
            data-testid="speed"
          />
          <datalist id="speed-snaps">
            {SPEED_SNAPS.map((s) => (
              <option key={s} value={Math.log2(s)} />
            ))}
          </datalist>
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
