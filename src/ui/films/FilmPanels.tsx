import { useEffect, useRef } from 'react'
import { useAtlas } from '../../state/store'
import { SourceButton } from '../source/Source'
import { T5, T6 } from '../../sources'
import { transition } from '../../scene/transition'
import { csOverCg, cvdRate, epiProfile, flux, gasDensity, hG, kS, meanFreePath, mlPerSecond, monolayerTime, SEMI_BY_ID, SEMIS, stepCoverage, strainState, vacuumClass } from '../../chapters/films/physics'
import { mbeLive } from '../../chapters/films/live'
import { sci } from '../../chapters/growth/lab'
import '../growth/growth.css'

/** Chapter 4 and 5 controls (Topics 5 and 6); numbers from chapters/films/physics.ts */
type Films = ReturnType<typeof useAtlas.getState>['films']
type Epi = ReturnType<typeof useAtlas.getState>['epi']
const useFilms = () => [useAtlas((s) => s.films), (p: Partial<Films>) => useAtlas.getState().set({ films: { ...useAtlas.getState().films, ...p } })] as const
const useEpi = () => [useAtlas((s) => s.epi), (p: Partial<Epi>) => useAtlas.getState().set({ epi: { ...useAtlas.getState().epi, ...p } })] as const

function Slider({ label, value, min, max, step, unit, on, fmt }: { label: string; value: number; min: number; max: number; step: number; unit?: string; on: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="lc-slider">
      <span className="eyebrow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} />
      <span className="mono">{fmt ? fmt(value) : value} {unit}</span>
    </label>
  )
}
function Seg<T extends string>({ items, value, on, label }: { items: [T, string][]; value: T; on: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => on(v)}>{l}</button>
      ))}
    </div>
  )
}

