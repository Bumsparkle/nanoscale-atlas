import { Fragment, useMemo } from 'react'
import { useAtlas } from '../../state/store'
import { SourceButton } from '../source/Source'
import { T7 } from '../../sources'
import { transition } from '../../scene/transition'
import { deBroglieNm, depthOfFocus, ELECTRON_MASS, fresnelRegime, fresnelSlit, gratingImage, mtfCurve, photonLambdaNm, PROTON_MASS, resolution, ROADMAP, roadmapNode, SOURCES, SOURCE_BY_ID, twoPoints, wMin, type SourceId } from '../../chapters/litho/optics'
import { kanayaRangeNm, PMMA, SI, simulate } from '../../chapters/litho/ebeam'
import { clearedFraction, LIFTOFF, RESIST_STEPS, resistThickness } from '../../chapters/litho/resist'
import { Chart, Seg, Slider, Stepper } from '../controls'
import '../growth/growth.css'

/** Chapter 6 (Topic 7) controls; every number from chapters/litho/optics.ts and ebeam.ts */
type Litho = ReturnType<typeof useAtlas.getState>['litho']
const useLitho = () => [useAtlas((s) => s.litho), (p: Partial<Litho>) => useAtlas.getState().set({ litho: { ...useAtlas.getState().litho, ...p } })] as const

const SRC_ITEMS = SOURCES.map((s) => [s.id, `${s.name} ${s.nm}`] as [SourceId, string])

function ToolPanel() {
  const [L, set] = useLitho()
  const src = SOURCE_BY_ID[L.source]
  const R = resolution(L.k1, src.nm, L.NA)
  const dof = depthOfFocus(L.k2, src.nm, L.NA)
  return (
    <section className="lc gp" aria-label="Exposure tool">
      <span className="eyebrow lc-head">wafer exposure systems <SourceButton refs={[T7(3), T7(4), T7(5), T7(8), T7(9)]} /></span>
      <Seg label="System" items={[['contact', 'contact'], ['proximity', 'proximity'], ['projection', 'projection']]} value={L.system} on={(system) => set({ system })} />
      <p className="lc-fine">
        {L.system === 'contact' && 'Mask pressed on the resist, 1:1. High resolution, but the contact damages masks and wafers: unacceptable defect densities.'}
        {L.system === 'proximity' && 'Mask held 5–25 µm above the resist, 1:1. Fewer defects, but it cannot easily print below a few µm (except with X-rays).'}
        {L.system === 'projection' && 'A lens images the mask onto the wafer, usually reduced 4× or 5×. High resolution and low defect densities: it dominates today.'}
      </p>
      <Seg label="Source" items={SRC_ITEMS} value={L.source} on={(source) => set({ source })} />
      <p className="lc-fine">{src.lamp}{src.use ? ` · used for ${src.use}` : ''}. Shorter λ needs new resists and transparent optics.</p>
      {L.system === 'proximity' && <Slider label="gap g" value={L.gap} min={1} max={30} step={1} unit="µm" on={(gap) => set({ gap })} />}
      {L.system === 'projection' && (
        <>
          <Slider label="NA = n sin α" value={L.NA} min={0.2} max={0.95} step={0.01} on={(NA) => set({ NA })} fmt={(v) => v.toFixed(2)} />
          <Slider label="k₁" value={L.k1} min={0.3} max={0.9} step={0.01} on={(k1) => set({ k1 })} fmt={(v) => v.toFixed(2)} />
          <Slider label="k₂" value={L.k2} min={0.3} max={1} step={0.05} on={(k2) => set({ k2 })} fmt={(v) => v.toFixed(2)} />
          <p className="gp-eq mono">R = k₁λ/NA · DOF = ±k₂λ/NA²</p>
          <dl className="gp-read mono">
            <dt>resolution R</dt><dd>{R.toFixed(0)} nm</dd>
            <dt>depth of focus</dt><dd>±{dof.toFixed(0)} nm</dd>
          </dl>
          <p className="lc-fine">Raise NA and R improves, but the DOF shrinks as 1/NA²: the wafer must be flat.</p>
        </>
      )}
      {L.system === 'proximity' && (
        <dl className="gp-read mono">
          <dt>W_min ≈ √(λg)</dt><dd>{wMin(src.nm / 1000, L.gap).toFixed(2)} µm</dd>
        </dl>
      )}
      <div className="lc-quick">
        <button className="chip" onClick={() => void transition.go('ebeam')}>e-beam writer →</button>
        <button className="chip" onClick={() => { set({ print: true }); void transition.go('cell').then(() => useAtlas.getState().set({ view: 'layout' })) }}>print the inverter with this tool →</button>
      </div>
    </section>
  )
}

