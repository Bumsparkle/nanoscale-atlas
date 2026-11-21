import { useAtlas, type BenchTab } from '../state/store'
import { evaluate, GATES, conducts, nmosOn, pmosOn, type Bit, type Gate } from '../chapters/cmos/device'
import { junction, V0 } from '../chapters/cmos/junction'
import './logic.css'

type Tab = BenchTab
const TABS: { id: Tab; label: string; slides: string }[] = [
  { id: 'inverter', label: 'Inverter', slides: '15–17' },
  { id: 'switch', label: 'Switches', slides: '14' },
  { id: 'nand', label: 'NAND', slides: '18–22' },
  { id: 'nor', label: 'NOR', slides: '23' },
  { id: 'junction', label: 'p-n junction', slides: '6–9' },
]

/* ───────────── schematic primitives (switch-level, as drawn on slide 14) ───────────── */

function Switch({ x, y0, y1, on, kind, label, input }: { x: number; y0: number; y1: number; on: boolean; kind: 'n' | 'p'; label?: string; input: string }) {
  const c = on ? 'var(--on)' : 'var(--ink-3)'
  const top = y0 + 8
  const bot = y1 - 8
  const tipX = on ? x : x + (bot - top) * 0.45
  return (
    <g className={'sw ' + (on ? 'sw-on' : 'sw-off')}>
      <line x1={x} y1={y0} x2={x} y2={top - 3} stroke={c} />
      <line x1={x} y1={y1} x2={x} y2={bot + 3} stroke={c} />
      <circle cx={x} cy={top} r={3} fill="none" stroke={c} />
      <circle cx={x} cy={bot} r={3} fill="none" stroke={c} />
      <line x1={x} y1={bot - 3} x2={tipX} y2={top + 4} stroke={c} strokeWidth={2} />
      <text x={x - 10} y={(top + bot) / 2 - 2} className="sw-t" textAnchor="end">
        {kind === 'p' ? 'p' : 'n'}MOS {input}
      </text>
      <text x={x - 10} y={(top + bot) / 2 + 11} className={'sw-s ' + (on ? 'on' : '')} textAnchor="end">
        {on ? 'ON' : 'OFF'}
      </text>
      {label && (
        <text x={x - 10} y={(top + bot) / 2 + 4} textAnchor="end" className="sw-t">
          {label}
        </text>
      )}
    </g>
  )
}

function Rails({ w, vddY, gndY }: { w: number; vddY: number; gndY: number }) {
  return (
    <>
      <line x1={w / 2 - 70} y1={vddY} x2={w / 2 + 70} y2={vddY} stroke="var(--hi)" strokeWidth={2} />
      <text x={w / 2 + 76} y={vddY + 4} className="rail hi">VDD</text>
      <line x1={w / 2 - 70} y1={gndY} x2={w / 2 + 70} y2={gndY} stroke="var(--lo)" strokeWidth={2} />
      <text x={w / 2 + 76} y={gndY + 4} className="rail">GND</text>
    </>
  )
}

