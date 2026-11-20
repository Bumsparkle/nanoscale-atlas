import { useEffect, useMemo, useRef, useState } from 'react'
import { inverterProcess } from '../chapters/cmos/recipe'
import { useAtlas } from '../state/store'
import { cellRuntime as rt } from '../scene/cellRuntime'
import { sound } from './sound'
import './timeline.css'

const GROUP_LABEL: Record<string, string> = {
  start: 'wafer',
  'n-well': 'n-well',
  gate: 'gate',
  'n+': 'n+',
  'p+': 'p+',
  contacts: 'contacts',
  metal: 'metal',
}

const HUM: Record<string, Parameters<typeof sound.humStart>[0]> = {
  oxidise: 'furnace', deposit: 'furnace', spin: 'spinner', expose: 'litho', develop: 'wet',
  etch: 'wet', strip: 'wet', implant: 'implanter', sputter: 'sputter', start: 'wet',
}

/**
 * Fab timeline: a scrubber with a named tick per recipe step, play/pause,
 * and a card that names each step's slide, tool and chemistry. The 3D
 * model replays the recipe through fractional ops, so scrubbing either
 * way is continuous.
 */
export function Timeline() {
  const P = useMemo(() => inverterProcess(), [])
  const view = useAtlas((s) => s.view)
  const layer = useAtlas((s) => s.layer)
  const step = useAtlas((s) => s.step)
  const playing = useAtlas((s) => s.playing)
  const set = useAtlas((s) => s.set)
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const [hoverTick, setHoverTick] = useState<number | null>(null)
  const n = P.length - 1

  const groups = useMemo(() => {
    const out: { g: string; from: number; to: number }[] = []
    P.steps.forEach((s, i) => {
      const last = out[out.length - 1]
      if (last && last.g === s.group) last.to = i
      else out.push({ g: s.group, from: i, to: i })
    })
    return out
  }, [P])

  // thumb follows the live (spring) position
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const f = (rt.fab.value / n) * 100
      if (thumb.current) thumb.current.style.left = f + '%'
      if (fill.current) fill.current.style.width = f + '%'
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n])

  // tool hum while playing
  useEffect(() => {
    if (playing && view === 'fab') sound.humStart(HUM[P.steps[Math.min(n, step + 1)].kind])
    else sound.humStop()
  }, [playing, step, view, P, n])
  useEffect(() => () => sound.humStop(), [])

  const goTo = (k: number) => {
    k = Math.max(0, Math.min(n, k))
    set({ playing: false, step: k })
    rt.fab.target = k
  }
  const togglePlay = () => {
    if (playing) {
      set({ playing: false })
      rt.fab.target = Math.round(rt.fab.value)
      return
    }
    const from = Math.round(rt.fab.value) >= n ? 0 : Math.round(rt.fab.value)
    if (from === 0) rt.fab.snap(0)
    rt.play = { t: 0, from }
    set({ playing: true, step: from })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useAtlas.getState()
      if (st.view !== 'fab' || st.layer !== 'cell') return
      if ((e.target as HTMLElement)?.closest?.('input, textarea')) return
      if (e.key === 'ArrowRight') (e.preventDefault(), goTo(Math.round(rt.fab.target) + 1))
      if (e.key === 'ArrowLeft') (e.preventDefault(), goTo(Math.round(rt.fab.target) - 1))
      if (e.key === ' ') (e.preventDefault(), togglePlay())
      if (e.key === 'Home') goTo(0)
      if (e.key === 'End') goTo(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (view !== 'fab' || layer !== 'cell') return null

  const posFromEvent = (e: React.PointerEvent | PointerEvent) => {
    const r = track.current!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * n
  }
  const onDown = (e: React.PointerEvent) => {
    e.preventDefault()
    set({ playing: false })
    rt.fab.target = posFromEvent(e)
    const move = (ev: PointerEvent) => (rt.fab.target = posFromEvent(ev))
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      goTo(Math.round(posFromEvent(ev)))
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const s = P.steps[step]
  const shownTick = hoverTick ?? null
  return (
    <>
      <aside className="stepcard" aria-live="polite" data-testid="stepcard">
        <p className="eyebrow">
          step {String(step).padStart(2, '0')} / {n} · {GROUP_LABEL[s.group]} <span className="slide-ref">slide {s.slide}</span>
        </p>
        <h2>{s.title}</h2>
        <dl>
          <dt>tool</dt>
          <dd>{s.tool}</dd>
          <dt>chemistry</dt>
          <dd>{s.chemistry}</dd>
        </dl>
        <p className="stepcard-note">{s.note}</p>
        {s.beyond && <p className="stepcard-beyond"><span className="beyond">beyond the lecture</span> {s.beyond}</p>}
      </aside>
      <div className="timeline" role="group" aria-label="Fabrication timeline">
        <button className="tl-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="1" width="3.5" height="12" /><rect x="8.5" y="1" width="3.5" height="12" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1 L13 7 L3 13 Z" /></svg>
          )}
        </button>
        <div className="tl-body">
          <div className="tl-groups" aria-hidden>
            {groups.map((g) => (
              <span key={g.g} style={{ left: (g.from / n) * 100 + '%', width: ((g.to - g.from) / n) * 100 + '%' }} className={step >= g.from && step <= g.to ? 'on' : ''}>
                {GROUP_LABEL[g.g]}
              </span>
            ))}
          </div>
          <div
            ref={track}
            className="tl-track"
            onPointerDown={onDown}
            role="slider"
            tabIndex={0}
            aria-label="Fab step"
            aria-valuemin={0}
            aria-valuemax={n}
            aria-valuenow={step}
            aria-valuetext={`Step ${step}: ${s.title}`}
          >
            <div className="tl-rail" />
            <div className="tl-fill" ref={fill} />
            {P.steps.map((st, i) => (
              <button
                key={st.id}
                className={'tl-tick tl-' + st.kind + (i === step ? ' current' : '')}
                style={{ left: (i / n) * 100 + '%' }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(i)}
                onMouseEnter={() => setHoverTick(i)}
                onMouseLeave={() => setHoverTick(null)}
                aria-label={`Step ${i}: ${st.title}`}
                tabIndex={-1}
              />
            ))}
            <div className="tl-thumb" ref={thumb} />
            {shownTick != null && (
              <div className="tl-tip" style={{ left: (shownTick / n) * 100 + '%' }}>
                <span className="mono">{String(shownTick).padStart(2, '0')}</span> {P.steps[shownTick].title}
              </div>
            )}
          </div>
        </div>
        <p className="tl-count mono">
          {String(step).padStart(2, '0')}<span>/{n}</span>
        </p>
      </div>
    </>
  )
}
