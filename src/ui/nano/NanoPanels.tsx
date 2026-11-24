import { Fragment, useMemo } from 'react'
import { useAtlas } from '../../state/store'
import { SourceButton } from '../source/Source'
import { T6, T8 } from '../../sources'
import { transition } from '../../scene/transition'
import { alignment, confinedLevels, Ec, Ev, MAT, MATERIALS, mismatch, SAMPLE, SAMPLES, spans } from '../../chapters/nano/hetero'
import { barrierProbability, boxLevels, countStates, dos1, dos2, dos3, finiteWell, freeEnergy, HB, infiniteLevel, KT300 } from '../../chapters/nano/quantum'
import { colloidColour, colloidGapEv, qdLaserThreshold, skState, SK_CRITICAL_ML, VLS_STEPS } from '../../chapters/nano/fab'
import { regime, SCALE_OBJECTS } from '../../chapters/nano/scale'
import { Chart, Seg, Slider, Stepper } from '../controls'
import '../growth/growth.css'

/** Chapter 7 (Topic 8) controls; numbers from chapters/nano/*.ts */
type Nano = ReturnType<typeof useAtlas.getState>['nano']
const useNano = () => [useAtlas((s) => s.nano), (p: Partial<Nano>) => useAtlas.getState().set({ nano: { ...useAtlas.getState().nano, ...p } })] as const
const meV = (e: number) => `${(e * 1000).toFixed(1)} meV`

function SamplePicker() {
  const [n, set] = useNano()
  return <Seg label="Sample" items={SAMPLES.map((s) => [s.id, s.id === 'qw' ? 'GaAs QW' : s.id === 'mqw' ? 'InGaAs MQW' : s.id === 'type2' ? 'type II' : 'QD laser'] as [string, string])} value={n.sample} on={(sample) => set({ sample, grown: SAMPLE[sample].layers.length })} />
}