function OpticsPanel() {
  const [L, set] = useLitho()
  const t = useMemo(() => twoPoints(Math.max(L.sep, 1e-6), 161, 3), [L.sep])
  return (
    <section className="lc gp" aria-label="Diffraction">
      <span className="eyebrow lc-head">diffraction and the Rayleigh criterion <SourceButton refs={[T7(6), T7(7), T7(8)]} /></span>
      <p className="gp-eq mono">Φ = 1.22λf/d · R = 0.61λ/(n sin α)</p>
      <Slider label="separation" value={L.sep} min={0} max={2.5} step={0.02} unit="Φ" fmt={(v) => v.toFixed(2)} on={(sep) => set({ sep })} />
      <Chart label="Intensity along the line through both points" xl="position (Airy radii Φ)" x={{ min: -3, max: 3, ticks: [-2, -1, 0, 1, 2] }} y={{ min: 0, max: 1.6, ticks: [0, 0.5, 1, 1.5] }}
        series={[{ pts: t.xs.map((x, i) => [x, L.sep === 0 ? t.I[i] / 2 : t.I[i]] as [number, number]) }]} />
      <dl className="gp-read mono">
        <dt>at the midpoint</dt><dd>{L.sep === 0 ? '—' : `${(t.dip * 100).toFixed(0)} % of the peaks`}</dd>
        <dt>Rayleigh</dt><dd>{L.sep === 0 ? 'one point: an Airy disk' : L.sep >= 1 ? 'resolved' : 'not resolved'}</dd>
      </dl>
      <p className="lc-fine">Two points are just resolved when one’s central maximum sits on the other’s first minimum (sep = Φ). A point image only forms if λ → 0, f → 0 or d → ∞.</p>
    </section>
  )
}

function MtfPanel() {
  const [L, set] = useLitho()
  const lam = SOURCE_BY_ID[L.source].nm
  const ws = useMemo(() => Array.from({ length: 50 }, (_, i) => 60 * Math.pow(25, i / 49)), [])
  const curves = useMemo(() => [0, 0.5, 0.9].map((S) => mtfCurve(lam, L.NA, S, ws)), [lam, L.NA, ws])
  const cur = useMemo(() => mtfCurve(lam, L.NA, L.S, ws), [lam, L.NA, L.S, ws])
  const here = gratingImage(L.feature, lam, L.NA, L.S, 96)
  return (
    <section className="lc gp" aria-label="Modulation transfer function">
      <span className="eyebrow lc-head">modulation transfer function <SourceButton refs={[T7(10), T7(11), T7(12)]} /></span>
      <p className="gp-eq mono">MTF = (I_max − I_min)/(I_max + I_min)</p>
      <Seg label="Source" items={SRC_ITEMS} value={L.source} on={(source) => set({ source })} />
      <Slider label="line width" value={L.feature} min={60} max={1500} step={10} unit="nm" on={(feature) => set({ feature })} />
      <Slider label="coherence S" value={L.S} min={0} max={1} step={0.05} on={(S) => set({ S })} fmt={(v) => v.toFixed(2)} />
      <Slider label="NA" value={L.NA} min={0.2} max={0.95} step={0.01} on={(NA) => set({ NA })} fmt={(v) => v.toFixed(2)} />
      <Chart label="MTF against line width" xl="line width (nm, log)" yl="MTF" x={{ min: 60, max: 1500, log: true, ticks: [100, 300, 1000] }} y={{ min: 0, max: 1, ticks: [0, 0.5, 1] }}
        series={[...curves.map((c, i) => ({ pts: ws.map((w, k) => [w, c[k]] as [number, number]), cls: 'ref', stroke: ['var(--series-blue)', 'var(--series-teal)', 'var(--series-red)'][i], dash: true })), { pts: ws.map((w, k) => [w, cur[k]] as [number, number]) }]}
        marks={[{ x: L.feature, y: here.mtf }]} />
      <p className="lc-fine">Dashed: S = 0, 0.5, 0.9. MTF above ≈ 0.5 is needed for the resist to recognise a feature. More incoherent light (larger S) lowers the MTF of larger features but helps very small ones; S ≈ 0.5–0.7, since S → 0 costs intensity. S = s/d = NA_condenser/NA_projection.</p>
      <dl className="gp-read mono">
        <dt>I_max · I_min</dt><dd>{here.Imax.toFixed(2)} · {here.Imin.toFixed(2)}</dd>
        <dt>MTF</dt><dd>{here.mtf.toFixed(2)} {here.mtf >= 0.5 ? '(prints)' : '(lost)'}</dd>
      </dl>
      <p className="lc-fine">Beyond the lecture: the image is computed by Abbe’s method (each source point passes the orders inside the pupil; their intensities add).</p>
    </section>
  )
}