/** log growth velocity against 1000/T: the kS line, the hG lines at 760 and the current pressure, and the net curve (slides 19, 22) */
function KineticsChart({ T, P, Y }: { T: number; P: number; Y: number }) {
  const W = 300
  const H = 160
  const x = (inv: number) => 38 + ((inv - 0.6) / 0.6) * 252
  const y = (v: number) => 10 + ((2 - Math.log10(Math.max(v, 1e-6))) / 6) * 120
  const scale = (t: number, p: number) => (cvdRate(t, p, Y).v / ((kS(t) * hG(p)) / (kS(t) + hG(p))))
  const pts = (f: (inv: number) => number) => Array.from({ length: 61 }, (_, i) => { const inv = 0.6 + (i / 60) * 0.6; return `${i ? 'L' : 'M'}${x(inv).toFixed(1)},${y(f(inv)).toFixed(1)}` }).join('')
  const T_of = (inv: number) => 1000 / inv - 273.15
  const um = (v: number) => v * 1e4 * 60 // cm/s → µm/min
  const here = cvdRate(T, P, Y)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Growth rate against 1/T: ${here.regime} controlled`}>
      {[100, 1, 0.01, 0.0001].map((v) => (
        <g key={v}>
          <line x1={38} x2={290} y1={y(v)} y2={y(v)} className="grid" />
          <text x={34} y={y(v) + 4} className="tick" textAnchor="end">{v >= 1 ? v : v.toExponential(0)}</text>
        </g>
      ))}
      <path d={pts((i) => um(kS(T_of(i)) * scale(T_of(i), P)))} className="ref" stroke="#e48a8a" strokeDasharray="4 3" />
      <path d={pts((i) => um(hG(760) * scale(T_of(i), 760)))} className="ref" stroke="#8aa6e4" strokeDasharray="4 3" />
      {P < 700 && <path d={pts((i) => um(hG(P) * scale(T_of(i), P)))} className="ref" stroke="#8ae4c4" strokeDasharray="4 3" />}
      <path d={pts((i) => um(cvdRate(T_of(i), P, Y).v))} className="cur" />
      <circle cx={x(1000 / (T + 273.15))} cy={y(um(here.v))} r={4} className="dot" />
      <text x={290} y={22} className="tick" textAnchor="end" fill="#e48a8a">kS term</text>
      <text x={290} y={36} className="tick" textAnchor="end" fill="#8aa6e4">hG at 760 torr</text>
      {P < 700 && <text x={290} y={50} className="tick" textAnchor="end" fill="#8ae4c4">hG at {P.toPrecision(2)} torr</text>}
      <text x={164} y={H - 4} className="axis" textAnchor="middle">1000/T (K⁻¹) · growth µm/min (log)</text>
    </svg>
  )
}

function CvdPanel() {
  const [f, set] = useFilms()
  const r = cvdRate(f.T, f.P, f.Y)
  return (
    <section className="lc gp" aria-label="CVD kinetics">
      <span className="eyebrow lc-head">CVD growth kinetics <SourceButton refs={[T5(17), T5(18), T5(19), T5(22)]} /></span>
      <Seg label="Reactor" items={[['apcvd', 'APCVD · 760 torr'], ['lpcvd', 'LPCVD · 0.5 torr']]} value={f.P >= 100 ? 'apcvd' : 'lpcvd'} on={(v) => set({ P: v === 'apcvd' ? 760 : 0.5 })} />
      <Slider label="temperature" value={f.T} min={500} max={1250} step={10} unit="°C" on={(T) => set({ T })} />
      <Slider label="pressure (log)" value={Math.log10(f.P)} min={-1} max={2.88} step={0.01} unit="torr" fmt={(v) => (10 ** v >= 10 ? (10 ** v).toFixed(0) : (10 ** v).toPrecision(2))} on={(v) => set({ P: +(10 ** v).toPrecision(3) })} />
      <p className="gp-eq mono">v = kS·hG/(kS + hG) · CT·Y/N1</p>
      <dl className="gp-read mono">
        <dt>kS</dt><dd>{r.ks.toPrecision(3)} cm/s (Ea 1.6 eV)</dd>
        <dt>hG</dt><dd>{r.hg.toPrecision(3)} cm/s</dd>
        <dt>CS/CG</dt><dd>{csOverCg(r.ks, r.hg).toFixed(2)}</dd>
        <dt>control</dt><dd>{r.regime === 'reaction' ? 'surface reaction (temperature-sensitive)' : r.regime === 'transport' ? 'mass transfer (geometry-sensitive)' : 'mixed'}</dd>
        <dt>growth</dt><dd>{r.nmPerMin >= 10 ? r.nmPerMin.toFixed(0) : r.nmPerMin.toFixed(2)} nm/min</dd>
      </dl>
      <KineticsChart T={f.T} P={f.P} Y={f.Y} />
      <p className="lc-fine">k0 and hG(760 torr) are illustrative, chosen so the crossover sits near 1000 °C as on slide 20.</p>
    </section>
  )
}

function PlasmaPanel() {
  const [f, set] = useFilms()
  const notes = {
    pecvd: 'RF (13.56 MHz) between parallel plates. Radicals and ion bombardment deposit SiNₓ and SiOₓ at 200–400 °C, against 700–900 °C for LPCVD; the films are porous and not stoichiometric.',
    dc: 'The target is the cathode at −(100–300) V; Ar⁺ ions knock atoms off it. Metals and silicides only: an insulating target charges up and the current stops.',
    rf: 'RF lets insulating targets be sputtered, but it is little used commercially: big RF supplies are expensive and the self-bias heats insulators.',
    magnetron: 'Magnets trap electrons near the target on helical paths: more ionisation there, a higher sputter rate, and a plasma that survives at ~10⁻³ Torr.',
  }
  return (
    <section className="lc gp" aria-label="Plasma processes">
      <span className="eyebrow lc-head">plasma processes <SourceButton refs={[T5(29), T5(30), T5(44), T5(45), T5(46), T5(48)]} /></span>
      <Seg label="Mode" items={[['pecvd', 'PECVD'], ['dc', 'DC'], ['rf', 'RF'], ['magnetron', 'magnetron']]} value={f.plasma} on={(plasma) => set({ plasma })} />
      <p className="lc-note">{notes[f.plasma]}</p>
      <dl className="gp-read mono">
        <dt>ionisation</dt><dd>~10⁻⁴: neutrals dominate</dd>
        <dt>electrons</dt><dd>1–10 eV average</dd>
        <dt>neutrals</dt><dd>25 meV (300 K)</dd>
      </dl>
    </section>
  )
}

const VAC_ROWS = [760, 1, 1e-3, 1e-6, 1e-10]
function PvdPanel() {
  const [f, set] = useFilms()
  const P = 10 ** f.logP
  return (
    <section className="lc gp" aria-label="Evaporation and vacuum">
      <span className="eyebrow lc-head">evaporation and vacuum <SourceButton refs={[T5(38), T5(39), T5(40)]} /></span>
      <Slider label="chamber pressure (log)" value={f.logP} min={-10} max={0} step={0.5} unit="Torr" fmt={(v) => `10^${v}`} on={(logP) => set({ logP })} />
      <label className="gp-check"><input type="checkbox" checked={f.ebeam} onChange={(e) => set({ ebeam: e.target.checked })} /> electron-beam source (high-melting metals)</label>
      <dl className="gp-read mono">
        <dt>vacuum</dt><dd>{vacuumClass(P)}</dd>
        <dt>gas density</dt><dd>{sci(gasDensity(P))} m⁻³</dd>
        <dt>mean free path</dt><dd>{sci(meanFreePath(P))} m</dd>
        <dt>time per monolayer</dt><dd>{sci(monolayerTime(P))} s</dd>
        <dt>gauge</dt><dd>{P >= 1 ? 'manometer' : P >= 1e-3 ? 'thermocouple' : 'ionisation'}</dd>
      </dl>
      <table className="vac mono">
        <thead><tr><th>Torr</th><th>m⁻³</th><th>λ (m)</th><th>s/ML</th></tr></thead>
        <tbody>
          {VAC_ROWS.map((p) => (
            <tr key={p} className={Math.abs(Math.log10(p) - f.logP) < 0.6 ? 'on' : ''}>
              <td>{p >= 1 ? p : `10^${Math.log10(p)}`}</td><td>{sci(gasDensity(p), 1)}</td><td>{sci(meanFreePath(p), 1)}</td><td>{sci(monolayerTime(p), 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="lc-fine">Evaporation runs below 10⁻⁵ Torr: atoms cross the chamber without a collision, from essentially a point source.</p>
    </section>
  )
}

function CoveragePanel() {
  const [f, set] = useFilms()
  const c = stepCoverage(f.method, f.aspect, f.Sc)
  return (
    <section className="lc gp" aria-label="Step coverage">
      <span className="eyebrow lc-head">step coverage <SourceButton refs={[T5(2), T5(42), T5(49)]} /></span>
      <Seg label="Method" items={[['cvd', 'CVD'], ['sputter', 'sputtering'], ['evaporation', 'evaporation']]} value={f.method} on={(method) => set({ method })} />
      <Slider label="trench aspect ratio (depth/width)" value={f.aspect} min={0.5} max={5} step={0.1} on={(aspect) => set({ aspect })} />
      {f.method === 'cvd' && <Slider label="sticking coefficient Sc" value={f.Sc} min={0.01} max={1} step={0.01} on={(Sc) => set({ Sc })} />}
      <dl className="gp-read mono">
        <dt>sidewall</dt><dd>{Math.round(c.side * 100)} % of the top</dd>
        <dt>bottom</dt><dd>{Math.round(c.bottom * 100)} %</dd>
      </dl>
      <p className="lc-fine">Sc = F_reacted/F_incident. Illustrative geometry, not a feature-scale simulation.</p>
    </section>
  )
}

function SiEpiPanel() {
  const [e, set] = useEpi()
  const opts = { celsius: e.T, rate: e.rate, thickness: 5, substrate: e.sub, cSub: 1e19, cEpi: 1e15, backsideSeal: e.seal, reducedPressure: e.rp }
  const p = epiProfile(opts)
  const W = 300
  const H = 150
  const x = (um: number) => 38 + ((um + 1) / 6) * 252
  const y = (c: number) => 10 + ((19.5 - Math.log10(c)) / 5) * 115
  const d = Array.from({ length: 121 }, (_, i) => { const u = -1 + (i / 120) * 6; return `${i ? 'L' : 'M'}${x(u).toFixed(1)},${y(Math.max(1e14, p.at(u))).toFixed(1)}` }).join('')
  return (
    <section className="lc gp" aria-label="Silicon epitaxy">
      <span className="eyebrow lc-head">silicon epitaxy and autodoping <SourceButton refs={[T6(11), T6(12), T6(13), T6(14)]} /></span>
      <Slider label="temperature" value={e.T} min={900} max={1150} step={10} unit="°C" on={(T) => set({ T })} />
      <Slider label="growth rate" value={e.rate} min={0.2} max={3} step={0.1} unit="µm/min" on={(rate) => set({ rate })} />
      <Seg label="Substrate dopant" items={[['As', 'n⁺ As'], ['Sb', 'n⁺ Sb'], ['B', 'p⁺ B']]} value={e.sub} on={(sub) => set({ sub })} />
      <label className="gp-check"><input type="checkbox" checked={e.seal} onChange={(ev) => set({ seal: ev.target.checked })} /> seal the backside (LT oxide)</label>
      <label className="gp-check"><input type="checkbox" checked={e.rp} onChange={(ev) => set({ rp: ev.target.checked })} /> reduced-pressure epitaxy</label>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Doping profile; transition ${p.transitionUm.toFixed(2)} µm`}>
        {[1e15, 1e17, 1e19].map((c) => (
          <g key={c}><line x1={38} x2={290} y1={y(c)} y2={y(c)} className="grid" /><text x={34} y={y(c) + 4} className="tick" textAnchor="end">{c.toExponential(0)}</text></g>
        ))}
        <line x1={x(0)} x2={x(0)} y1={10} y2={125} className="marker" />
        <text x={x(-0.5)} y={138} className="tick" textAnchor="middle">substrate</text>
        <text x={x(2.5)} y={138} className="tick" textAnchor="middle">epi layer (µm)</text>
        <path d={d} className="cur" />
      </svg>
      <dl className="gp-read mono">
        <dt>transition</dt><dd>{p.transitionUm.toFixed(2)} µm to within 2× of the epi level</dd>
        <dt>out-diffusion</dt><dd>2√(Dt) = {p.outDiffusionUm.toFixed(3)} µm</dd>
      </dl>
      <p className="lc-fine">B 10¹⁶–10¹⁹, As/P 10¹⁶–10²⁰ cm⁻³. The gas-phase tail scale is illustrative.</p>
    </section>
  )
}

