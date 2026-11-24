import { useState } from 'react'
import { useApp, type CellKind } from '../../state/store'
import { SourceButton } from '../source/Source'
import { T3 } from '../../sources'
import { transition } from '../../scene/transition'
import { bandsAt, cI, csOverC0, cV, K0_TABLE, millerFromIntercepts, reduceHkl, SI_ATOMS, sheetDensity, sheetDensityCm2, zoneRefine } from '../../chapters/growth/physics'
import { BandsChart, DopingLegend, SegregationChart, SolidsStrip, ZoneChart } from './charts'
import { sci } from '../../chapters/growth/lab'
import type { LayerId } from '../../chapters/cmos/layers'
import './growth.css'

/**
 * Chapter 2 controls, one panel per layer or tab (bottom right, like the
 * transistor's gate-voltage panel). Every number comes from
 * chapters/growth/physics.ts.
 */
const fmt = (v: number) => (v >= 10 ? v.toFixed(0) : v >= 0.1 ? v.toFixed(2) : v.toPrecision(2))

function Next({ to, label }: { to: LayerId; label: string }) {
  return (
    <button className="chip gp-next" onClick={() => void transition.go(to)}>
      {label} →
    </button>
  )
}

function Steps({ items, on }: { items: { n: string; text: string; eq?: string }[]; on?: number }) {
  return (
    <ol className="gp-steps">
      {items.map((it, i) => (
        <li key={i} className={on === i ? 'on' : ''}>
          <span className="mono gp-n">{it.n}</span>
          <span>
            {it.text}
            {it.eq && <span className="gp-eq mono">{it.eq}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

const REFINING = [
  { n: '1', text: 'Heat silica with carbon: metallurgical-grade Si.', eq: 'SiO₂ + 2C → Si + 2CO' },
  { n: '2', text: 'React with HCl to make trichlorosilane, a gas that can be purified.', eq: 'Si + 3HCl → SiHCl₃ + H₂ + heat' },
  { n: '3', text: 'Siemens process: deposit pure polysilicon.', eq: '2SiHCl₃ + 2H₂ → 2Si + 6HCl' },
]

export function SandPanel() {
  return (
    <section className="lc gp" aria-label="Refining">
      <span className="eyebrow lc-head">ultra-pure silicon in three steps <SourceButton refs={[T3(15), T3(16)]} /></span>
      <Steps items={REFINING} on={0} />
      <p className="lc-fine">Slide 15 writes step 1 with CO₂; at arc-furnace temperatures the carbon leaves as CO.</p>
      <Next to="polysilicon" label="refined polysilicon" />
    </section>
  )
}

export function PolyPanel() {
  return (
    <section className="lc gp" aria-label="Polysilicon">
      <span className="eyebrow lc-head">refined polysilicon <SourceButton refs={[T3(15), T3(16)]} /></span>
      <Steps items={REFINING} on={2} />
      <p className="lc-note">
        Impurities &lt; 1 ppb, except O (~10¹⁸ cm⁻³) and C (~10¹⁶ cm⁻³). Two ways to grow a single crystal from it: Czochralski and float zone.
      </p>
      <Next to="puller" label="grow the crystal" />
    </section>
  )
}

function DopantChips() {
  const g = useApp((s) => s.growth)
  const set = useApp((s) => s.set)
  return (
    <div className="gp-chips" role="group" aria-label="Dopant">
      {K0_TABLE.map((d) => (
        <button key={d.el} className="chip" aria-pressed={g.dopant === d.el} onClick={() => set({ growth: { ...g, dopant: d.el, k0: d.k0 } })} title={`k0 = ${d.k0}`}>
          {d.el}
        </button>
      ))}
    </div>
  )
}

function K0Slider({ label = 'segregation coefficient k0' }: { label?: string }) {
  const g = useApp((s) => s.growth)
  const set = useApp((s) => s.set)
  return (
    <label className="lc-slider">
      <span className="eyebrow">{label}</span>
      <input
        type="range" min={-3.5} max={0.15} step={0.01} value={Math.log10(g.k0)}
        aria-label="k0 (log scale)"
        onChange={(e) => {
          const k0 = +Math.pow(10, +e.target.value).toPrecision(2)
          set({ growth: { ...g, k0, dopant: K0_TABLE.find((d) => Math.abs(d.k0 - k0) / d.k0 < 0.02)?.el ?? '' } })
        }}
      />
      <span className="mono">{g.k0 < 0.01 ? g.k0.toExponential(1) : g.k0.toFixed(g.k0 < 0.1 ? 3 : 2)}</span>
    </label>
  )
}

export function PullerPanel() {
  const tab = useApp((s) => s.tab)
  const g = useApp((s) => s.growth)
  const set = useApp((s) => s.set)
  if (tab === 'fz') {
    const prof = zoneRefine(Math.min(g.k0, 0.99), g.passes)
    return (
      <section className="lc gp" aria-label="Float zone">
        <span className="eyebrow lc-head">float zone <SourceButton refs={[T3(20)]} /></span>
        <K0Slider label="impurity segregation k" />
        <label className="lc-slider">
          <span className="eyebrow">molten zone position</span>
          <input type="range" min={0} max={0.95} step={0.01} value={g.frac} onChange={(e) => set({ growth: { ...g, frac: +e.target.value } })} />
          <span className="mono">{Math.round(g.frac * 100)} %</span>
        </label>
        <div className="lc-row">
          <span className="eyebrow">passes</span>
          <div className="seg" role="group" aria-label="Passes">
            {[1, 2, 3].map((n) => (
              <button key={n} aria-pressed={g.passes === n} onClick={() => set({ growth: { ...g, passes: n } })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <ZoneChart k={g.k0} passes={g.passes} pos={g.frac} />
        <p className="lc-note">
          Impurities stay in the liquid and ride along with the zone: the seed end ends at {fmt(prof[2])} C0 after {g.passes} pass{g.passes > 1 ? 'es' : ''}.
        </p>
      </section>
    )
  }
  const seed = csOverC0(g.k0, 0)
  const now = csOverC0(g.k0, g.frac)
  return (
    <section className="lc gp" aria-label="Czochralski segregation">
      <span className="eyebrow lc-head">segregation along the ingot <SourceButton refs={[T3(17), T3(18), T3(19)]} /></span>
      <DopantChips />
      <K0Slider />
      <label className="lc-slider">
        <span className="eyebrow">fraction pulled, M/M0</span>
        <input type="range" min={0} max={0.95} step={0.01} value={g.frac} onChange={(e) => set({ growth: { ...g, frac: +e.target.value } })} />
        <span className="mono">{g.frac.toFixed(2)}</span>
      </label>
      <p className="gp-eq mono">Cs = k0·C0·(1 − M/M0)^(k0−1)</p>
      <dl className="gp-read mono">
        <dt>seed end</dt>
        <dd>{fmt(seed)} C0</dd>
        <dt>now</dt>
        <dd>{fmt(now)} C0</dd>
        <dt>melt CL</dt>
        <dd>{fmt(now / g.k0)} C0</dd>
      </dl>
      <SegregationChart k0={g.k0} frac={g.frac} />
      <DopingLegend />
    </section>
  )
}

export function IngotPanel() {
  const g = useApp((s) => s.growth)
  return (
    <section className="lc gp" aria-label="Ingot">
      <span className="eyebrow lc-head">from ingot to wafers <SourceButton refs={[T3(23)]} /></span>
      <Steps items={[
        { n: '1', text: 'Cut off the seed end and tail; prepare the crystal for grinding.' },
        { n: '2', text: 'Grind to diameter.' },
        { n: '3', text: 'Grind a flat (or notch) to mark the orientation.' },
      ]} />
      <span className="eyebrow">doping of the as-grown ingot</span>
      <DopantChips />
      <p className="lc-note">With k0 = {g.k0}, the tail end has {fmt(csOverC0(g.k0, 0.92) / csOverC0(g.k0, 0))}× the seed end's doping.</p>
      <DopingLegend />
      <Next to="wafers" label="slice it" />
    </section>
  )
}

export function WafersPanel() {
  return (
    <section className="lc gp" aria-label="Wafers">
      <span className="eyebrow lc-head">slicing <SourceButton refs={[T3(23), T3(24)]} /></span>
      <Steps items={[
        { n: '4', text: 'An internal-diameter saw slices the ingot into wafers.' },
        { n: '5', text: 'Each wafer gets a notch and a scribed identification number.' },
        { n: '6', text: 'Wafers are processed in batches in carriers, then shipped epi-ready to the fab.' },
      ]} />
      <Next to="cleanroom" label="into the cleanroom" />
    </section>
  )
}

/* ───────────── lattice tabs ───────────── */

export function CellsPanel() {
  const c = useApp((s) => s.crystal)
  const set = useApp((s) => s.set)
  const C = (p: Partial<typeof c>) => set({ crystal: { ...c, ...p } })
  return (
    <section className="lc gp" aria-label="Unit cells">
      <span className="eyebrow lc-head">unit cells <SourceButton refs={[T3(4), T3(5)]} /></span>
      <div className="seg" role="group" aria-label="Cell">
        {(['sc', 'bcc', 'fcc', 'diamond'] as CellKind[]).map((k) => (
          <button key={k} aria-pressed={c.cell === k} onClick={() => C({ cell: k, offset: k === 'diamond' ? c.offset : 0 })}>
            {k === 'sc' ? 'cubic' : k === 'diamond' ? 'diamond' : k.toUpperCase()}
          </button>
        ))}
      </div>
      {c.cell === 'diamond' && (
        <label className="lc-slider">
          <span className="eyebrow">second FCC cell, shifted along x, y and z</span>
          <input type="range" min={0} max={1} step={0.01} value={c.offset} onChange={(e) => C({ offset: +e.target.value })} />
          <span className="mono">{(c.offset * 0.25).toFixed(2)}·a</span>
        </label>
      )}
      <p className="lc-note">
        {c.cell === 'sc' && 'An atom at each corner; the cell of side a repeats in x, y and z.'}
        {c.cell === 'bcc' && 'Body-centred cubic: one more atom at the centre of the cube.'}
        {c.cell === 'fcc' && 'Face-centred cubic: one more atom at the centre of each face.'}
        {c.cell === 'diamond' &&
          (c.offset > 0.97
            ? 'Silicon: two merged FCC cells. Every atom now has four neighbours at √3·a/4 ≈ 0.235 nm.'
            : 'Slide the second FCC cell in: silicon is two FCC cells merged with an offset.')}
      </p>
    </section>
  )
}

const PRESETS: [number, number, number][] = [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 0]]
export function MillerPanel() {
  const c = useApp((s) => s.crystal)
  const set = useApp((s) => s.set)
  const [h, k, l] = c.hkl
  const zero = h === 0 && k === 0 && l === 0
  const setHkl = (hkl: [number, number, number]) => set({ crystal: { ...c, hkl } })
  const [ints, setInts] = useState(['1', '2', '∞'])
  const parsed = ints.map((t) => (/^(∞|inf)$/i.test(t.trim()) ? Infinity : Number(t)))
  let fromInt: [number, number, number] | null = null
  try {
    if (parsed.every((v) => v === Infinity || (Number.isFinite(v) && v !== 0)) && !parsed.every((v) => v === Infinity)) fromInt = millerFromIntercepts(parsed[0], parsed[1], parsed[2])
  } catch {
    fromInt = null
  }
  const icpt = (n: number) => (n === 0 ? '∞' : `a/${n}`.replace('a/1', 'a').replace('a/-1', '−a'))
  const red = zero ? [0, 0, 0] : reduceHkl(h, k, l)
  return (
    <section className="lc gp" aria-label="Miller indices">
      <span className="eyebrow lc-head">Miller indices <SourceButton refs={[T3(6)]} /></span>
      <div className="gp-hkl">
        <span className="mono">(</span>
        {(['h', 'k', 'l'] as const).map((n, i) => (
          <input
            key={n} type="number" min={-3} max={3} step={1} value={c.hkl[i]} aria-label={n}
            onChange={(e) => {
              const v = Math.max(-3, Math.min(3, Math.round(+e.target.value || 0)))
              const next = [...c.hkl] as [number, number, number]
              next[i] = v
              setHkl(next)
            }}
          />
        ))}
        <span className="mono">)</span>
        {PRESETS.map((p) => (
          <button key={p.join()} className="chip" aria-pressed={p.join() === c.hkl.join()} onClick={() => setHkl(p)}>
            ({p.join('')})
          </button>
        ))}
      </div>
      {zero ? (
        <p className="lc-note">(000) is not a plane: at least one index must be non-zero.</p>
      ) : (
        <dl className="gp-read mono">
          <dt>intercepts</dt>
          <dd>{icpt(h)}, {icpt(k)}, {icpt(l)}</dd>
          <dt>normal</dt>
          <dd>[{red.join(' ')}] ⟂ ({red.join(' ')})</dd>
          <dt>atoms / a²</dt>
          <dd>{sheetDensity(h, k, l).toFixed(3)}</dd>
          <dt>atoms / cm²</dt>
          <dd>{sci(sheetDensityCm2(h, k, l), 3)}</dd>
          <dt>vs (100)</dt>
          <dd>× {(sheetDensity(h, k, l) / 2).toFixed(2)}</dd>
        </dl>
      )}
      <details className="gp-int">
        <summary className="eyebrow">from intercepts</summary>
        <div className="gp-hkl">
          {ints.map((t, i) => (
            <input key={i} type="text" value={t} aria-label={['x', 'y', 'z'][i] + ' intercept'} onChange={(e) => setInts(ints.map((x, j) => (j === i ? e.target.value : x)))} />
          ))}
          <span className="mono">→ {fromInt ? `(${fromInt.join(' ')})` : '?'}</span>
          {fromInt && (
            <button className="chip" onClick={() => setHkl(fromInt!.map((v) => Math.max(-3, Math.min(3, v))) as [number, number, number])}>
              show
            </button>
          )}
        </div>
        <p className="lc-fine">Intercepts in units of a; ∞ for a plane parallel to that axis. Reciprocals, then clear fractions.</p>
      </details>
    </section>
  )
}

export function BandsPanel() {
  const c = useApp((s) => s.crystal)
  const set = useApp((s) => s.set)
  const b = bandsAt(c.r)
  const text = {
    isolated: 'Far apart (r = d): no interaction. Each atom keeps its 3s and 3p levels.',
    splitting: 'Below r = c the 3s and 3p electrons of neighbours interact: each level spreads into a band of closely packed levels.',
    merged: 'At r = b the gap between the 3s and 3p bands disappears: 8N levels, continuously distributed.',
    gap: c.r < 1.06 ? 'At the crystal spacing r = a: 4N filled levels (valence band) sit below 4N empty ones (conduction band), across the forbidden gap.' : 'Closer than b, the merged band splits again into two bands of 4N levels and a gap opens.',
  }[b.regime]
  return (
    <section className="lc gp" aria-label="Energy bands">
      <span className="eyebrow lc-head">atoms to bands <SourceButton refs={[T3(8), T3(9), T3(10)]} /></span>
      <label className="lc-slider">
        <span className="eyebrow">interatomic spacing r</span>
        <input type="range" min={0.9} max={2.9} step={0.01} value={c.r} onChange={(e) => set({ crystal: { ...c, r: +e.target.value } })} />
        <span className="mono">{c.r.toFixed(2)} a</span>
      </label>
      <div className="lc-quick">
        {(['a', 'b', 'c', 'd'] as const).map((m) => (
          <button key={m} className="chip" onClick={() => set({ crystal: { ...c, r: { a: 1, b: 1.4, c: 1.9, d: 2.8 }[m] } })}>
            r = {m}
          </button>
        ))}
      </div>
      <BandsChart r={c.r} />
      <p className="lc-note">{text}</p>
      <SolidsStrip active={c.r < 1.06 ? 'semiconductor' : null} />
    </section>
  )
}

export function DefectsPanel() {
  const c = useApp((s) => s.crystal)
  const set = useApp((s) => s.set)
  const ci = cI(c.T)
  const cv = cV(c.T)
  const show = (v: number) => (v < 1 ? '≈ 0' : sci(v))
  return (
    <section className="lc gp" aria-label="Point defects">
      <span className="eyebrow lc-head">point defects in equilibrium <SourceButton refs={[T3(21), T3(22)]} /></span>
      <label className="lc-slider">
        <span className="eyebrow">temperature</span>
        <input type="range" min={25} max={1400} step={5} value={c.T} onChange={(e) => set({ crystal: { ...c, T: +e.target.value } })} />
        <span className="mono">{c.T} °C</span>
      </label>
      <p className="gp-eq mono">C_I* ≈ 1×10²⁷ exp(−3.8 eV/kT) · C_V* ≈ 9×10²³ exp(−2.6 eV/kT)</p>
      <dl className="gp-read mono">
        <dt>interstitials</dt>
        <dd>{show(ci)} cm⁻³</dd>
        <dt>vacancies</dt>
        <dd>{show(cv)} cm⁻³</dd>
        <dt>per Si atom</dt>
        <dd>{cv < 1 ? '≈ 0' : `1 V in ${sci(SI_ATOMS / cv, 1)}`}</dd>
      </dl>
      <p className="lc-fine">C_I* ≠ C_V*, and both climb steeply with T: ≈ 0 at room temperature, 10¹²–10¹⁴ cm⁻³ at 1000 °C. Si has 5 × 10²² atoms per cm³.</p>
    </section>
  )
}
