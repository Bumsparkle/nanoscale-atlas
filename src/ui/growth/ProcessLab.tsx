import { useEffect, useMemo, useRef, useState } from 'react'
import { useAtlas, type ProcOp, type ProcState } from '../../state/store'
import { FAB_LINK, labRun } from '../../chapters/growth/lab'
import { CROSS_LEGEND, CrossSection, ProfileChart } from './charts'
import { SourceButton } from '../source/Source'
import { T3 } from '../../sources'
import { navigate } from '../../state/url'
import { transition } from '../../scene/transition'
import { inverterProcess } from '../../chapters/cmos/recipe'

/**
 * The wafer's "Process flow" tab: slide 24's flow chart as a navigable
 * diagram; each box runs its step on a cross-section in the process lab,
 * built with the same simulator as the Chapter 1 inverter.
 */
const NODES: { op: ProcOp; label: string[]; x: number; y: number; w: number; slide: number }[] = [
  { op: 'wafer', label: ['Si wafer', 'manufacture'], x: 6, y: 8, w: 76, slide: 24 },
  { op: 'epitaxy', label: ['Epitaxial', 'growth'], x: 112, y: 8, w: 76, slide: 25 },
  { op: 'oxidation', label: ['Oxidation'], x: 218, y: 8, w: 76, slide: 27 },
  { op: 'litho', label: ['Photo-', 'lithography'], x: 218, y: 58, w: 76, slide: 28 },
  { op: 'etch', label: ['Etching'], x: 218, y: 108, w: 76, slide: 29 },
  { op: 'diffusion', label: ['Diffusion'], x: 64, y: 156, w: 64, slide: 30 },
  { op: 'implant', label: ['Implant-', 'ation'], x: 130, y: 156, w: 64, slide: 31 },
  { op: 'metal', label: ['Metalliz-', 'ation'], x: 316, y: 156, w: 70, slide: 32 },
  { op: 'packaging', label: ['Packaging'], x: 218, y: 204, w: 76, slide: 24 },
]

