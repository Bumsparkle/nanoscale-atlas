import { useAtlas } from '../../state/store'
import { SourceButton } from '../source/Source'
import { T4 } from '../../sources'
import { transition } from '../../scene/transition'
import { CLASSES, COUPLE_BY_ID, COUPLES, CYCLE, GETTER, metalFate, nbYield, poissonYield, RCA_STEPS, remaining } from '../../chapters/clean/physics'
import '../growth/growth.css'

/** Chapter 3 controls (Topic 4). Numbers come from chapters/clean/physics.ts. */
type Clean = ReturnType<typeof useAtlas.getState>['clean']
function useClean() {
  const c = useAtlas((s) => s.clean)
  const set = useAtlas((s) => s.set)
  return [c, (p: Partial<Clean>) => set({ clean: { ...useAtlas.getState().clean, ...p } })] as const
}

const CONTAM: Record<string, string> = { organic: 'organic film', oxide: 'oxide', metal: 'heavy metals', alkali: 'alkali ions', particle: 'particles' }

function RoomPanel() {
  const [c, set] = useClean()
  return (
    <section className="lc gp" aria-label="Clean factory">
      <span className="eyebrow lc-head">level 1 · the clean factory <SourceButton refs={[T4(2), T4(6), T4(7)]} /></span>
      <span className="eyebrow">class: particles ≥ 0.5 µm per ft³</span>
      <div className="gp-chips" role="group" aria-label="Class">
        {CLASSES.map((k) => (
          <button key={k} className="chip" aria-pressed={c.cls === k} onClick={() => set({ cls: k })}>
            {k.toLocaleString('en-GB')}
          </button>
        ))}
      </div>
      <span className="eyebrow">contamination sources</span>
      <div className="gp-chips" role="group" aria-label="Sources">
        {(['person', 'book', 'gloves'] as const).map((k) => (
          <button key={k} className="chip" aria-pressed={c.sources[k]} onClick={() => set({ sources: { ...c.sources, [k]: !c.sources[k] } })}>
            {k === 'person' ? 'people' : k === 'book' ? 'a paper book' : 'gloves'}
          </button>
        ))}
      </div>
      <p className="lc-note">
        Air control matters most: room air recirculates through ceiling HEPA filters, falls through the bay, leaves through the floor and returns up the service chase. Small particles stay airborne and coagulate; large ones settle.
      </p>
      <div className="lc-quick">
        <button className="chip" onClick={() => (set({ rca: 0 }), useAtlas.getState().set({ tab: 'wetbench' }))}>level 2 · wafer cleaning →</button>
        <button className="chip" onClick={() => void transition.go('wafer', { tab: 'gettering' })}>level 3 · gettering →</button>
      </div>
      <div className="lc-quick">
        <button className="chip" onClick={() => void transition.go('deposition')}>deposition bay (ch.4) →</button>
        <button className="chip" onClick={() => void transition.go('mbe')}>MBE (ch.5) →</button>
        <button className="chip" onClick={() => void transition.go('litho')}>lithography bay (ch.6) →</button>
        <button className="chip" onClick={() => void transition.go('qmbe')}>III–V MBE (ch.7) →</button>
        <button className="chip" onClick={() => void transition.go('nanofab')}>nanostructures (ch.7) →</button>
      </div>
    </section>
  )
}

