import { useEffect } from 'react'
import { SNAP_TARGETS, useAtlas, type CutTarget, type View } from '../state/store'
import { cellRuntime as rt } from '../scene/cellRuntime'
import { PLANE_RANGE } from '../scene/section'
import { sound } from './sound'
import './viewbar.css'

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
  sound.click(1)
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

  if (layer !== 'cell') return null
  const hint = VIEWS.find((v) => v.id === view)!.hint
  return (
    <div className={'viewbar' + (view === 'fab' ? ' viewbar-raised' : '')}>
      {view === 'section' && (
        <div className="viewbar-sub" role="group" aria-label="Snap the section plane">
          {(Object.keys(SNAP_TARGETS) as CutTarget[]).map((id, i) => (
            <button key={id} className="chip" aria-pressed={locked === id} onClick={() => lockTo(id)} title={SNAP_TARGETS[id].label}>
              <kbd>{i + 1}</kbd> {id === 'slide27' ? 'slide 27 line' : id === 'ngate' ? 'nMOS gate' : 'pMOS gate'}
            </button>
          ))}
        </div>
      )}
      <nav className="viewbar-main" aria-label="Views of the cell">
        {VIEWS.map((v) => (
          <button key={v.id} aria-pressed={view === v.id} onClick={() => set({ view: v.id, focus: null })}>
            {v.label}
          </button>
        ))}
      </nav>
      <p className="viewbar-hint" aria-live="polite">
        {view === 'section' && locked ? SNAP_TARGETS[locked].label : hint}
      </p>
    </div>
  )
}