function FresnelPanel() {
  const [L, set] = useLitho()
  const lam = SOURCE_BY_ID[L.source].nm / 1000
  const xs = useMemo(() => Array.from({ length: 161 }, (_, i) => -8 + (16 * i) / 160), [])
  const I = useMemo(() => fresnelSlit(L.W, L.gap, lam, xs, L.S * 0.04), [L.W, L.gap, lam, xs, L.S])
  const reg = fresnelRegime(lam, L.gap, L.W)
  return (
    <section className="lc gp" aria-label="Proximity printing">
      <span className="eyebrow lc-head">contact and proximity: Fresnel diffraction <SourceButton refs={[T7(13), T7(14)]} /></span>
      <p className="gp-eq mono">λ &lt; g &lt; W²/λ · W_min ≈ √(λg)</p>
      <Seg label="Source" items={SRC_ITEMS} value={L.source} on={(source) => set({ source })} />
      <Slider label="gap g" value={L.gap} min={0.5} max={40} step={0.5} unit="µm" on={(gap) => set({ gap })} />
      <Slider label="opening W" value={L.W} min={0.5} max={10} step={0.1} unit="µm" on={(W) => set({ W })} />
      <Slider label="incoherence S" value={L.S} min={0} max={1} step={0.05} on={(S) => set({ S })} fmt={(v) => v.toFixed(2)} />
      <Chart label="Intensity at the resist surface" xl="position (µm)" x={{ min: -8, max: 8, ticks: [-6, -3, 0, 3, 6] }} y={{ min: 0, max: 1.6, ticks: [0, 0.5, 1, 1.5] }}
        series={[{ pts: [[-L.W / 2, 0], [-L.W / 2, 1], [L.W / 2, 1], [L.W / 2, 0]], cls: 'ref', stroke: 'var(--ink-3)', dash: true }, { pts: xs.map((x, i) => [x, I[i]] as [number, number]) }]} />
      <dl className="gp-read mono">
        <dt>W_min</dt><dd>{wMin(lam, L.gap).toFixed(2)} µm</dd>
        <dt>regime</dt><dd>{reg === 'fresnel' ? 'Fresnel (near field)' : reg === 'contact' ? 'contact (g ≤ λ)' : 'beyond W²/λ: far field'}</dd>
      </dl>
      <p className="lc-fine">Point sources in the opening radiate spherical waves; their interference rings at the edges and spills light outside. Incoherent light smooths the ringing. g = 10 µm with the i-line gives W_min ≈ 2 µm; contact printing could reach ~0.1 µm but is not used.</p>
    </section>
  )
}

function ResistPanel() {
  const [L, set] = useLitho()
  return (
    <section className="lc gp" aria-label="Resist process">
      <span className="eyebrow lc-head">the resist process <SourceButton refs={[T7(15), T7(16)]} /></span>
      <Stepper steps={RESIST_STEPS.map((s) => `${s.t}: ${s.p}`)} at={L.rstep} set={(rstep) => set({ rstep })} />
      <Slider label="spin speed" value={L.rpm} min={2000} max={7000} step={250} unit="rpm" on={(rpm) => set({ rpm })} />
      <Slider label="exposure dose" value={L.dose} min={20} max={250} step={5} unit="mJ cm⁻²" on={(dose) => set({ dose })} />
      <dl className="gp-read mono">
        <dt>resist thickness</dt><dd>{resistThickness(L.rpm).toFixed(2)} µm</dd>
        <dt>exposed resist cleared</dt><dd>{(clearedFraction(L.dose) * 100).toFixed(0)} %</dd>
      </dl>
      <p className="lc-fine">Sensitivity: ~100 mJ cm⁻² for g- and i-line resists (newer: down to 20). Thickness ∝ 1/√(rpm) is beyond the lecture (Meyerhofer 1978). The post-exposure bake smooths the standing waves that reflections from the wafer print into the resist. The exposure system, not the resist, limits resolution.</p>
    </section>
  )
}