function BenchPanel() {
  const [c, set] = useClean()
  const cur = c.rca > 0 ? RCA_STEPS[c.rca - 1] : null
  const left = remaining(c.rca)
  return (
    <section className="lc gp" aria-label="RCA clean">
      <span className="eyebrow lc-head">level 2 · the RCA clean <SourceButton refs={[T4(10), T4(11)]} /></span>
      <ol className="gp-steps">
        {RCA_STEPS.map((s, i) => (
          <li key={s.id} className={i === c.rca - 1 ? 'on' : ''}>
            <span className="mono gp-n">{i < c.rca ? '✓' : i + 1}</span>
            <span>
              <b>{s.name}</b> <span className="mono">{s.mix}</span>
              {!s.rinse && <span className="gp-eq mono">{s.ratio} · {s.temp} · {s.time}</span>}
            </span>
          </li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={c.rca === 0} onClick={() => set({ rca: c.rca - 1 })}>← back</button>
        <button className="chip" disabled={c.rca >= RCA_STEPS.length} onClick={() => set({ rca: c.rca + 1 })}>
          {c.rca === 0 ? 'start: into the piranha' : 'next step'} →
        </button>
        <button className="chip" onClick={() => set({ rca: 0 })}>reset</button>
      </div>
      <p className="lc-note">{cur ? `${cur.name}: ${cur.note}` : 'A dirty wafer: particles, an organic film, metals, alkali ions and a native oxide.'}</p>
      <p className="lc-fine mono">on the wafer: {[...left].map((k) => CONTAM[k]).join(', ') || 'nothing'}{c.rca === RCA_STEPS.length ? ' (a thin chemical oxide from the H₂O₂)' : ''}</p>
    </section>
  )
}

function RedoxPanel() {
  const [c, set] = useClean()
  const fate = metalFate(c.metal, c.solution)
  const m = COUPLE_BY_ID[c.metal]
  const H = 22
  const E = (e: number) => 14 + ((1.1 - e) / 3.25) * (COUPLES.length * H)
  const ox = c.solution === 'water' ? COUPLE_BY_ID.Si : COUPLE_BY_ID[c.solution === 'h2o2' ? 'H2O2' : 'O3']
  return (
    <section className="lc gp" aria-label="Redox ladder">
      <span className="eyebrow lc-head">why H₂O₂ cleans · oxidation potentials <SourceButton refs={[T4(18), T4(19)]} /></span>
      <svg className="chart" viewBox={`0 0 300 ${COUPLES.length * H + 24}`} role="img" aria-label={`${m.label} ${fate} in ${c.solution}`}>
        {COUPLES.map((k) => (
          <g key={k.id} className="lad" onClick={() => k.metal && set({ metal: k.id })} style={{ cursor: k.metal ? 'pointer' : 'default' }}>
            <line x1={70} x2={290} y1={E(k.E)} y2={E(k.E)} className={k.id === c.metal ? 'cur' : k.id === ox.id ? 'marker' : 'grid'} />
            <text x={64} y={E(k.E) + 4} className={'tick' + (k.id === c.metal ? ' hi' : '')} textAnchor="end">{k.E.toFixed(2)} V</text>
            <text x={74} y={E(k.E) - 3} className={'tick' + (k.id === c.metal ? ' hi' : '')}>{k.label}</text>
          </g>
        ))}
        <text x={290} y={10} className="axis" textAnchor="end">stronger reductant ↑</text>
        <text x={290} y={COUPLES.length * H + 22} className="axis" textAnchor="end">stronger oxidant ↓</text>
      </svg>
      <div className="gp-chips" role="group" aria-label="Metal">
        {COUPLES.filter((k) => k.metal).map((k) => (
          <button key={k.id} className="chip" aria-pressed={c.metal === k.id} onClick={() => set({ metal: k.id })}>{k.id}</button>
        ))}
      </div>
      <div className="seg" role="group" aria-label="Solution">
        {([['water', 'DI water'], ['h2o2', '+ H₂O₂'], ['o3', '+ O₃']] as const).map(([v, l]) => (
          <button key={v} aria-pressed={c.solution === v} onClick={() => set({ solution: v })}>{l}</button>
        ))}
      </div>
      <p className={'lc-state ' + (fate === 'dissolves' ? 'on' : 'off')}>{c.metal} {fate === 'dissolves' ? `dissolves as ${m.label.split('/')[0]}` : 'plates out on the wafer'}</p>
      <p className="lc-note">
        {c.solution === 'water'
          ? m.E > 0.84
            ? `${m.id} sits above Si: it is oxidised before the silicon.`
            : `In water the wafer wins: Si → SiO₂ runs to the right and drives ${m.id} back to metal on the surface.`
          : `${c.solution === 'h2o2' ? 'H₂O₂' : 'O₃'} sits below ${m.id}: it grabs the electrons and forces ${m.reaction} to the right.`}
      </p>
    </section>
  )
}

function GetterPanel() {
  const [c, set] = useClean()
  return (
    <section className="lc gp" aria-label="Gettering">
      <span className="eyebrow lc-head">level 3 · gettering <SourceButton refs={[T4(12), T4(13), T4(14), T4(20)]} /></span>
      <span className="eyebrow">temperature cycle (CZ silicon)</span>
      <ol className="gp-steps">
        {CYCLE.map((s, i) => (
          <li key={s.name} className={i === c.cycle ? 'on' : ''}>
            <span className="mono gp-n">{i}</span>
            <span><b>{s.name}</b>{i > 0 && <span className="mono"> · ~{s.T} °C</span>}<br />{i === c.cycle && s.note}</span>
          </li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={c.cycle === 0} onClick={() => set({ cycle: c.cycle - 1, getter: 0 })}>←</button>
        <button className="chip" disabled={c.cycle >= 3} onClick={() => set({ cycle: c.cycle + 1 })}>next stage →</button>
      </div>
      <span className="eyebrow">gettering a metal atom</span>
      <ol className="gp-steps">
        {GETTER.map((s, i) => (
          <li key={s.name} className={i === c.getter ? 'on' : ''}>
            <span className="mono gp-n">{i}</span>
            <span><b>{s.name}</b><br />{i === c.getter && s.note}</span>
          </li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={c.getter === 0} onClick={() => set({ getter: c.getter - 1 })}>←</button>
        <button className="chip" disabled={c.getter >= 3} onClick={() => set({ getter: c.getter + 1 })}>next step →</button>
      </div>
      {c.getter >= 2 && c.cycle < 3 && <p className="lc-fine">No precipitates yet: without trap sites the metals wander. Run the temperature cycle first.</p>}
    </section>
  )
}

function YieldChart({ A, D0, C }: { A: number; D0: number; C: number }) {
  const W = 300
  const Hh = 150
  const x = (a: number) => 38 + (a / 16) * 252
  const y = (v: number) => 10 + ((0 - Math.log10(Math.max(v, 1e-4))) / 4) * 112
  const path = (f: (a: number) => number) => Array.from({ length: 81 }, (_, i) => `${i ? 'L' : 'M'}${x((i / 80) * 16).toFixed(1)},${y(f((i / 80) * 16)).toFixed(1)}`).join('')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Hh}`} role="img" aria-label="Yield against chip area">
      {[1, 0.1, 0.01, 0.001, 0.0001].map((v) => (
        <g key={v}>
          <line x1={38} x2={290} y1={y(v)} y2={y(v)} className="grid" />
          <text x={33} y={y(v) + 4} className="tick" textAnchor="end">{v}</text>
        </g>
      ))}
      <path d={path((a) => poissonYield(a, D0))} className="ref" stroke="#e48a8a" />
      <path d={path((a) => nbYield(a, D0, C))} className="cur" />
      <line x1={x(A)} x2={x(A)} y1={10} y2={122} className="marker" />
      <text x={290} y={22} className="tick" textAnchor="end">negative binomial (C = {C})</text>
      <text x={290} y={36} className="tick" textAnchor="end" fill="#e48a8a">Poisson</text>
      <text x={164} y={Hh - 2} className="axis" textAnchor="middle">chip area Ac (cm²) · D0 = {D0} cm⁻²</text>
    </svg>
  )
}

function YieldPanel() {
  const [c, set] = useClean()
  const slider = (label: string, v: number, min: number, max: number, step: number, unit: string, on: (n: number) => void) => (
    <label className="lc-slider">
      <span className="eyebrow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} />
      <span className="mono">{v} {unit}</span>
    </label>
  )
  return (
    <section className="lc gp" aria-label="Yield model">
      <span className="eyebrow lc-head">particles and yield <SourceButton refs={[T4(15), T4(16), T4(17)]} /></span>
      {slider('defect density D0', c.D0, 0.01, 2, 0.01, 'cm⁻²', (D0) => set({ D0 }))}
      {slider('chip area Ac', c.A, 0.25, 16, 0.25, 'cm²', (A) => set({ A }))}
      {slider('clustering C', c.C, 0.5, 20, 0.5, '', (C) => set({ C }))}
      <dl className="gp-read mono">
        <dt>Poisson</dt>
        <dd>Y = exp(−Ac·D0) = {(poissonYield(c.A, c.D0) * 100).toFixed(1)} %</dd>
        <dt>neg. binomial</dt>
        <dd>Y = (1 + Ac·D0/C)^−C = {(nbYield(c.A, c.D0, c.C) * 100).toFixed(1)} %</dd>
      </dl>
      <YieldChart A={c.A} D0={c.D0} C={c.C} />
      <div className="lc-quick">
        <button className="chip" onClick={() => set({ seed: c.seed + 1 })}>scatter again</button>
      </div>
      <p className="lc-fine">Each die's defects are Poisson with a mean that varies from region to region (gamma, shape C): clustering spares more die, so the counted yield follows the negative binomial.</p>
    </section>
  )
}

export function CleanroomPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'wetbench') return <BenchPanel />
  if (tab === 'redox') return <RedoxPanel />
  return <RoomPanel />
}
export function CleanWaferPanels() {
  const tab = useAtlas((s) => s.tab)
  if (tab === 'gettering') return <GetterPanel />
  if (tab === 'yield') return <YieldPanel />
  return null
}
