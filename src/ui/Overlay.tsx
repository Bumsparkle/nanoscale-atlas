import { useEffect, useRef, useState } from 'react'
import { overlay, type ScreenLabel } from '../scene/cellRuntime'
import { useAtlas } from '../state/store'
import './overlay.css'

interface Placed {
  l: ScreenLabel
  x: number
  y: number
  w: number
}

/** estimate label width without layout thrash (Plex Mono 11px ≈ 6.7 px/char) */
const widthOf = (l: ScreenLabel) => Math.max(l.text.length, (l.sub ?? '').length) * 6.8 + 18

/**
 * Engineering-drawing callouts for the cut face: labels in collision-free
 * rows above (films, metal) and below (silicon) the section, joined to
 * their regions by thin leader lines ending in a dot.
 */
function layout(labels: ScreenLabel[], W: number): Placed[] {
  const out: Placed[] = []
  const vis = labels.filter((l) => l.visible)
  for (const group of ['top', 'bottom'] as const) {
    const g = vis.filter((l) => l.group === group).sort((a, b) => a.x - b.x)
    if (!g.length) continue
    const base = group === 'top' ? Math.min(...g.map((l) => l.y)) - 64 : Math.max(...g.map((l) => l.y)) + 52
    const rows: number[] = []
    for (const l of g) {
      const w = widthOf(l)
      let x = Math.min(Math.max(l.x - w / 2, 12), W - w - 12)
      let r = rows.findIndex((right) => x > right + 10)
      if (r < 0) {
        if (rows.length < 3) {
          rows.push(-Infinity)
          r = rows.length - 1
        } else {
          r = rows.indexOf(Math.min(...rows))
          x = Math.max(x, rows[r] + 10)
        }
      }
      rows[r] = x + w
      const y = group === 'top' ? base - r * 34 : base + r * 34
      out.push({ l, x, y, w })
    }
  }
  for (const l of vis.filter((l) => l.group === 'side')) out.push({ l, x: l.x - widthOf(l) - 14, y: l.y - 10, w: widthOf(l) })
  for (const l of vis.filter((l) => l.group === 'right')) out.push({ l, x: Math.min(l.x + 14, W - widthOf(l) - 12), y: l.y - 10, w: widthOf(l) })
  return out
}

export function LabelOverlay() {
  const quiz = useAtlas((s) => s.quiz)
  const [version, setVersion] = useState(overlay.version)
  const svg = useRef<SVGSVGElement>(null)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (overlay.version !== version) setVersion(overlay.version)
      const placed = layout(overlay.labels, window.innerWidth)
      const byId = new Map(placed.map((p) => [p.l.id, p]))
      box.current?.querySelectorAll<HTMLElement>('[data-id]').forEach((el) => {
        const p = byId.get(el.dataset.id!)
        if (!p) {
          el.style.opacity = '0'
          return
        }
        el.style.opacity = '1'
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`
      })
      svg.current?.querySelectorAll<SVGGElement>('[data-id]').forEach((g) => {
        const p = byId.get(g.dataset.id!)
        const line = g.firstElementChild as SVGPolylineElement
        const dot = g.lastElementChild as SVGCircleElement
        if (!p) {
          g.style.opacity = '0'
          return
        }
        g.style.opacity = '1'
        const ax = p.l.x
        const ay = p.l.y
        let pts: string
        if (p.l.group === 'side') pts = `${p.x + p.w + 2},${p.y + 10} ${ax},${ay}`
        else if (p.l.group === 'right') pts = `${p.x - 2},${p.y + 10} ${ax},${ay}`
        else {
          const lx = Math.min(Math.max(ax, p.x + 6), p.x + p.w - 6)
          const ly = p.l.group === 'top' ? p.y + 22 : p.y - 2
          const elbow = p.l.group === 'top' ? ly + 10 : ly - 10
          pts = `${lx},${ly} ${lx},${elbow} ${ax},${ay}`
        }
        line.setAttribute('points', pts)
        dot.setAttribute('cx', ax.toFixed(1))
        dot.setAttribute('cy', ay.toFixed(1))
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [version])

  const labels = overlay.labels
  return (
    <div className={'label-overlay' + (quiz ? ' quiz' : '')} aria-hidden>
      <svg ref={svg} width="100%" height="100%">
        {labels.map((l) => (
          <g key={l.id} data-id={l.id} style={{ opacity: 0 }}>
            <polyline fill="none" />
            <circle r="2.2" />
          </g>
        ))}
      </svg>
      <div ref={box}>
        {labels.map((l) => (
          <div key={l.id} data-id={l.id} className={'callout callout-' + l.group} style={{ opacity: 0 }}>
            <span className="callout-text">{l.text}</span>
            {l.sub && <span className="callout-sub">{l.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

/** slide 25 legend, shown with a locked cut */
export function SectionLegend() {
  const view = useAtlas((s) => s.view)
  const locked = useAtlas((s) => s.section.locked)
  if (view !== 'section' || !locked) return null
  const rows: [string, string, boolean?][] = [
    ['var(--leg-sio2)', 'SiO₂', true],
    ['var(--leg-nplus)', 'n+ diffusion'],
    ['var(--leg-pplus)', 'p+ diffusion'],
    ['var(--leg-poly)', 'polysilicon'],
    ['var(--leg-metal)', 'metal1', true],
    ['var(--leg-nwell)', 'n well'],
    ['var(--leg-psub)', 'p substrate'],
  ]
  return (
    <figure className="legend" aria-label="Cross-section legend (slide 25)">
      <figcaption className="eyebrow">legend · slide 25</figcaption>
      <ul>
        {rows.map(([c, t, h]) => (
          <li key={t}>
            <i className={h ? 'hatched' + (t === 'metal1' ? ' metal' : '') : ''} style={{ background: c }} />
            {t}
          </li>
        ))}
      </ul>
    </figure>
  )
}