function FlowChart({ op, onPick }: { op: ProcOp; onPick: (o: ProcOp) => void }) {
  const box = (n: (typeof NODES)[number]) => ({ cx: n.x + n.w / 2, top: n.y, bot: n.y + 34, l: n.x, r: n.x + n.w, cy: n.y + 17 })
  const B = Object.fromEntries(NODES.map((n) => [n.op, box(n)])) as Record<ProcOp, ReturnType<typeof box>>
  const dia = { cx: 256, cy: 172 }
  return (
    <svg className="flow" viewBox="0 0 392 244" role="group" aria-label="Wafer fab process flow (slide 24)">
      <defs>
        <marker id="fa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" className="flow-head" />
        </marker>
      </defs>
      <g className="flow-edges" markerEnd="url(#fa)">
        <path d={`M${B.wafer.r},${B.wafer.cy} H${B.epitaxy.l}`} />
        <path d={`M${B.epitaxy.r},${B.epitaxy.cy} H${B.oxidation.l}`} />
        <path d={`M${B.oxidation.cx},${B.oxidation.bot} V${B.litho.top}`} />
        <path d={`M${B.litho.cx},${B.litho.bot} V${B.etch.top}`} />
        <path d={`M${B.etch.cx},${B.etch.bot} V${dia.cy - 13}`} />
        <path d={`M${dia.cx - 22},${dia.cy} H${B.implant.r}`} />
        <path d={`M${dia.cx + 22},${dia.cy} H${B.metal.l}`} />
        <path d={`M${dia.cx},${dia.cy + 13} V${B.packaging.top}`} />
        {/* loops: diffusion/implant back to epitaxy; metallization back to oxidation */}
        <path d={`M${B.diffusion.cx},${B.diffusion.top} V${B.epitaxy.bot + 22} H${B.epitaxy.cx} V${B.epitaxy.bot}`} />
        <path d={`M${B.metal.cx},${B.metal.top} V${B.oxidation.cy + 34} H${B.oxidation.r + 18} V${B.oxidation.bot + 6} H${B.oxidation.r - 2}`} />
      </g>
      <polygon points={`${dia.cx},${dia.cy - 13} ${dia.cx + 22},${dia.cy} ${dia.cx},${dia.cy + 13} ${dia.cx - 22},${dia.cy}`} className="flow-dia" />
      {NODES.map((n) => (
        <g key={n.op} className={'flow-node' + (op === n.op ? ' on' : '')} role="button" tabIndex={0} aria-pressed={op === n.op}
          onClick={() => onPick(n.op)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(n.op))}>
          <rect x={n.x} y={n.y} width={n.w} height={34} rx={3} />
          {n.label.map((t, i) => (
            <text key={i} x={n.x + n.w / 2} y={n.y + (n.label.length === 1 ? 21 : 15 + i * 12)} textAnchor="middle">{t}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}

function Controls({ p, set }: { p: ProcState; set: (q: Partial<ProcState>) => void }) {
  const slider = (label: string, value: number, min: number, max: number, step: number, unit: string, on: (v: number) => void) => (
    <label className="lc-slider">
      <span className="eyebrow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} />
      <span className="mono">{value} {unit}</span>
    </label>
  )
  const seg = <T extends string>(items: [T, string][], value: T, on: (v: T) => void) => (
    <div className="seg" role="group">
      {items.map(([v, l]) => (
        <button key={v} aria-pressed={value === v} onClick={() => on(v)}>{l}</button>
      ))}
    </div>
  )
  switch (p.op) {
    case 'oxidation':
      return (
        <>
          {seg([['dry', 'dry · O₂'], ['wet', 'wet · H₂O']], p.ambient, (ambient) => set({ ambient }))}
          {slider('temperature', p.oxT, 900, 1200, 10, '°C', (oxT) => set({ oxT }))}
          {slider('time', p.oxHours, 0.1, 10, 0.1, 'h', (oxHours) => set({ oxHours }))}
        </>
      )
    case 'litho':
      return seg([['positive', 'positive resist'], ['negative', 'negative resist']], p.tone, (tone) => set({ tone }))
    case 'etch':
      return (
        <>
          {seg([['iso', 'wet · isotropic'], ['aniso', 'dry · anisotropic']], p.iso ? 'iso' : 'aniso', (v) => set({ iso: v === 'iso' }))}
          {slider('resist line width', p.lineUm, 0.6, 4, 0.1, 'µm', (lineUm) => set({ lineUm }))}
        </>
      )
    case 'diffusion':
      return (
        <>
          {seg([['B', 'boron'], ['P', 'phosphorus']], p.dopant, (dopant) => set({ dopant }))}
          {slider('predeposition', p.preT, 900, 1100, 10, '°C', (preT) => set({ preT }))}
          {slider('predeposition time', p.preMin, 5, 120, 5, 'min', (preMin) => set({ preMin }))}
          {slider('drive-in', p.driveT, 950, 1200, 10, '°C', (driveT) => set({ driveT }))}
          {slider('drive-in time', p.driveMin, 10, 600, 10, 'min', (driveMin) => set({ driveMin }))}
        </>
      )
    case 'implant':
      return (
        <>
          {seg([['B', 'B⁺'], ['P', 'P⁺'], ['As', 'As⁺']], p.species, (species) => set({ species }))}
          {slider('ion energy', p.keV, 1, 200, 1, 'keV', (keV) => set({ keV }))}
          <label className="gp-check">
            <input type="checkbox" checked={p.annealed} onChange={(e) => set({ annealed: e.target.checked })} /> anneal at 900–1000 °C afterwards
          </label>
        </>
      )
    case 'epitaxy':
      return (
        <>
          {seg([['cvd', 'CVD · SiH₄'], ['mbe', 'MBE · UHV']], p.epi, (epi) => set({ epi }))}
          {slider('growth time', p.epiMin, 1, p.epi === 'mbe' ? 240 : 10, 1, 'min', (epiMin) => set({ epiMin }))}
        </>
      )
    case 'metal':
      return slider('evaporated Al', p.metalNm, 100, 1000, 50, 'nm', (metalNm) => set({ metalNm }))
    default:
      return null
  }
}

/** slide 32's evaporator, drawn */
function Evaporator() {
  return (
    <svg className="chart evap" viewBox="0 0 300 120" role="img" aria-label="Thermal evaporator: a vacuum chamber with the substrates above a heated filament boat">
      <path d="M40,104 V46 A110,40 0 0 1 260,46 V104" className="evap-jar" />
      <line x1={30} x2={270} y1={104} y2={104} className="evap-base" />
      <rect x={120} y={30} width={60} height={5} className="evap-sub" />
      <text x={186} y={35} className="tick">substrates</text>
      <path d="M134,86 l8,-8 l8,8 l8,-8 l8,8" className="evap-fil" />
      <text x={172} y={86} className="tick hi">hot boat (W)</text>
      {[-14, 0, 14].map((dx) => (
        <line key={dx} x1={150 + dx * 0.4} y1={74} x2={150 + dx} y2={42} className="evap-vap" />
      ))}
      <text x={46} y={62} className="tick">metal vapour</text>
      <text x={150} y={117} className="tick" textAnchor="middle">vacuum system ↓ · power supply</text>
    </svg>
  )
}

export function ProcessLab() {
  const p = useAtlas((s) => s.proc)
  const set = useAtlas((s) => s.set)
  const setP = (q: Partial<ProcState>) => set({ proc: { ...useAtlas.getState().proc, ...q } })
  const run = useMemo(() => labRun(p), [p])
  const n = run.process.length
  const [pos, setPos] = useState(n - 1)
  const anim = useRef(0)
  // a new experiment plays from its first step
  useEffect(() => {
    cancelAnimationFrame(anim.current)
    const reduced = useAtlas.getState().reducedMotion
    if (reduced || n < 2) return setPos(n - 1)
    let s = 0
    let last = performance.now()
    const tick = (t: number) => {
      s = Math.min(n - 1, s + ((t - last) / 1000) * 2.2)
      last = t
      setPos(s)
      if (s < n - 1) anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(anim.current)
  }, [run, n])
  const model = run.process.at(pos)
  const k = Math.min(n - 1, Math.ceil(pos - 1e-6))
  const st = run.process.steps[k]
  const node = NODES.find((x) => x.op === p.op)!
  const link = FAB_LINK[p.op]
  const openFab = () => {
    if (!link) return
    const i = inverterProcess().indexOf(link.step)
    navigate(`/cmos/inverter?view=fab&step=${Math.max(0, i)}`)
  }
  return (
    <aside className="bench lab" aria-label="Process flow and lab">
      <div className="lc-row">
        <p className="eyebrow">wafer fab process flow <SourceButton refs={[T3(24)]} /></p>
      </div>
      <FlowChart op={p.op} onPick={(op) => setP({ op })} />
      <div className="lab-head">
        <h3>{node.label.join('').replace('-', '')}</h3>
        <SourceButton refs={[T3(node.slide)]} />
      </div>
      <Controls p={p} set={setP} />
      {p.op === 'wafer' ? (
        <div className="lab-links">
          <p className="lc-note">Sand to an epi-ready wafer is the first half of this chapter.</p>
          <button className="chip" onClick={() => void transition.go('sand')}>from sand →</button>
          <button className="chip" onClick={() => void transition.go('puller')}>the Czochralski puller →</button>
        </div>
      ) : p.op === 'packaging' ? (
        <div className="lab-links">
          <p className="lc-note">The finished wafer is diced into die, each bonded and packaged into a chip.</p>
          <button className="chip" onClick={() => void transition.go('die')}>a die and its bond pads →</button>
        </div>
      ) : (
        <>
          <CrossSection model={model} pitchNm={run.pitchNm} showOrigin={run.showOrigin} />
          <div className="lab-legend">
            {CROSS_LEGEND.map(([l, c]) => (
              <span key={l}><i style={{ background: c }} />{l}</span>
            ))}
            {p.op === 'implant' && <span><i className="hatch" />damage</span>}
          </div>
          <div className="lab-scrub">
            <input type="range" min={0} max={n - 1} step={0.01} value={pos} aria-label="Lab step" onChange={(e) => (cancelAnimationFrame(anim.current), setPos(+e.target.value))} />
            <span className="mono">{k + 1}/{n}</span>
          </div>
          <p className="lab-step">
            <b>{st.title}</b> · <span className="mono">{st.tool} · {st.chemistry}</span>
            <br />
            {st.note}
          </p>
          {run.profile && <ProfileChart {...run.profile} />}
          {p.op === 'metal' && <Evaporator />}
        </>
      )}
      {run.readouts.length > 0 && (
        <dl className="gp-read mono">
          {run.readouts.map((r) => (
            <div key={r.k} className="gp-pair">
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {link && (
        <button className="chip" onClick={openFab}>
          see it in the inverter fab: {link.label} →
        </button>
      )}
    </aside>
  )
}