function QmbePanel() {
  const [n, set] = useNano()
  const h = SAMPLE[n.sample]
  const sp = spans(h)
  return (
    <section className="lc gp" aria-label="III–V MBE">
      <span className="eyebrow lc-head">growing a heterostructure <SourceButton refs={[T8(9), T8(14), T8(22), T6(17)]} /></span>
      <SamplePicker />
      <ol className="gp-steps">
        {sp.map((l, i) => (
          <li key={i} className={i + 1 === n.grown ? 'on' : i < n.grown ? 'done' : ''}><span className="mono gp-n">{i + 1}</span><span>{MAT[l.mat].name} · {l.nm} nm · {l.role}</span></li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={n.grown >= h.layers.length} onClick={() => set({ grown: n.grown + 1 })}>grow next layer →</button>
        <button className="chip" onClick={() => set({ grown: 1 })}>regrow</button>
        <button className="chip" onClick={() => void transition.go('qsample')}>the sample →</button>
      </div>
      <p className="lc-fine">MBE’s precise thickness control and low growth rate make the sharpest interfaces and the best quantum dots (better than MOCVD and CVD).</p>
    </section>
  )
}

function ScalePanel() {
  const [n, set] = useNano()
  const nm = Math.pow(10, n.logSize + 9)
  const r = regime(nm)
  return (
    <section className="lc gp" aria-label="The nanoscale">
      <span className="eyebrow lc-head">nanotechnology <SourceButton refs={[T8(2), T8(3)]} /></span>
      <p className="lc-fine">Understanding and control of matter at roughly <b>1 to 100 nm</b>, where unique properties emerge: physical, chemical and biological properties differ from those of atoms and of everyday objects.</p>
      <Slider label="size" value={n.logSize} min={-10.3} max={-0.9} step={0.05} on={(logSize) => set({ logSize })} fmt={() => (nm >= 1e6 ? `${(nm / 1e6).toPrecision(2)} mm` : nm >= 1e3 ? `${(nm / 1e3).toPrecision(2)} µm` : `${nm.toPrecision(2)} nm`)} />
      <dl className="gp-read mono">
        <dt>regime</dt><dd>{r.name}</dd>
        <dt>what governs it</dt><dd>{r.note}</dd>
        <dt>nearest object</dt><dd>{SCALE_OBJECTS.reduce((a, o) => (Math.abs(Math.log10(o.nm / nm)) < Math.abs(Math.log10(a.nm / nm)) ? o : a)).name}</dd>
      </dl>
      <p className="lc-fine">Slide 3: a volume semiconductor (1 cm) has band structure; a waveguide is set by the wavelength of light (1 µm); a quantum dot (10 nm) by the electrons’ de Broglie wavelength at 300 K; an atom (1 Å) has discrete levels.</p>
      <div className="lc-quick"><button className="chip" onClick={() => useAtlas.getState().set({ tab: 'sample' })}>the grown sample →</button></div>
    </section>
  )
}

function SampleInfoPanel() {
  return (
    <section className="lc gp" aria-label="Sample">
      <span className="eyebrow lc-head">the sample <SourceButton refs={[T8(9), T8(14)]} /></span>
      <SamplePicker />
      <p className="lc-fine">The layers are nanometres thick on a substrate half a millimetre thick: they show only at the cleaved edge, drawn here tens of thousands of times taller. Scroll in to them.</p>
    </section>
  )
}

function HeteroPanel() {
  const [n] = useNano()
  const h = SAMPLE[n.sample]
  const sub = MAT[h.layers[0].mat]
  return (
    <section className="lc gp" aria-label="Heterostructure">
      <span className="eyebrow lc-head">heterostructure layers <SourceButton refs={[T8(9), T8(11), T8(14)]} /></span>
      <SamplePicker />
      <table className="gp-table mono">
        <thead><tr><th>layer</th><th>nm</th><th>Eg</th><th>mismatch</th></tr></thead>
        <tbody>
          {[...h.layers].reverse().map((l, i) => (
            <tr key={i}><td>{MAT[l.mat].name}</td><td>{l.nm}</td><td>{MAT[l.mat].Eg.toFixed(2)}</td><td>{(mismatch(MAT[l.mat], sub) * 100).toFixed(1)} %</td></tr>
          ))}
        </tbody>
      </table>
      <p className="lc-fine">A narrow-gap layer a few nm thick between wider-gap layers is a quantum well: carriers confined to a plane. Band gaps and offsets are 300 K values beyond the lecture (Vurgaftman et al. 2001).</p>
    </section>
  )
}

function BandsPanel() {
  const [n] = useNano()
  const h = SAMPLE[n.sample]
  const lv = useMemo(() => ({ e: confinedLevels(h, 'e', 0.2, 3), h: confinedLevels(h, 'h', 0.2, 3) }), [h])
  const e1 = lv.e.levels[0]
  const h1 = lv.h.levels[0]
  return (
    <section className="lc gp" aria-label="Band diagram">
      <span className="eyebrow lc-head">band diagram and levels <SourceButton refs={[T8(9), T8(10), T8(11)]} /></span>
      <SamplePicker />
      <dl className="gp-read mono">
        {lv.e.levels.map((l, i) => <Fragment key={`e${i}`}><dt>e{i + 1}</dt><dd>{meV(l.E - Math.min(...h.layers.map((x) => Ec(MAT[x.mat]))))} above the well’s Ec</dd></Fragment>)}
        {lv.h.levels.map((l, i) => <Fragment key={`h${i}`}><dt>hh{i + 1}</dt><dd>{meV(Math.max(...h.layers.map((x) => Ev(MAT[x.mat]))) - l.E)} below the well’s Ev</dd></Fragment>)}
        {e1 && h1 && <><dt>e1 → hh1</dt><dd>{(e1.E - h1.E).toFixed(3)} eV · {(1239.84 / (e1.E - h1.E)).toFixed(0)} nm</dd></>}
      </dl>
      <p className="lc-fine">Solved numerically on the actual profile (finite differences, BenDaniel–Duke mass matching). The confined transition sits above the well’s band gap: confinement blue-shifts the light.</p>
    </section>
  )
}

function AlignPanel() {
  const [n, set] = useNano()
  const a = alignment(MAT[n.well], MAT[n.barrier])
  const opts = MATERIALS.map((m) => [m.id, m.name] as [string, string])
  return (
    <section className="lc gp" aria-label="Band alignment">
      <span className="eyebrow lc-head">type I and type II <SourceButton refs={[T8(11)]} /></span>
      <label className="lc-slider"><span className="eyebrow">well</span>
        <select value={n.well} onChange={(e) => set({ well: e.target.value })}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <label className="lc-slider"><span className="eyebrow">barriers</span>
        <select value={n.barrier} onChange={(e) => set({ barrier: e.target.value })}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </label>
      <div className="lc-quick">
        <button className="chip" onClick={() => set({ well: 'GaAs', barrier: 'AlGaAs' })}>GaAs in AlGaAs</button>
        <button className="chip" onClick={() => set({ well: 'InP', barrier: 'InAlAs' })}>InP in InAlAs</button>
        <button className="chip" onClick={() => set({ well: 'GaAs', barrier: 'GaSb' })}>GaAs in GaSb</button>
      </div>
      <dl className="gp-read mono">
        <dt>type</dt><dd>{a.type === 'III' ? 'II (broken gap)' : a.type}</dd>
        <dt>electron in</dt><dd>{a.electronIn === 'well' ? MAT[n.well].name : MAT[n.barrier].name}</dd>
        <dt>hole in</dt><dd>{a.holeIn === 'well' ? MAT[n.well].name : MAT[n.barrier].name}</dd>
        <dt>ΔEc · ΔEv</dt><dd>{meV(a.dEc)} · {meV(a.dEv)}</dd>
      </dl>
      <p className="lc-fine">{a.type === 'I' ? 'Type I: one gap nests inside the other; electron and hole share a layer and recombine efficiently.' : 'Type II: staggered gaps; the electron and hole sit in different layers and their recombination time is long.'}</p>
    </section>
  )
}

/** the points on slide 10, each one a state of the model */
const WELL_POINTS: { t: string; s: Partial<Nano> }[] = [
  { t: 'Energy is quantised; even the lowest level is above zero', s: { finite: false, L: 10, level: 1, prob: false } },
  { t: 'The particle has the energy of one level, never between', s: { finite: false, L: 10, level: 2, prob: true } },
  { t: 'Large L: the levels crowd into a classical continuum', s: { finite: false, L: 60, level: 1 } },
  { t: 'Finite well: ψ is not zero at the walls', s: { finite: true, V0: 0.15, L: 10, prob: false, level: 1 } },
  { t: 'Finite-well levels lie below the infinite ones', s: { finite: true, V0: 0.3, L: 10, level: 1 } },
  { t: 'A deeper well approaches the infinite well', s: { finite: true, V0: 1.2, L: 10, level: 1 } },
  { t: 'Tunnelling: probability inside the barrier', s: { finite: true, V0: 0.08, L: 5, prob: true, level: 1 } },
]

function FreePanel() {
  const [n, set] = useNano()
  return (
    <section className="lc gp" aria-label="Free electron">
      <span className="eyebrow lc-head">the free electron <SourceButton refs={[T8(4), T8(5)]} /></span>
      <p className="gp-eq mono">d²ψ/dx² + (2m/ħ²)(E − V)ψ = 0 · V = 0: ψ = Ae^(ikx), E = ħ²k²/2m</p>
      <Slider label="k" value={n.k} min={0} max={1.2} step={0.01} unit="nm⁻¹" on={(k) => set({ k })} fmt={(v) => v.toFixed(2)} />
      <Seg label="Mass" items={[[1, 'free m₀'], [0.067, 'GaAs 0.067 m₀']]} value={n.m === 1 ? 1 : 0.067} on={(m) => set({ m })} />
      <dl className="gp-read mono"><dt>E</dt><dd>{meV(freeEnergy(n.k, n.m))}</dd><dt>k = √(2mE/ħ²)</dt><dd>any value: a continuum</dd></dl>
      <p className="lc-fine">Ψ(x,t) = ψ(x)·e^(−iEt/ħ). Without walls every k is allowed, so bulk material has a continuum of energies.</p>
    </section>
  )
}

function WellPanel() {
  const [n, set] = useNano()
  const fin = useMemo(() => (n.finite ? finiteWell(n.L, n.V0, n.m) : []), [n.finite, n.L, n.V0, n.m])
  const rows = n.finite ? fin.map((l) => ({ n: l.n, E: l.E, inf: infiniteLevel(l.n, n.L, n.m), out: barrierProbability(l, n.L, n.V0, n.m) })) : [1, 2, 3, 4].map((k) => ({ n: k, E: infiniteLevel(k, n.L, n.m), inf: infiniteLevel(k, n.L, n.m), out: 0 }))
  return (
    <section className="lc gp" aria-label="Quantum well">
      <span className="eyebrow lc-head">the quantum well <SourceButton refs={[T8(6), T8(7), T8(8), T8(10)]} /></span>
      <p className="gp-eq mono">Eₙ = n²π²ħ²/(2mL²) · ψₙ = √(2/L) sin(nπx/L)</p>
      <Seg label="Walls" items={[['inf', 'infinite'], ['fin', 'finite']]} value={n.finite ? 'fin' : 'inf'} on={(v) => set({ finite: v === 'fin' })} />
      <Slider label="width L" value={n.L} min={2} max={60} step={0.5} unit="nm" on={(L) => set({ L })} />
      {n.finite && <Slider label="depth V₀" value={n.V0} min={0.03} max={1.5} step={0.01} unit="eV" on={(V0) => set({ V0 })} fmt={(v) => v.toFixed(2)} />}
      <Seg label="Mass" items={[[1, 'm₀'], [0.067, 'GaAs']]} value={n.m === 1 ? 1 : 0.067} on={(m) => set({ m })} />
      <Seg label="Show" items={[['psi', 'ψ'], ['prob', '|ψ|²']]} value={n.prob ? 'prob' : 'psi'} on={(v) => set({ prob: v === 'prob' })} />
      <table className="gp-table mono">
        <thead><tr><th>n</th><th>E</th>{n.finite && <th>infinite</th>}{n.finite && <th>in barrier</th>}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.n} className={r.n === n.level ? 'on' : ''} onClick={() => set({ level: r.n })}><td>{r.n}</td><td>{meV(r.E)}</td>{n.finite && <td>{meV(r.inf)}</td>}{n.finite && <td>{(r.out * 100).toFixed(1)} %</td>}</tr>
        ))}</tbody>
      </table>
      <span className="eyebrow">slide 10, point by point</span>
      <div className="gp-chips">
        {WELL_POINTS.map((p, i) => <button key={i} className="chip" onClick={() => set(p.s)}>{i < 3 ? 'infinite' : 'finite'}: {p.t}</button>)}
      </div>
      <p className="lc-fine">The finite well is solved exactly (the even/odd matching equations, by bisection). Normalising ∫₀ᴸ A² sin²(nπx/L) dx = A²L/2 = 1 gives A = √(2/L).</p>
    </section>
  )
}