/** inverter / NAND / NOR drawn as switches */
function Schematic({ gate, inputs }: { gate: Gate; inputs: Record<'A' | 'B', Bit> }) {
  const W = 300
  const y = evaluate(gate, inputs)
  const yc = y === 1 ? 'var(--hi)' : 'var(--lo)'
  const on = (k: 'n' | 'p', i: 'A' | 'B') => (k === 'n' ? nmosOn(inputs[i]) : pmosOn(inputs[i]))
  const cx = W / 2
  let body: React.ReactNode
  let outY = 0
  if (gate.name === 'INV') {
    outY = 130
    body = (
      <>
        <Switch x={cx} y0={30} y1={outY} on={on('p', 'A')} kind="p" input="A" />
        <Switch x={cx} y0={outY} y1={230} on={on('n', 'A')} kind="n" input="A" />
      </>
    )
  } else if (gate.name === 'NAND') {
    outY = 120
    body = (
      <>
        <path d={`M${cx - 50} 30 V30 M${cx - 50} ${outY} H${cx + 50}`} stroke="var(--ink-3)" />
        <Switch x={cx - 50} y0={30} y1={outY} on={on('p', 'A')} kind="p" input="A" />
        <Switch x={cx + 50} y0={30} y1={outY} on={on('p', 'B')} kind="p" input="B" />
        <line x1={cx} y1={outY} x2={cx} y2={outY + 6} stroke="var(--ink-3)" />
        <Switch x={cx} y0={outY + 6} y1={180} on={on('n', 'A')} kind="n" input="A" />
        <Switch x={cx} y0={180} y1={240} on={on('n', 'B')} kind="n" input="B" />
      </>
    )
  } else {
    outY = 150
    body = (
      <>
        <Switch x={cx} y0={30} y1={90} on={on('p', 'A')} kind="p" input="A" />
        <Switch x={cx} y0={90} y1={outY} on={on('p', 'B')} kind="p" input="B" />
        <path d={`M${cx - 50} ${outY} H${cx + 50} M${cx - 50} 240 H${cx + 50}`} stroke="var(--ink-3)" />
        <Switch x={cx - 50} y0={outY} y1={240} on={on('n', 'A')} kind="n" input="A" />
        <Switch x={cx + 50} y0={outY} y1={240} on={on('n', 'B')} kind="n" input="B" />
      </>
    )
  }
  const upOn = conducts(gate.pullUp, inputs)
  const downOn = conducts(gate.pullDown, inputs)
  return (
    <svg viewBox={`0 0 ${W} 262`} className="schem" role="img" aria-label={`${gate.name} with ${gate.inputs.map((i) => `${i}=${inputs[i]}`).join(', ')}: Y = ${y}`}>
      <Rails w={W} vddY={30} gndY={gate.name === 'INV' ? 230 : 240} />
      {/* conducting network highlight */}
      <rect x={cx - 74} y={upOn ? 26 : outY} width={148} height={upOn ? outY - 26 : (gate.name === 'INV' ? 230 : 240) - outY + 4} rx={4} className="path-hl" />
      {body}
      <circle cx={cx} cy={outY} r={4} fill={yc} />
      <line x1={cx} y1={outY} x2={W - 66} y2={outY} stroke={yc} strokeWidth={2} />
      <text x={W - 62} y={outY + 4} className="out" fill={yc}>
        Y = {y}
      </text>
      <text x={W - 62} y={outY + 18} className="rail">{downOn ? 'pull-down ON' : 'pull-up ON'}</text>
    </svg>
  )
}