function RoadmapPanel() {
  const [L, set] = useLitho()
  const row = [...ROADMAP].reverse().find((r) => r.year <= L.year) ?? ROADMAP[0]
  return (
    <section className="lc gp" aria-label="Lithography roadmap">
      <span className="eyebrow lc-head">the lithography roadmap <SourceButton refs={[T7(2)]} /></span>
      <Slider label="year" value={L.year} min={1998} max={2018} step={1} on={(year) => set({ year })} />
      <Chart label="Node against year" xl="year" yl="nm (log)" x={{ min: 1998, max: 2018, ticks: [2000, 2005, 2010, 2015] }} y={{ min: 8, max: 300, log: true, ticks: [10, 30, 100, 250] }}
        series={[
          { pts: ROADMAP.map((r) => [r.year, r.node] as [number, number]) },
          { pts: ROADMAP.filter((r) => r.gate).map((r) => [r.year, r.gate!] as [number, number]), cls: 'ref', stroke: 'var(--series-red)' },
          { pts: Array.from({ length: 21 }, (_, i) => [1998 + i, roadmapNode(250, i)] as [number, number]), cls: 'ref', stroke: 'var(--ink-3)', dash: true },
        ]}
        marks={[{ x: row.year, y: row.node, text: `${row.node} nm` }]} />
      <p className="lc-fine">Solid: half pitch; red: printed gate length; dashed: 0.7× every 3 years from 250 nm.</p>
      <dl className="gp-read mono">
        <dt>node · gate</dt><dd>{row.node} nm · {row.gate ?? '—'} nm</dd>
        <dt>exposure</dt><dd>{row.tech}</dd>
        <dt>DRAM · MPU</dt><dd>{row.dram} bits · {row.mpu ? `${row.mpu} M transistors` : '—'}</dd>
        <dt>CD 3σ · overlay</dt><dd>{row.cd ?? '—'} nm · {row.overlay ?? '—'} nm</dd>
        <dt>mask data</dt><dd>{row.data ? `${row.data} GB/level` : '—'} · field 22 × 32 mm</dd>
      </dl>
      <p className="lc-fine">CD control ≈ 10 % of the smallest size; placement ≈ ⅓ of the feature; lithography ≈ 35 % of wafer cost. The “???” after 2013 was the roadmap’s biggest uncertainty.</p>
    </section>
  )
}

function NglPanel() {
  const [L, set] = useLitho()
  const rows = [
    { kind: 'UV', E: 3.1, lam: photonLambdaNm(3.1), photon: true },
    { kind: 'deep UV', E: 4.96, lam: photonLambdaNm(4.96), photon: true },
    { kind: 'X-ray', E: 2480, lam: photonLambdaNm(2480), photon: true },
    { kind: 'electrons, 20 keV', E: 20e3, lam: deBroglieNm(20e3, ELECTRON_MASS), photon: false },
    { kind: 'protons, 100 keV', E: 100e3, lam: deBroglieNm(100e3, PROTON_MASS), photon: false },
  ]
  const fmt = (nm: number) => (nm >= 1 ? `${nm.toFixed(0)} nm` : `${(nm * 10).toPrecision(2)} Å`)
  return (
    <section className="lc gp" aria-label="Next generation lithography">
      <span className="eyebrow lc-head">next-generation lithography <SourceButton refs={[T7(17), T7(18)]} /></span>
      <ul className="lc-fine">
        <li>Extreme UV: problems with source and mask.</li>
        <li>E-beam: too slow; great for research.</li>
        <li>Ion projection: too slow; great for research.</li>
        <li>X-ray: no longer on the roadmap.</li>
      </ul>
      <dl className="gp-read mono">
        {rows.map((r) => (
          <Fragment key={r.kind}><dt>{r.kind}</dt><dd>{fmt(r.lam)} · {r.E >= 1000 ? `${r.E / 1000} keV` : `${r.E} eV`}</dd></Fragment>
        ))}
      </dl>
      <p className="lc-fine">Photons: λ = hc/E. Particles have the de Broglie λ = h/p, far below any feature. The slide’s 0.62 Å and 0.12 Å are hc/E applied to 20 keV and 100 keV, which is the photon relation, not the particles’ wavelength.</p>
      <Slider label="electron energy" value={L.keV} min={5} max={30} step={1} unit="keV" on={(keV) => set({ keV })} />
      <p className="lc-fine">Optical lithography is still used at 7 nm: immersion raises NA = n sin θ above 1 (water takes 193 nm from ≈ 62 to ≈ 44 nm at k₁ = 0.3).</p>
      <div className="lc-quick"><button className="chip" onClick={() => void transition.go('ebeam')}>e-beam writer →</button></div>
    </section>
  )
}