function ConfinePanel() {
  const [n, set] = useNano()
  const lv = useMemo(() => boxLevels(n.dims, n.a, n.b, n.c, n.m, 5), [n.dims, n.a, n.b, n.c, n.m])
  return (
    <section className="lc gp" aria-label="Well, wire, dot">
      <span className="eyebrow lc-head">well → wire → dot <SourceButton refs={[T8(9), T8(12), T8(13)]} /></span>
      <Seg label="Confined directions" items={[[1, 'well (1)'], [2, 'wire (2)'], [3, 'dot (3)']]} value={n.dims} on={(dims) => set({ dims })} />
      <p className="gp-eq mono">
        {n.dims === 1 && 'E = ħ²(kx² + ky²)/2m + ħ²n²π²/(2ma²)'}
        {n.dims === 2 && 'E = ħ²kx²/2m + (ħ²π²/2m)(n²/a² + l²/b²)'}
        {n.dims === 3 && 'E = (ħ²π²/2m)(n²/a² + l²/b² + j²/c²)'}
      </p>
      <Slider label="a" value={n.a} min={3} max={30} step={0.5} unit="nm" on={(a) => set({ a })} />
      {n.dims >= 2 && <Slider label="b" value={n.b} min={3} max={30} step={0.5} unit="nm" on={(b) => set({ b })} />}
      {n.dims >= 3 && <Slider label="c" value={n.c} min={3} max={30} step={0.5} unit="nm" on={(c) => set({ c })} />}
      <Seg label="Mass" items={[[1, 'm₀'], [0.067, 'GaAs']]} value={n.m === 1 ? 1 : 0.067} on={(m) => set({ m })} />
      <dl className="gp-read mono">{lv.map((l, i) => <Fragment key={i}><dt>({l.q.join(', ')})</dt><dd>{meV(l.E)}{n.dims < 3 ? ' + free motion' : ''}</dd></Fragment>)}</dl>
      <p className="lc-fine">Quantum numbers run 1, 2, 3… (the slides’ ±n repeat the same standing wave). A dot has only discrete levels: an “artificial atom”.</p>
    </section>
  )
}

