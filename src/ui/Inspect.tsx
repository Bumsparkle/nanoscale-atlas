import { useEffect, useRef, useState } from 'react'
import { MasteryToggle } from '../learn/ui/LearnHost'
import { CONTENT, CONTENT_BY_ID } from '../chapters/cmos/content'
import { LAYER_BY_ID } from '../chapters/cmos/layers'
import { useApp } from '../state/store'
import { objectMastery } from '../learn/progress'

const FAB_ONLY = new Set(['aluminium-film', 'photoresist', 'mask-oxide'])

/** title + one-liner next to the pointer while hovering an object */
export function HoverLabel() {
  const hover = useApp((s) => s.hover)
  const focus = useApp((s) => s.focus)
  const el = useRef<HTMLDivElement>(null)
  const [overCanvas, setOverCanvas] = useState(false)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const onCanvas = (e.target as HTMLElement)?.tagName === 'CANVAS'
      setOverCanvas(onCanvas)
      if (!el.current) return
      const x = Math.min(e.clientX + 16, window.innerWidth - el.current.offsetWidth - 8)
      el.current.style.transform = `translate(${x}px, ${e.clientY + 18}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  const quiz = useApp((s) => s.quiz)
  const c = hover && hover !== focus && overCanvas && !quiz ? CONTENT_BY_ID[hover] : null
  return (
    <div ref={el} className="hover-label" style={{ visibility: c ? 'visible' : 'hidden' }} aria-hidden>
      {c && (
        <>
          <strong>{c.title}</strong>
          <span>{c.short}</span>
        </>
      )}
    </div>
  )
}

/**
 * Text outline of the current scene. Every inspectable object is a
 * keyboard-reachable button: focus highlights it in 3D, Enter opens its
 * panel. Doubles as the screen-reader description of the layer.
 */
export function SceneOutline() {
  const layer = useApp((s) => s.layer)
  const view = useApp((s) => s.view)
  const focus = useApp((s) => s.focus)
  const set = useApp((s) => s.set)
  const [open, setOpen] = useState(false)
  const tab = useApp((s) => s.tab)
  const items = CONTENT.filter((c) => c.layer === layer && (view === 'fab' || !FAB_ONLY.has(c.id)) && (!c.tabs || c.tabs.includes(tab)))
  const mode = useApp((s) => s.mode)
  const mastery = useApp((s) => s.mastery)
  useApp((s) => s.progressVersion)
  if (view === 'layout' || mode !== 'explore') return null
  if (!items.length) return null
  const def = LAYER_BY_ID[layer]
  return (
    <nav className="outline-nav" aria-label={`Objects in the ${def.title}`}>
      <div className="outline-row">
        <button className="outline-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
          parts<span className="count">{items.length}</span>
        </button>
        <MasteryToggle />
      </div>
      <ul hidden={!open} onMouseLeave={() => set({ hover: null })}>
        {items.map((c) => (
          <li key={c.id}>
            <button
              aria-current={focus === c.id}
              aria-describedby={`d-${c.id}`}
              onFocus={() => set({ hover: c.id })}
              onMouseEnter={() => set({ hover: c.id })}
              onBlur={() => set({ hover: null })}
              onClick={() => set({ focus: c.id })}
            >
              {c.title}
              {mastery && <MasteryDot id={c.id} />}
            </button>
            <span id={`d-${c.id}`} className="sr-only">
              {c.short}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** small mastery marker used in the parts list when the overlay is on */
function MasteryDot({ id }: { id: string }) {
  const m = objectMastery(id)
  if (!m) return null
  return <i className={'mdot mdot-' + m.level} title={`${m.level} · ${Math.round(m.score * 100)} %`} aria-label={`mastery ${m.level}`} />
}