/* ── e-beam writer ─────────────────────────────────────────────────────── */

function WritePanel() {
  return (
    <section className="lc gp" aria-label="E-beam direct write">
      <span className="eyebrow lc-head">electron-beam lithography <SourceButton refs={[T7(19), T7(22)]} /></span>
      <p className="lc-fine">The beam writes the pattern straight into resist: an SEM with an on–off switch (blanking plates) and accurate stage positioning. It can be focused to ~1 nm, but for &gt; 10 wafers per hour the current would have to be tens of mA.</p>
      <dl className="gp-read mono">
        <dt>for</dt><dd>small λ, 1 nm beam, ~10 nm resolution (scattering), flexible, computer-controlled</dd>
        <dt>against</dt><dd>cost, high vacuum, precision magnets, one pixel at a time, rarely commercial</dd>
        <dt>LCN</dt><dd>Raith 150-TWO: 20 nm, 495/950 PMMA, 10 mm–150 mm samples</dd>
      </dl>
      <div className="lc-quick">
        <button className="chip" disabled title="The Measure half is not built yet">SEM (Measure half): coming</button>
      </div>
    </section>
  )
}

function LiftoffPanel() {
  const [L, set] = useLitho()
  return (
    <section className="lc gp" aria-label="Lift-off">
      <span className="eyebrow lc-head">e-beam lift-off <SourceButton refs={[T7(20)]} /></span>
      <Stepper steps={LIFTOFF} at={L.eb} set={(eb) => set({ eb })} />
      <p className="lc-fine">Si with 58 nm SiO₂; PMMA; expose; develop; Ti 3 nm then Au 17 nm; dissolve the PMMA and the metal on it lifts off. No metal etch is needed.</p>
    </section>
  )
}

function ProximityPanel() {
  const [L, set] = useLitho()
  const sim = useMemo(() => simulate(L.keV, 300, 500, 5), [L.keV])
  const tot = sim.deposit.reduce((a, b) => a + b, 0) || 1
  return (
    <section className="lc gp" aria-label="Proximity effect">
      <span className="eyebrow lc-head">the proximity effect <SourceButton refs={[T7(21)]} /></span>
      <Slider label="beam energy" value={L.keV} min={5} max={30} step={1} unit="keV" on={(keV) => set({ keV })} />
      <Chart label="Energy deposited in the resist against distance from the beam" xl="distance from the beam (µm)" yl="share (log)" x={{ min: 0, max: 3, ticks: [0, 1, 2, 3] }} y={{ min: 1e-4, max: 1, log: true, ticks: [1e-3, 1e-2, 0.1, 1], fmt: (v) => v.toExponential(0) }}
        series={[{ pts: sim.deposit.slice(0, 30).map((d, i) => [(i + 0.5) * sim.binNm / 1000, Math.max(1e-5, d / tot)] as [number, number]) }]} />
      <dl className="gp-read mono">
        <dt>backscattered</dt><dd>{(sim.backscatter * 100).toFixed(0)} %</dd>
        <dt>range in Si · PMMA</dt><dd>{(kanayaRangeNm(SI, L.keV) / 1000).toFixed(1)} µm · {(kanayaRangeNm(PMMA, L.keV) / 1000).toFixed(1)} µm</dd>
      </dl>
      <p className="lc-fine">Forward scattering broadens the beam a little; backscattering from the substrate returns electrons far from it, adding unwanted exposure. Secondaries of 2–50 eV do most of the exposing but travel only nm; ~1 keV “fast” secondaries add a few tenths of a µm. Beyond the lecture: Monte Carlo after Joy (1995); range after Kanaya–Okayama.</p>
    </section>
  )
}

export function LithoPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'optics') return <OpticsPanel />
  if (tab === 'mtf') return <MtfPanel />
  if (tab === 'fresnel') return <FresnelPanel />
  if (tab === 'resist') return <ResistPanel />
  if (tab === 'roadmap') return <RoadmapPanel />
  if (tab === 'ngl') return <NglPanel />
  return <ToolPanel />
}
export function EbeamPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'liftoff') return <LiftoffPanel />
  if (tab === 'proximity') return <ProximityPanel />
  return <WritePanel />
}
