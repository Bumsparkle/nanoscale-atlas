import { useEffect, useRef, useState } from 'react'
import { CONTENT_BY_ID } from '../chapters/cmos/content'
import type { Content } from '../chapters/content-schema'
import { inverterProcess } from '../chapters/cmos/recipe'
import { useApp } from '../state/store'
import { transition } from '../scene/transition'
import { Spring, SPRINGS } from '../scene/spring'
import './panel.css'
import { SourceButton } from './source/Source'

/**
 * Inspect panel: right-hand on desktop, bottom sheet on mobile. Slides in
 * on a spring; the world stays visible behind it.
 */
export function Panel() {
  const focus = useApp((s) => s.focus)
  const reduced = useApp((s) => s.reducedMotion)
  const set = useApp((s) => s.set)
  const [shown, setShown] = useState<string | null>(focus)
  const el = useRef<HTMLElement>(null)
  const spring = useRef(new Spring(focus ? 1 : 0, SPRINGS.ui))

  useEffect(() => {
    if (focus) setShown(focus)
    spring.current.target = focus ? 1 : 0
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      const v = spring.current.step(dt, reduced)
      if (el.current) el.current.style.setProperty('--open', v.toFixed(4))
      if (!spring.current.settled) raf = requestAnimationFrame(tick)
      else if (!focus) setShown(null)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [focus, reduced])

  const inLayout = useApp((s) => s.view === 'layout' && s.layer === 'cell')
  const c = shown ? CONTENT_BY_ID[shown] : null
  // in the Layout view the same content renders inline in the layout panel
  const mode = useApp((s) => s.mode)
  if (!c || inLayout || mode !== 'explore') return null

  return (
    <aside ref={el} className="panel" aria-label={c.title} aria-live="polite" data-testid="panel">
      <header className="panel-head">
        <p className="eyebrow">{c.layer === 'cell' ? 'inverter cell' : c.layer === 'layout' ? 'layout · design rules' : c.layer}</p>
        <h2>{c.title}</h2>
        <button className="panel-close" onClick={() => set({ focus: null })} aria-label="Close panel">
          <kbd>Esc</kbd>
        </button>
      </header>
      <ContentBody c={c} />
    </aside>
  )
}

/** the four-part panel body (what / how made / what it does / slides), shared with the Layout view */
export function ContentBody({ c }: { c: Content }) {
  const set = useApp((s) => s.set)
  const P = inverterProcess()
  const stepIndex = c.fabStep ? P.indexOf(c.fabStep) : -1
  const step = stepIndex >= 0 ? P.steps[stepIndex] : null
  return (
    <div className="panel-body">
        <section>
          <h3>What it is</h3>
          <p>{c.what}</p>
        </section>
        <section>
          <h3>How it's made</h3>
          <p>{c.made}</p>
          {step && (
            <button
              className="panel-link"
              onClick={() => {
                set({ view: 'fab', step: stepIndex, focus: null, playing: false })
              }}
            >
              <span className="mono">step {String(stepIndex).padStart(2, '0')}</span> {step.title} →
            </button>
          )}
        </section>
        <section>
          <h3>What it does</h3>
          <p>{c.does}</p>
        </section>
        {c.beyond.length > 0 && (
          <section className="panel-beyond">
            <h3>Beyond the lecture</h3>
            <ul>
              {c.beyond.map((b, i) => (
                <li key={i}>
                  {b.text} <span className="beyond">{b.source}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer className="panel-foot">
          <div className="panel-slides">
            <SourceButton refs={c.sources} />
          </div>
          {c.dive && (
            <button
              className="panel-dive"
              onClick={() => void transition.go(c.dive!.layer, { device: c.dive!.device })}
            >
              Zoom in: {c.dive.layer === 'transistor' ? (c.dive.device === 'pmos' ? 'pMOS transistor' : 'nMOS transistor') : c.dive.layer === 'oxide' ? 'gate oxide' : c.dive.layer} ↘
            </button>
          )}
        </footer>
      </div>
  )
}
