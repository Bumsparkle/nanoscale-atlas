import { useEffect, useRef } from 'react'
import { live, useAtlas } from '../state/store'
import { LAYER_BY_ID } from '../chapters/cmos/layers'
import './scalebar.css'
import { EXAGGERATION_NOTE } from '../chapters/cmos/display'

/** Pick a 1-2-5 length (metres) that is at most `maxM`. */
export function niceLength(maxM: number) {
  const exp = Math.floor(Math.log10(maxM))
  const base = Math.pow(10, exp)
  const m = maxM / base
  const k = m >= 5 ? 5 : m >= 2 ? 2 : 1
  return k * base
}

/** Format a length in metres with the unit ladder of the brief: mm → µm → nm → Å. */
export function formatLength(m: number): string {
  const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(0) : +v.toPrecision(2) + '')
  if (m >= 1) return fmt(m) + ' m'
  if (m >= 1e-3) return fmt(m * 1e3) + ' mm'
  if (m >= 1e-6) return fmt(m * 1e6) + ' µm'
  if (m >= 1e-9) return fmt(m * 1e9) + ' nm'
  return fmt(m * 1e10) + ' Å'
}

const DECADES = [
  { m: 1, label: 'm' },
  { m: 1e-1, label: '10 cm' },
  { m: 1e-3, label: 'mm' },
  { m: 1e-6, label: 'µm' },
  { m: 1e-9, label: 'nm' },
  { m: 1e-10, label: 'Å' },
]
const LOG_MAX = 1.2 // log10 metres at left end (≈ 16 m: the cleanroom bay)
const LOG_MIN = -11 // ≈ 0.1 Å

/**
 * Live scale bar: a 1-2-5 bar sized from the camera, plus a log ladder from
 * wafer to atom with a needle at the current field of view.
 */
export function ScaleBar() {
  const bar = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const needle = useRef<HTMLDivElement>(null)
  const fov = useRef<HTMLSpanElement>(null)
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  const note = LAYER_BY_ID[layer].scaleNote
  // drawing exaggerations belong with the scale they distort
  const exaggerated = (layer === 'cell' || layer === 'transistor') && view !== 'layout'

  useEffect(() => {
    let raf = 0
    let lastLabel = ''
    const tick = () => {
      const mpp = live.metresPerPixel
      const target = 120
      const len = niceLength(mpp * target)
      const px = len / mpp
      if (bar.current) bar.current.style.width = px.toFixed(1) + 'px'
      const text = formatLength(len)
      if (label.current && text !== lastLabel) {
        label.current.textContent = text
        lastLabel = text
      }
      const view = mpp * window.innerHeight
      const t = (Math.log10(view) - LOG_MAX) / (LOG_MIN - LOG_MAX)
      if (needle.current) needle.current.style.left = (Math.min(1, Math.max(0, t)) * 100).toFixed(2) + '%'
      if (fov.current) fov.current.textContent = 'field ' + formatLength(view)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="scalebar" aria-label="Scale">
      <div className="scalebar-row">
        <div className="scalebar-bar" ref={bar}>
          <i />
          <i />
        </div>
        <span className="scalebar-label" ref={label} aria-live="polite" />
      </div>
      <div className="scalebar-ladder" aria-hidden>
        {DECADES.map((d) => (
          <span key={d.label} style={{ left: ((Math.log10(d.m) - LOG_MAX) / (LOG_MIN - LOG_MAX)) * 100 + '%' }}>
            {d.label}
          </span>
        ))}
        <div className="scalebar-needle" ref={needle} />
      </div>
      <p className="scalebar-meta">
        <span ref={fov} />
        {note && <span>{note}</span>}
        {exaggerated && <span>{EXAGGERATION_NOTE}</span>}
      </p>
    </div>
  )
}
