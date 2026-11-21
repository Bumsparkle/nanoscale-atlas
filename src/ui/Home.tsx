import { useEffect, useRef, useState } from 'react'
import { IS_APP, MAC_DOWNLOAD_URL } from '../platform'
import { useAtlas } from '../state/store'
import { navigate } from '../state/url'
import './home.css'

/**
 * "Enter the cleanroom": the home page is the bay door. The call to action
 * starts the gowning sequence (suit, gloves, air shower), timed to real
 * loading milestones rather than a fake bar; it can be skipped from the
 * first frame, and returning visitors go straight in. The doors then part
 * onto the yellow-lit lithography bay, where the wafer is already on the
 * chuck: the wafer layer, rendering behind the doors all along.
 */
const STEPS = [
  { id: 'suit', label: 'Suit', note: 'Coverall, hood and boots: people shed ~10⁶ particles a minute.' },
  { id: 'gloves', label: 'Gloves', note: 'Nitrile, taped at the cuff. Skin oils are contamination.' },
  { id: 'shower', label: 'Air shower', note: 'HEPA-filtered jets blow off what is left.' },
]
const MIN_STEP_MS = 650
const KEY = 'atlas.gowned'

function seen() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** a damped spring on a CSS variable, for the doors */
function useDoorSpring(open: boolean, reduced: boolean, onDone: () => void) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    let v = 0
    let vel = 0
    let last = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000)
      last = t
      if (reduced) v = 1
      else {
        // heavy doors: low stiffness, slight overshoot at the end of travel
        const a = -42 * (v - 1) - 2 * 0.72 * Math.sqrt(42) * vel
        vel += a * dt
        v += vel * dt
      }
      el.current?.style.setProperty('--door', v.toFixed(4))
      if (Math.abs(v - 1) < 0.002 && Math.abs(vel) < 0.01) onDone()
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [open, reduced, onDone])
  return el
}

export function Home() {
  const boot = useAtlas((s) => s.boot)
  const reduced = useAtlas((s) => s.reducedMotion)
  const [phase, setPhase] = useState<'door' | 'gowning' | 'opening'>('door')
  const [step, setStep] = useState(0)
  const stepStart = useRef(0)
  const returning = useRef(seen())

  const enter = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* private mode: fine */
    }
    navigate('/cmos/wafer' + (location.search.includes('gl=webgl') ? '?gl=webgl' : ''))
  }
  const doors = useDoorSpring(phase === 'opening', reduced, enter)

  // real milestones gate each gowning step
  const ready = [boot.shell, boot.gpu, boot.frame && boot.layers >= 6]
  useEffect(() => {
    if (phase !== 'gowning') return
    const t = setInterval(() => {
      const elapsed = performance.now() - stepStart.current
      if (ready[step] && elapsed > MIN_STEP_MS * (reduced ? 0.3 : 1)) {
        if (step + 1 < STEPS.length) {
          setStep(step + 1)
          stepStart.current = performance.now()
        } else setPhase('opening')
      }
    }, 60)
    return () => clearInterval(t)
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'gowning') setPhase('opening')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const start = () => {
    if (returning.current && boot.gpu) return setPhase('opening')
    stepStart.current = performance.now()
    setPhase('gowning')
  }

  const progress = (i: number) => (i < step ? 1 : i > step ? 0 : ready[i] ? 1 : 0.4)

  return (
    <main className={'home phase-' + phase} ref={doors} aria-label="Nanoscale Atlas">
      <div className="door door-l" aria-hidden>
        <div className="door-window" />
        <div className="door-plate">
          <span>LITHO BAY 2</span>
          <span>ISO 5</span>
        </div>
      </div>
      <div className="door door-r" aria-hidden>
        <div className="door-window" />
        <div className="door-plate">
          <span>YELLOW LIGHT ONLY</span>
          <span>λ &gt; 500 nm</span>
        </div>
      </div>
      <div className="door-seam" aria-hidden />

      <section className="home-card">
        <p className="eyebrow">ELEC0031 · Topic 2 · Chapter 1</p>
        <h1>Nanoscale Atlas</h1>
        <p className="home-lede">
          The CMOS inverter, from a 300 mm wafer to the 5.43 Å silicon lattice. Built from the lecture's six masks and its
          45-step fabrication sequence.
        </p>
        {phase === 'door' && (
          <button className="home-cta" onClick={start} autoFocus>
            Enter the cleanroom
          </button>
        )}
        {phase !== 'door' && (
          <ol className="gown" aria-live="polite">
            {STEPS.map((s, i) => (
              <li key={s.id} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <span className="gown-label">{s.label}</span>
                <span className="gown-bar">
                  <i style={{ transform: `scaleX(${phase === 'opening' ? 1 : progress(i)})` }} />
                </span>
                <span className="gown-note">{s.note}</span>
              </li>
            ))}
          </ol>
        )}
        {phase === 'gowning' && (
          <button className="home-skip" onClick={() => setPhase('opening')}>
            skip <kbd>Esc</kbd>
          </button>
        )}
        <nav className="home-links" aria-label="Shortcuts">
          <a href="/cmos/inverter" onClick={(e) => (e.preventDefault(), navigate('/cmos/inverter'))}>inverter cell</a>
          <a href="/cmos/inverter?view=section&cut=slide27" onClick={(e) => (e.preventDefault(), navigate('/cmos/inverter?view=section&cut=slide27'))}>slide 27 section</a>
          <a href="/cmos/inverter?view=fab&step=0" onClick={(e) => (e.preventDefault(), navigate('/cmos/inverter?view=fab&step=0'))}>fab sequence</a>
          {!IS_APP && (
            <a className="home-download" href={MAC_DOWNLOAD_URL} data-testid="download-mac">
              Download for Mac ↓
            </a>
          )}
        </nav>
      </section>
      {phase === 'gowning' && step === 2 && <div className="air" aria-hidden />}
    </main>
  )
}