function TruthTable({ gate, inputs }: { gate: Gate; inputs: Record<'A' | 'B', Bit> }) {
  // while a question is open the table would give the answer away
  const quiz = useAtlas((s) => s.quiz)
  const rows: Record<'A' | 'B', Bit>[] = gate.inputs.length === 1 ? [{ A: 0, B: 0 }, { A: 1, B: 0 }] : [{ A: 0, B: 0 }, { A: 0, B: 1 }, { A: 1, B: 0 }, { A: 1, B: 1 }]
  return (
    <table className="tt">
      <thead>
        <tr>
          {gate.inputs.map((i) => (
            <th key={i}>{i}</th>
          ))}
          <th>Y</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const cur = r.A === inputs.A && (gate.inputs.length === 1 || r.B === inputs.B)
          return (
            <tr key={`${r.A}${r.B}`} className={cur ? 'cur' : ''}>
              {gate.inputs.map((i) => (
                <td key={i}>{r[i]}</td>
              ))}
              <td>{quiz && !cur ? '?' : evaluate(gate, r)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Inputs({ names }: { names: ('A' | 'B')[] }) {
  const inputs = useAtlas((s) => s.inputs)
  const set = useAtlas((s) => s.set)
  return (
    <div className="inputs">
      {names.map((n) => {
        const k = n === 'A' ? 'a' : 'b'
        const v = inputs[k]
        return (
          <button key={n} className={'bit ' + (v ? 'hi' : '')} onClick={() => set({ inputs: { ...inputs, [k]: v ? 0 : 1 } })} aria-label={`Input ${n} = ${v}, toggle`}>
            {n} = <b>{v}</b>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────── slide 14: switch model ───────────── */
function SwitchModel() {
  const g = useAtlas((s) => s.bench.g)
  const setG = (v: Bit) => useAtlas.setState((s) => ({ bench: { ...s.bench, g: v } }))
  return (
    <div>
      <div className="inputs">
        <button className={'bit ' + (g ? 'hi' : '')} onClick={() => setG(g ? 0 : 1)}>
          g = <b>{g}</b>
        </button>
      </div>
      <svg viewBox="0 0 300 150" className="schem" role="img" aria-label={`g = ${g}: nMOS ${nmosOn(g) ? 'ON' : 'OFF'}, pMOS ${pmosOn(g) ? 'ON' : 'OFF'}`}>
        <text x={60} y={14} className="rail" textAnchor="middle">d</text>
        <Switch x={60} y0={20} y1={130} on={nmosOn(g)} kind="n" input="g" />
        <text x={60} y={146} className="rail" textAnchor="middle">s</text>
        <text x={190} y={14} className="rail" textAnchor="middle">d</text>
        <Switch x={190} y0={20} y1={130} on={pmosOn(g)} kind="p" input="g" />
        <text x={190} y={146} className="rail" textAnchor="middle">s</text>
      </svg>
      <p className="bench-note">
        The voltage at the gate controls the path from source to drain. nMOS is ON at g = 1, pMOS at g = 0. <span className="slide-ref">slide 14</span>
      </p>
    </div>
  )
}

/* ───────────── slides 6–9: p-n junction ───────────── */
function Junction() {
  const v = useAtlas((s) => s.bench.v)
  const ratio = useAtlas((s) => s.bench.ratio)
  const setV = (x: number) => useAtlas.setState((s) => ({ bench: { ...s.bench, v: x } }))
  const setRatio = (x: number) => useAtlas.setState((s) => ({ bench: { ...s.bench, ratio: x } }))
  const j = junction(v, ratio)
  const W = 300
  const cx = W / 2
  const scale = 70 // px for W at zero bias
  const xp = cx - j.Wp * scale
  const xn = cx + j.Wn * scale
  // band diagram (electron energy, eV): Ec on the n side at 0
  const Eg = 1.12
  const D = j.barrier
  const Dp = (D * j.Wp) / j.W
  const Dn = D - Dp
  const ec = (z: number) => {
    const zp = j.Wp * scale
    const zn = j.Wn * scale
    const t = z - cx
    if (t < -zp) return D
    if (t < 0) return D - Dp * ((t + zp) / zp) ** 2
    if (t < zn) return Dn * ((zn - t) / zn) ** 2
    return 0
  }
  const delta = (Eg - V0) / 2
  const eY = (e: number) => 210 - e * 52 // e in eV → px
  const xs = Array.from({ length: 61 }, (_, i) => 20 + (i * (W - 40)) / 60)
  const ecPath = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${eY(ec(x)).toFixed(1)}`).join(' ')
  const evPath = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${eY(ec(x) - Eg).toFixed(1)}`).join(' ')
  const efn = -delta
  const efp = D - Eg + delta
  const ions = (x0: number, x1: number, sign: '+' | '−') => {
    const out = []
    for (let x = x0 + 5; x < x1 - 3; x += 9) for (const y of [18, 32, 46]) out.push(<text key={`${x}${y}`} x={x} y={y + 3} className={'ion ' + (sign === '+' ? 'pos' : 'neg')}>{sign}</text>)
    return out
  }
  const regime =
    j.current === 'forward'
      ? 'Forward bias: the applied voltage drops across the depletion region and the barrier falls. A current flows.'
      : j.current === 'reverse-small'
        ? 'Reverse bias: the barrier rises and the depletion region widens. Only a small current from thermally generated pairs flows.'
        : 'Open circuit: the Fermi level is uniform through both sides; the barrier is eV₀.'
  return (
    <div>
      <label className="lc-slider">
        <span className="eyebrow">applied bias V</span>
        <input type="range" min={-3} max={0.6} step={0.01} value={v} onChange={(e) => setV(+e.target.value)} />
        <span className="mono">{v >= 0 ? '+' : ''}{v.toFixed(2)} V</span>
      </label>
      <label className="lc-slider">
        <span className="eyebrow">doping ratio Na / Nd</span>
        <input type="range" min={-1.2} max={1.2} step={0.01} value={Math.log10(ratio)} onChange={(e) => setRatio(10 ** +e.target.value)} />
        <span className="mono">{ratio.toFixed(2)}</span>
      </label>
      <svg viewBox={`0 0 ${W} 300`} className="schem junction" role="img" aria-label={`p-n junction at ${v.toFixed(2)} V: depletion width ${j.W.toFixed(2)} of zero-bias value`}>
        <rect x={20} y={8} width={cx - 20} height={48} className="p-side" />
        <rect x={cx} y={8} width={W - 20 - cx} height={48} className="n-side" />
        <rect x={xp} y={8} width={xn - xp} height={48} className="depl" />
        {ions(xp, cx, '−')}
        {ions(cx, xn, '+')}
        <line x1={cx} y1={4} x2={cx} y2={60} stroke="var(--ink-2)" strokeDasharray="3 3" />
        <text x={30} y={72} className="rail">p · holes, B⁻</text>
        <text x={W - 30} y={72} className="rail" textAnchor="end">n · electrons, As⁺</text>
        <text x={xp} y={84} className="rail" textAnchor="middle">−Wp</text>
        <text x={xn} y={84} className="rail" textAnchor="middle">Wn</text>
        {/* field: triangle, pointing from + ions to − ions (negative z) */}
        <line x1={20} y1={104} x2={W - 20} y2={104} stroke="var(--line-strong)" />
        <path d={`M20 104 L${xp} 104 L${cx} ${104 + 26 * j.E0} L${xn} 104 L${W - 20} 104`} fill="none" stroke="var(--on)" strokeWidth={1.5} />
        <text x={24} y={98} className="rail">E(z)</text>
        {/* bands */}
        <path d={ecPath} fill="none" stroke="var(--ink-0)" strokeWidth={1.5} />
        <path d={evPath} fill="none" stroke="var(--ink-0)" strokeWidth={1.5} />
        <line x1={20} y1={eY(efp)} x2={cx} y2={eY(efp)} stroke="var(--amber)" strokeDasharray="4 3" />
        <line x1={cx} y1={eY(efn)} x2={W - 20} y2={eY(efn)} stroke="var(--amber)" strokeDasharray="4 3" />
        <text x={W - 18} y={eY(0) + 4} className="rail">Ec</text>
        <text x={W - 18} y={eY(-Eg) + 4} className="rail">Ev</text>
        <text x={W - 18} y={eY(efn) + 4} className="rail hi">EFn</text>
        <text x={4} y={eY(efp) - 4} className="rail hi">EFp</text>
        <text x={cx - 30} y={eY(D) - 8} className="rail">barrier {D.toFixed(2)} eV</text>
      </svg>
      <p className="bench-note">
        {regime} N<sub>a</sub>W<sub>p</sub> = N<sub>d</sub>W<sub>n</sub>, so the lighter-doped side holds more of the depletion region. <span className="slide-ref">slides 7–9</span>
      </p>
      <p className="lc-fine mono">beyond the lecture: V₀ = 0.7 V, Eg = 1.12 eV, W ∝ √(V₀ − V) (Sze &amp; Ng, ch. 2)</p>
    </div>
  )
}

export function LogicBench() {
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  const inputs = useAtlas((s) => s.inputs)
  const tab = useAtlas((s) => s.bench.tab)
  const setTab = (t: Tab) => useAtlas.setState((s) => ({ bench: { ...s.bench, tab: t } }))
  if (layer !== 'cell' || view !== 'logic') return null
  const ins = { A: inputs.a, B: inputs.b }
  const gate = tab === 'nand' ? GATES.NAND : tab === 'nor' ? GATES.NOR : GATES.INV
  const t = TABS.find((x) => x.id === tab)!
  return (
    <aside className="bench" aria-label="Logic bench">
      <div className="bench-tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="eyebrow">
        slides {t.slides}
        {tab === 'inverter' && ' · lit on the 3D cell'}
      </p>
      {(tab === 'inverter' || tab === 'nand' || tab === 'nor') && (
        <>
          <Inputs names={gate.inputs} />
          <div className="bench-row">
            <Schematic gate={gate} inputs={ins} />
            <TruthTable gate={gate} inputs={ins} />
          </div>
          <p className="bench-note">
            {gate.name === 'INV'
              ? ins.A
                ? 'A = 1: the nMOS is ON and the pMOS is OFF, so Y is pulled to GND: Y = 0.'
                : 'A = 0: the pMOS is ON and the nMOS is OFF, so Y is pulled to VDD: Y = 1.'
              : gate.name === 'NAND'
                ? 'Series nMOS pull Y down only when A and B are both 1; either parallel pMOS pulls Y up otherwise.'
                : 'Parallel nMOS pull Y down if A or B is 1; the series pMOS pull Y up only when both are 0.'}{' '}
            <span className="slide-ref">slide {gate.name === 'INV' ? (ins.A ? 16 : 17) : gate.name === 'NOR' ? 23 : 19 + (ins.A * 2 + ins.B)}</span>
          </p>
        </>
      )}
      {tab === 'switch' && <SwitchModel />}
      {tab === 'junction' && <Junction />}
    </aside>
  )
}
