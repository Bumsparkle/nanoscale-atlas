import { useEffect } from 'react'
import { SNAP_TARGETS, useAtlas, type CutTarget, type View } from '../state/store'
import { cellRuntime as rt } from '../scene/cellRuntime'
import { PLANE_RANGE } from '../scene/section'
import './viewbar.css'
import { SpeedBar } from './SpeedBar'
import { LAYER_BY_ID } from '../chapters/cmos/layers'

const VIEWS: { id: View; label: string; key: string; hint: string }[] = [
  { id: 'explore', label: 'Explore', key: 'e', hint: 'Click any part to inspect it' },
  { id: 'section', label: 'Section', key: 's', hint: 'Drag across the cell to cut it' },
  { id: 'masks', label: 'Masks', key: 'm', hint: 'Pull the cell upward to separate the six masks' },
  { id: 'fab', label: 'Fab', key: 'f', hint: 'Replay the 45 fabrication steps' },
  { id: 'logic', label: 'Logic', key: 'l', hint: 'Toggle the input A' },
  { id: 'layout', label: 'Layout', key: 'g', hint: 'The six masks on the λ grid · hover any edge for its rule' },
]

export function lockTo(id: CutTarget) {
  const st = useAtlas.getState()
  const t = SNAP_TARGETS[id]
  if (st.section.axis !== t.axis) rt.plane.snap(t.offset + (t.axis === 'y' ? -6 : -6))
  st.setSection({ axis: t.axis, locked: id, offset: t.offset })
}

export function ViewBar() {
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  const locked = useAtlas((s) => s.section.locked)
  const set = useAtlas((s) => s.set)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      const st = useAtlas.getState()
      if (st.page !== 'atlas' || st.layer !== 'cell') return
      const v = VIEWS.find((v) => v.key === e.key.toLowerCase())
      if (v) return set({ view: v.id, focus: null })
      if (st.view === 'section') {
        const ax = st.section.axis
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1
          const [lo, hi] = PLANE_RANGE[ax]
          const next = Math.min(hi, Math.max(lo, (st.section.locked ? SNAP_TARGETS[st.section.locked].offset : rt.plane.target) + d))
          rt.plane.target = next
          st.setSection({ offset: next, locked: null })
        }
        if (e.key === 'r') {
          const axis = ax === 'y' ? 'x' : 'y'
          rt.plane.snap(axis === 'y' ? 2 : 22)
          st.setSection({ axis, locked: null, offset: rt.plane.value })
        }
        const n = ['1', '2', '3'].indexOf(e.key)
        if (n >= 0) lockTo((['slide27', 'ngate', 'pgate'] as CutTarget[])[n])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [set])

  const cell = layer === 'cell'
  const tab = useAtlas((s) => s.tab)
  const tabs = LAYER_BY_ID[layer].tabs
  const hint = cell ? VIEWS.find((v) => v.id === view)!.hint : (tabs?.find((t) => t.id === tab)?.hint ?? LAYER_HINTS[layer] ?? '')
  return (
    <div className={'scenetools' + (cell && view === 'fab' ? ' scenetools-raised' : '')}>
      {cell && view === 'section' && (
        <div className="scenetools-sub" role="group" aria-label="Snap the section plane">
          {(Object.keys(SNAP_TARGETS) as CutTarget[]).map((id, i) => (
            <button key={id} className="chip" aria-pressed={locked === id} onClick={() => lockTo(id)} title={SNAP_TARGETS[id].label}>
              <kbd>{i + 1}</kbd> {id === 'slide27' ? 'slide 27 line' : id === 'ngate' ? 'nMOS gate' : 'pMOS gate'}
            </button>
          ))}
        </div>
      )}
      <div className="scenetools-main">
        {cell && (
          <nav className="seg views" aria-label="Views of the cell">
            {VIEWS.map((v) => (
              <button key={v.id} aria-pressed={view === v.id} onClick={() => set({ view: v.id, focus: null })} title={`${v.label} (${v.key})`}>
                {v.label}
              </button>
            ))}
          </nav>
        )}
        {cell && view === 'fab' && <SpeedBar />}
        {tabs && (
          <nav className="seg views" aria-label={`Views of the ${LAYER_BY_ID[layer].title}`}>
            {tabs.map((t) => (
              <button key={t.id} aria-pressed={tab === t.id} onClick={() => set({ tab: t.id, focus: null })} title={t.hint}>
                {t.label}
                {t.chapter !== LAYER_BY_ID[layer].chapter && <span className="tab-ch mono">ch{t.chapter.slice(2)}</span>}
              </button>
            ))}
          </nav>
        )}
      </div>
      {hint && (
        <p className="scenetools-hint" aria-live="polite">
          {cell && view === 'section' && locked ? SNAP_TARGETS[locked].label : hint}
        </p>
      )}
    </div>
  )
}

/** one-line hints for the layers without a view bar (shown under the scene tools) */
const LAYER_HINTS: Partial<Record<string, string>> = {
  sand: 'Click the sand or the silicon · scroll in to refine it',
  polysilicon: 'The Siemens reactor and the crucible charge · scroll in to grow a crystal',
  ingot: 'Seed end to tail: the colour is the doping · scroll in to slice it',
  wafers: 'The ID saw slices the ingot · scroll in to enter the fab',
  wafer: 'Scroll to zoom into the marked die · click anything to inspect',
  die: 'Scroll toward the beacon to reach the inverter',
  transistor: 'Drag VG · scroll in to the gate oxide · Esc goes up',
  oxide: 'Scroll into the crystal for the silicon lattice · Esc goes up',
  lattice: 'Switch structure and dopant · Esc goes up',
}
