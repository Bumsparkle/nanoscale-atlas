import { useEffect, useRef, useState } from 'react'
import { CONTENT, CONTENT_BY_ID } from '../chapters/cmos/content'
import { LAYER_BY_ID } from '../chapters/cmos/layers'
import { useAtlas } from '../state/store'

const FAB_ONLY = new Set(['aluminium-film', 'photoresist', 'mask-oxide'])

/** title + one-liner next to the pointer while hovering an object */
export function HoverLabel() {
  const hover = useAtlas((s) => s.hover)
  const focus = useAtlas((s) => s.focus)
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
  const c = hover && hover !== focus && overCanvas ? CONTENT_BY_ID[hover] : null
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
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  const focus = useAtlas((s) => s.focus)
  const set = useAtlas((s) => s.set)
  const [open, setOpen] = useState(false)
  const items = CONTENT.filter((c) => c.layer === layer && (view === 'fab' || !FAB_ONLY.has(c.id)))
  if (view === 'layout') return null
  if (!items.length) return null
  const def = LAYER_BY_ID[layer]
  return (
    <nav className="outline-nav" aria-label={`Objects in the ${def.title}`}>
      <button className="outline-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        parts<span className="count">{items.length}</span>
      </button>
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