function DosPanel() {
  const [n, set] = useNano()
  const a = 10
  const m = n.m
  const Emax = 0.3
  const sub = (k: number) => infiniteLevel(k, a, m)
  const Es = useMemo(() => Array.from({ length: 300 }, (_, i) => (Emax * (i + 0.5)) / 300), [Emax])
  // one shared energy axis: 3D bulk; a 10 nm well (subbands n); a 10 × 10 nm wire; a 10 nm dot
  const ser = useMemo(() => {
    const well = Es.map((E) => { let s = 0; for (let k = 1; k < 6; k++) s += dos2(E - sub(k), m) / a; return s })
    const wireLv = boxLevels(2, a, a, a, m, 8).map((l) => l.E)
    const wire = Es.map((E) => wireLv.reduce((s, e0) => s + dos1(E - e0, m) / (a * a), 0))
    const bulk = Es.map((E) => dos3(E, m))
    return { bulk, well, wire, dot: boxLevels(3, a, a, a, m, 6).map((l) => l.E) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, Es])
  const top = Math.max(...ser.bulk) * 1.6
  const cnt = n.dof ? countStates(n.dof as 1 | 2 | 3, Math.sqrt(((n.E / 1000) * m) / HB), 60) : null
  const hi = (d: number) => (n.dof === d ? undefined : 'ref')
  return (
    <section className="lc gp" aria-label="Density of states">
      <span className="eyebrow lc-head">density of states <SourceButton refs={[T8(23), T8(24), T8(25), T8(26), T8(27), T8(28), T8(29), T8(30), T8(31)]} /></span>
      <p className="gp-eq mono">ρ(E) = (1/V) dN/dE</p>
      <Seg label="Degrees of freedom" items={[[3, '3D'], [2, '2D well'], [1, '1D wire'], [0, '0D dot']]} value={n.dof} on={(dof) => set({ dof })} />
      <Slider label="energy E" value={n.E} min={2} max={250} step={1} unit="meV" on={(E) => set({ E })} />
      <Chart label="Density of states for bulk, well, wire and dot on one energy axis" xl="E (eV) above the bulk band edge" yl="ρ" x={{ min: 0, max: Emax, ticks: [0, 0.1, 0.2, 0.3] }} y={{ min: 0, max: top }}
        series={[
          { pts: Es.map((E, i) => [E, ser.bulk[i]] as [number, number]), cls: hi(3), stroke: 'var(--series-blue)' },
          { pts: Es.map((E, i) => [E, ser.well[i]] as [number, number]), cls: hi(2), stroke: 'var(--series-red)' },
          { pts: Es.map((E, i) => [E, Math.min(top, ser.wire[i])] as [number, number]), cls: hi(1), stroke: 'var(--series-teal)' },
          ...ser.dot.filter((e) => e < Emax).map((e) => ({ pts: [[e, 0], [e, top * 0.95]] as [number, number][], cls: hi(0), stroke: 'var(--amber-ink)' })),
        ]}
        marks={[{ x: n.E / 1000, y: 0, cls: 'marker' }]} />
      <p className="lc-fine">Blue: bulk ∝ E^½. Red: a 10 nm well, a step at each subband. Green: a 10 × 10 nm wire, ∝ (E − Eₙ)^−½ spikes. Amber: a 10 nm dot, delta functions. {m === 1 ? 'Free-electron mass.' : 'GaAs mass.'}</p>
      {cnt && <dl className="gp-read mono"><dt>states counted</dt><dd>{cnt.counted}</dd><dt>formula</dt><dd>{cnt.formula.toFixed(0)}</dd></dl>}
      {cnt && <p className="lc-fine">The points on the axes planes (n = 0) are not states, so a small sphere holds fewer than the formula; the two agree once k ≫ π/L.</p>}
      <p className="lc-fine">{n.dof === 3 && 'Each state takes π³/V of k-space; the sphere 4πk³/3, ×2 spin, ×⅛ for positive k: N = k³V/3π² → ρ = (1/2π²)(2m/ħ²)^(3/2)E^½.'}
        {n.dof === 2 && 'Each state takes π²/A; the circle πk², ×2, ×¼: N = k²A/2π → ρ = m/πħ², constant: many states right at the band edge.'}
        {n.dof === 1 && 'Each state takes π/L; the line from −k to k (length 2k), ×2, ×½: N = 2kL/π → ρ = (1/π)√(2m/ħ²)E^−½. The slide’s kL/π and 1/2π are half of this.'}
        {n.dof === 0 && 'No free motion, no k-space to fill: ρ = 2δ(E − Eₙ) for each level (the slide’s σ is a δ).'}
      </p>
      <Seg label="Mass" items={[[1, 'm₀'], [0.067, 'GaAs']]} value={m === 1 ? 1 : 0.067} on={(mm) => set({ m: mm })} />
    </section>
  )
}

/* ── fabrication ─────────────────────────────────────────────────────── */

function WiresPanel() {
  return (
    <section className="lc gp" aria-label="Quantum wires">
      <span className="eyebrow lc-head">making quantum wires <SourceButton refs={[T8(15), T8(16)]} /></span>
      <p className="lc-fine">Start from an A/B/A quantum well (confined in one direction). (a) Etch it into a narrow ridge: the walls confine the second direction. (b) Put two gates on top with a gap: negative voltage depletes the well under them, leaving a strip under the gap.</p>
      <div className="lc-quick"><button className="chip" onClick={() => useAtlas.getState().set({ tab: 'vls' })}>grow them bottom-up instead →</button></div>
    </section>
  )
}

function VlsPanel() {
  const [n, set] = useNano()
  return (
    <section className="lc gp" aria-label="VLS growth">
      <span className="eyebrow lc-head">vapour–liquid–solid nanowires <SourceButton refs={[T8(16)]} /></span>
      <Seg label="Seed" items={[['au', 'Au seed'], ['self', 'self-catalysed (Ga)']]} value={n.seed} on={(seed) => set({ seed })} />
      <Stepper steps={VLS_STEPS.map((s) => `${s.t}: ${s.p}`)} at={Math.min(n.fstep + 1, 5)} set={(k) => set({ fstep: Math.max(0, k - 1) })} start="deposit the seed" />
      <p className="lc-fine">Wagner and Ellis, 1964. Direct epitaxy on GaAs(111)B with metal (Au) or self-catalysed (Ga) droplets.</p>
    </section>
  )
}

function PillarsPanel() {
  const [n, set] = useNano()
  return (
    <section className="lc gp" aria-label="Lithographic dots">
      <span className="eyebrow lc-head">dots by lithography <SourceButton refs={[T8(17), T8(18)]} /></span>
      <p className="lc-fine">Three routes to 3D confinement: lithography, colloidal chemistry, epitaxy. Here: e-beam lithography, then etch pillars through a GaAs/AlGaAs/InGaAs/AlGaAs/GaAs well. The well confines vertically; the pillar the other two directions.</p>
      <div className="lc-quick"><button className="chip" onClick={() => set({ fstep: n.fstep >= 1 ? 0 : 1 })}>{n.fstep >= 1 ? 'un-etch' : 'pattern and etch →'}</button></div>
      <p className="lc-fine">Against: slow, contamination, low density, defect formation (etch damage on the walls).</p>
    </section>
  )
}

function ColloidPanel() {
  const [n, set] = useNano()
  const E = colloidGapEv(n.dotNm)
  return (
    <section className="lc gp" aria-label="Colloidal dots">
      <span className="eyebrow lc-head">colloidal dots <SourceButton refs={[T8(19)]} /></span>
      <Slider label="diameter" value={n.dotNm} min={3} max={8} step={0.1} unit="nm" on={(dotNm) => set({ dotNm })} fmt={(v) => v.toFixed(1)} />
      <dl className="gp-read mono">
        <dt>emission</dt><dd><span style={{ display: 'inline-block', width: 12, height: 12, background: colloidColour(n.dotNm), borderRadius: 6, verticalAlign: 'middle' }} /> {(1239.84 / E).toFixed(0)} nm · {E.toFixed(2)} eV</dd>
      </dl>
      <p className="lc-fine">Precipitated from solution or a host (e.g. a polymer), sometimes capped with bonded molecules to stay stable; core–shell (CdSe core, ZnS shell); typically II–VI. Bigger dots red, smaller blue. Against: size dispersion. Colour model: Brus (1984), beyond the lecture.</p>
    </section>
  )
}

function PatternedPanel() {
  const [n, set] = useNano()
  return (
    <section className="lc gp" aria-label="Patterned growth">
      <span className="eyebrow lc-head">patterned growth <SourceButton refs={[T8(20)]} /></span>
      <p className="lc-fine">Recesses opened by selective etching in a mask; dots grow in the pyramid-shaped recesses (Fukui 1991: GaAs tetrahedral dots in AlGaAs by selective-area MOCVD on (111)B GaAs).</p>
      <div className="lc-quick"><button className="chip" onClick={() => set({ fstep: n.fstep >= 1 ? 0 : 1 })}>{n.fstep >= 1 ? 'back to the mask' : 'grow →'}</button></div>
      <p className="lc-fine">Against: the dot density is limited by the mask pattern.</p>
    </section>
  )
}

function SkPanel() {
  const [n, set] = useNano()
  const ml = n.fstep * 0.5
  const st = skState(ml)
  return (
    <section className="lc gp" aria-label="Self-assembled dots">
      <span className="eyebrow lc-head">self-assembled dots <SourceButton refs={[T8(21), T8(22)]} /></span>
      <Slider label="InAs deposited" value={n.fstep} min={0} max={6} step={1} unit="ML" on={(fstep) => set({ fstep })} fmt={(v) => (v * 0.5).toFixed(1)} />
      <dl className="gp-read mono">
        <dt>state</dt><dd>{st.islands ? 'islands on a wetting layer' : '2D wetting layer'}</dd>
        {st.islands && <><dt>islands</dt><dd>~{st.h.toFixed(0)} nm high · ~{st.w.toFixed(0)} nm wide</dd></>}
      </dl>
      <p className="lc-fine">Stranski–Krastanov growth (MBE or MOCVD): the mismatch strain turns the 2D layer into 3D islands, typically 2–10 nm high and 20–40 nm wide. The ≈ {SK_CRITICAL_ML} ML switch-over is beyond the lecture. Against: size and shape fluctuations, ordering. Control initiation by local strain, dislocations, growth conditions or patterning.</p>
    </section>
  )
}

function LaserPanel() {
  const [n, set] = useNano()
  const I = Array.from({ length: 71 }, (_, i) => i)
  const pi = (th: number, slope: number) => I.map((c) => [c, Math.max(0, (c - th) * slope)] as [number, number])
  const qd = qdLaserThreshold(n.T, 'qd')
  const qw = qdLaserThreshold(n.T, 'qw')
  return (
    <section className="lc gp" aria-label="Quantum-dot laser">
      <span className="eyebrow lc-head">the quantum-dot laser <SourceButton refs={[T8(32), T8(33)]} /></span>
      <Slider label="temperature" value={n.T} min={-40} max={100} step={5} unit="°C" on={(T) => set({ T })} />
      <Chart label="Output power against current" xl="current (mA)" yl="mW" x={{ min: 0, max: 70, ticks: [0, 20, 40, 60] }} y={{ min: 0, max: 10, ticks: [0, 5, 10] }}
        series={[{ pts: pi(qd, 0.25) }, { pts: pi(qw, 0.25 * Math.exp(-(n.T - 25) / 150)), cls: 'ref', stroke: 'var(--series-red)' }]} />
      <dl className="gp-read mono"><dt>threshold QD · QW</dt><dd>{qd.toFixed(0)} mA · {qw.toFixed(0)} mA</dd><dt>kT</dt><dd>{(KT300 * (n.T + 273.15) / 300 * 1000).toFixed(0)} meV</dd></dl>
      <p className="lc-fine">Why dots: δ-function DoS → narrow emission; large level spacing (≫ kT) → carriers stay in the ground state → temperature-independent lasing; tiny active volume → very low threshold. Also: single-photon sources, QD infrared photodetectors, solar cells. Curves illustrative (characteristic-temperature model), after slide 33.</p>
    </section>
  )
}

export function QmbePanels() { return <QmbePanel /> }
export function QsamplePanels() { return useAtlas((s) => s.tab) === 'sample' ? <SampleInfoPanel /> : <ScalePanel /> }
export function HeteroPanels() { return <HeteroPanel /> }
export function QbandsPanels() { return useAtlas((s) => s.tab) === 'align' ? <AlignPanel /> : <BandsPanel /> }
export function QwavePanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'well') return <WellPanel />
  if (tab === 'confine') return <ConfinePanel />
  if (tab === 'dos') return <DosPanel />
  return <FreePanel />
}
export function NanofabPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'vls') return <VlsPanel />
  if (tab === 'pillars') return <PillarsPanel />
  if (tab === 'colloid') return <ColloidPanel />
  if (tab === 'patterned') return <PatternedPanel />
  if (tab === 'sk') return <SkPanel />
  if (tab === 'laser') return <LaserPanel />
  return <WiresPanel />
}