function MbePanel() {
  const [e, set] = useEpi()
  const svg = useRef<SVGPathElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const tr = mbeLive.trace
      if (svg.current && tr.length > 1) {
        const t1 = tr[tr.length - 1].t
        svg.current.setAttribute('d', tr.map((s, i) => `${i ? 'L' : 'M'}${(290 - (t1 - s.t) * 25).toFixed(1)},${(110 - s.I * 90).toFixed(1)}`).join(''))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const phi = flux(10 ** e.logGa, 69.72, 1200)
  const ml = mlPerSecond(phi)
  return (
    <section className="lc gp" aria-label="MBE">
      <span className="eyebrow lc-head">MBE and RHEED <SourceButton refs={[T6(21), T6(23), T6(25)]} /></span>
      <Slider label="Ga beam pressure at the substrate (log)" value={e.logGa} min={-4.5} max={-2.8} step={0.05} unit="Pa" fmt={(v) => `10^${v.toFixed(2)}`} on={(logGa) => set({ logGa })} />
      <div className="lc-quick">
        <button className="chip" aria-pressed={e.shutter} onClick={() => set({ shutter: !e.shutter })}>{e.shutter ? 'close the Ga shutter' : 'open the Ga shutter'}</button>
        <button className="chip" onClick={() => { mbeLive.ml = 0; mbeLive.trace = [] }}>new wafer</button>
      </div>
      <p className="gp-eq mono">φ = 2.64×10²⁰·P/√(MT) cm⁻² s⁻¹</p>
      <dl className="gp-read mono">
        <dt>Ga flux</dt><dd>{sci(phi)} cm⁻² s⁻¹ (T = 1200 K)</dd>
        <dt>growth</dt><dd>{ml.toFixed(2)} ML/s · {(ml * 0.2827 * 3.6).toFixed(2)} µm/h</dd>
      </dl>
      <svg className="chart" viewBox="0 0 300 130" role="img" aria-label="RHEED specular intensity against time">
        <line x1={10} x2={290} y1={110} y2={110} className="grid" />
        <path ref={svg} className="cur" />
        <text x={150} y={126} className="axis" textAnchor="middle">RHEED intensity: one oscillation per monolayer</text>
      </svg>
      <button className="chip gp-next" onClick={() => void transition.go('surface')}>the growing surface →</button>
    </section>
  )
}

function ModesPanel() {
  const [e, set] = useEpi()
  return (
    <section className="lc gp" aria-label="Growth modes">
      <span className="eyebrow lc-head">modes of film growth <SourceButton refs={[T6(7), T6(8), T6(9)]} /></span>
      <Seg label="Mode" items={[['fvdm', 'Frank–van der Merwe'], ['sk', 'Stranski–Krastanov'], ['vw', 'Volmer–Weber']]} value={e.mode} on={(mode) => set({ mode })} />
      <Slider label="deposited" value={e.coverage} min={0} max={4} step={0.1} unit="ML" on={(coverage) => set({ coverage })} />
      <p className="lc-note">
        {e.mode === 'fvdm' && 'Layer by layer: each layer completes before the next starts. Ideal epitaxy.'}
        {e.mode === 'sk' && 'A wetting layer first, then islands: how self-assembled quantum dots form.'}
        {e.mode === 'vw' && 'Islands from the start: the film atoms bond to each other more strongly than to the substrate.'}
      </p>
    </section>
  )
}

function StrainPanel() {
  const [e, set] = useEpi()
  const s = strainState(SEMI_BY_ID[e.film].a, SEMI_BY_ID[e.substrate].a, e.thick)
  const W = 300
  const H = 190
  const x = (a: number) => 30 + ((a - 5.4) / 1.1) * 260
  const y = (g: number) => 12 + ((2.6 - g) / 2.6) * 160
  return (
    <section className="lc gp" aria-label="Lattice mismatch">
      <span className="eyebrow lc-head">lattice mismatch <SourceButton refs={[T6(4), T6(5), T6(6)]} /></span>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bandgap against lattice constant; click a material to grow it">
        {[0, 1, 2].map((g) => (<g key={g}><line x1={30} x2={290} y1={y(g)} y2={y(g)} className="grid" /><text x={26} y={y(g) + 4} className="tick" textAnchor="end">{g}</text></g>))}
        {[5.5, 5.7, 5.9, 6.1, 6.3, 6.5].map((a) => (<text key={a} x={x(a)} y={186} className="tick" textAnchor="middle">{a}</text>))}
        <line x1={x(SEMI_BY_ID[e.substrate].a)} x2={x(SEMI_BY_ID[e.substrate].a)} y1={12} y2={172} className="marker" />
        {SEMIS.map((m) => (
          <g key={m.id} style={{ cursor: 'pointer' }} onClick={() => set({ film: m.id })}>
            <rect x={x(m.a) - 4} y={y(m.gap) - 4} width={8} height={8} fill={m.id === e.film ? '#f0b43c' : m.id === e.substrate ? '#6f8aa0' : 'none'} stroke={m.direct ? '#f2f4f3' : '#919a97'} />
            <text x={x(m.a) + 6} y={y(m.gap) - 5} className={'tick' + (m.id === e.film ? ' hi' : '')}>{m.id}</text>
          </g>
        ))}
      </svg>
      <div className="lc-row">
        <span className="eyebrow">substrate</span>
        <Seg label="Substrate" items={[['Si', 'Si'], ['GaAs', 'GaAs'], ['InP', 'InP']]} value={e.substrate as 'Si'} on={(substrate) => set({ substrate })} />
      </div>
      <Slider label="film thickness" value={e.thick} min={0.3} max={20} step={0.1} unit="nm" on={(thick) => set({ thick })} />
      <dl className="gp-read mono">
        <dt>mismatch f</dt><dd>{(s.f * 100).toFixed(2)} %</dd>
        <dt>hc (rough)</dt><dd>{Number.isFinite(s.hcNm) ? `${s.hcNm.toFixed(1)} nm` : '∞'}</dd>
        <dt>state</dt><dd>{s.mode}</dd>
      </dl>
      <p className="lc-fine">Gap (eV) against lattice constant (Å); solid outline = direct gap. hc ≈ a/(2|f|) is a rough estimate (beyond the lecture).</p>
    </section>
  )
}

function SoiPanel() {
  const [e, set] = useEpi()
  const steps = [
    'A silicon donor wafer.',
    'Thermal oxidation: the future buried oxide, with a high-quality Si/SiO₂ interface.',
    'Hydrogen is implanted through the oxide to a set depth.',
    'The donor is flipped and bonded, oxide down, to a handle wafer.',
    'Heating: strain from the H layer splits the donor along it (the "smart cut").',
    'Flip, out-diffuse the H and polish: thin Si on oxide on the handle, e.g. 205 nm on 400 nm.',
  ]
  return (
    <section className="lc gp" aria-label="Smart cut">
      <span className="eyebrow lc-head">silicon on insulator: smart cut <SourceButton refs={[T6(28), T6(29), T6(30)]} /></span>
      <ol className="gp-steps">
        {steps.map((t, i) => (
          <li key={i} className={i === e.soi ? 'on' : ''}><span className="mono gp-n">{i + 1}</span><span>{t}</span></li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={e.soi === 0} onClick={() => set({ soi: e.soi - 1 })}>←</button>
        <button className="chip" disabled={e.soi >= 5} onClick={() => set({ soi: e.soi + 1 })}>next step →</button>
      </div>
      <p className="lc-fine">IBM’s alternative, SIMOX, is separation by implantation of oxygen.</p>
    </section>
  )
}

export function DepositionPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'plasma') return <PlasmaPanel />
  if (tab === 'pvd') return <PvdPanel />
  if (tab === 'coverage') return <CoveragePanel />
  if (tab === 'siepi') return <SiEpiPanel />
  return <CvdPanel />
}
export const MbePanels = MbePanel
export function SurfacePanels() {
  const tab = useAtlas((s) => s.tab)
  return tab === 'strain' ? <StrainPanel /> : <ModesPanel />
}
export const SoiPanels = SoiPanel
