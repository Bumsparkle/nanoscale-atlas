import './style-page.css'
import { SourceButton } from './source/Source'
import { T2 } from '../sources'

const SURFACES = ['--bg-0', '--bg-1', '--bg-2', '--bg-3', '--line', '--line-strong']
const INKS = ['--ink-0', '--ink-1', '--ink-2', '--ink-3']
const SIGNALS = [
  ['--amber', 'Yellow-light bay. The only UI accent; also logic 1 / VDD'],
  ['--lo', 'Logic 0 / GND'],
  ['--on', 'Conducting path'],
  ['--warn', 'Rule violation'],
]
const LEGEND = [
  ['--leg-sio2', 'SiO₂'],
  ['--leg-nplus', 'n+ diffusion'],
  ['--leg-pplus', 'p+ diffusion'],
  ['--leg-poly', 'polysilicon'],
  ['--leg-metal', 'metal1'],
  ['--leg-nwell', 'n well'],
  ['--leg-psub', 'p substrate'],
]
const MATS = [
  ['--mat-si', 'Silicon: grey-blue, faintly metallic'],
  ['--mat-poly', 'Polysilicon: grainy, warm'],
  ['--mat-al', 'Aluminium: bright'],
  ['--mat-resist', 'Photoresist: amber'],
]
const TYPE = [
  ['--t-56', 'sans 600', 'Wafer to lattice'],
  ['--t-34', 'sans 500', 'CMOS inverter cell'],
  ['--t-24', 'sans 500', 'Gate oxide'],
  ['--t-18', 'sans 500', 'What it does'],
  ['--t-15', 'sans 400', 'Gate high inverts the channel under the gate to n-type; current flows source to drain.'],
  ['--t-13', 'mono 400', 'tox < 20 Å · 6–7 atomic layers'],
  ['--t-11', 'mono 400 caps', 'SLIDE 37'],
]

function Swatch({ v, note }: { v: string; note?: string }) {
  return (
    <div className="sw">
      <div className="sw-chip" style={{ background: `var(${v})` }} />
      <code>{v}</code>
      {note && <span>{note}</span>}
    </div>
  )
}

export function StylePage() {
  return (
    <main className="style-page">
      <header>
        <p className="eyebrow">Nanoscale Atlas · system</p>
        <h1>Type, colour, motion</h1>
        <p className="lede">
          A dark instrument panel. The materials carry the colour; the interface keeps one accent, the amber of a
          yellow-light lithography bay. Every measurement is set in Plex Mono.
        </p>
      </header>

      <section>
        <h2>Type</h2>
        <div className="type-list">
          {TYPE.map(([v, spec, sample]) => (
            <div key={v} className="type-row">
              <code>
                {v} · {spec}
              </code>
              <span
                style={{
                  fontSize: `var(${v})`,
                  fontFamily: spec.startsWith('mono') ? 'var(--mono)' : 'var(--sans)',
                  fontWeight: spec.includes('600') ? 600 : spec.includes('500') ? 500 : 400,
                  textTransform: spec.includes('caps') ? 'uppercase' : undefined,
                  letterSpacing: spec.includes('caps') ? '0.08em' : undefined,
                }}
              >
                {sample}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Surfaces and ink</h2>
        <div className="sw-grid">
          {[...SURFACES, ...INKS].map((v) => (
            <Swatch key={v} v={v} />
          ))}
        </div>
      </section>

      <section>
        <h2>Signals</h2>
        <div className="sw-grid wide">
          {SIGNALS.map(([v, n]) => (
            <Swatch key={v} v={v} note={n} />
          ))}
        </div>
      </section>

      <section>
        <h2>Slide 25 legend</h2>
        <p className="note">Used, unchanged in meaning, on every cut face and 2D cross-section.</p>
        <div className="legend-strip">
          {LEGEND.map(([v, n]) => (
            <div key={v} className={'leg' + (v === '--leg-metal' ? ' hatched' : '')} style={{ background: `var(${v})` }}>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>3D materials</h2>
        <div className="sw-grid wide">
          {MATS.map(([v, n]) => (
            <Swatch key={v} v={v} note={n} />
          ))}
          <div className="sw">
            <div className="sw-chip thinfilm" />
            <code>oxide</code>
            <span>Thin-film interference: colour follows thickness (0 → 600 nm shown)</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Marks</h2>
        <div className="marks">
          <SourceButton refs={[T2(37)]} />
          <span className="beyond">beyond the lecture · Sze, 3rd ed.</span>
          <kbd>Esc</kbd>
          <button className="tool">sound off</button>
          <button className="tool" aria-pressed="true">
            section
          </button>
        </div>
      </section>

      <section>
        <h2>Motion</h2>
        <p className="note">
          No linear tweens. Everything that moves is a damped spring: camera ω = 7.5 rad/s, ζ = 0.92; snaps ω = 26,
          ζ = 0.48 (one visible overshoot, then settle); parting halves ω = 11, ζ = 0.62. Reduced-motion users get the end
          state immediately.
        </p>
      </section>
    </main>
  )
}
