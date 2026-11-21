import { useMemo } from 'react'
import { bandsAt, csOverC0, K0_OF, SPACING, zoneRefine } from '../../chapters/growth/physics'
import type { Interval, Model } from '../../sim/types'
import { DOPING_STOPS } from '../../scene/layers/shared'

/**
 * SVG charts for the Chapter 2 panels. All share one look: hairline axes in
 * --ink-3, data in the field's colours, amber for "you are here".
 */
const W = 300
const H = 168
const M = { l: 38, r: 10, t: 10, b: 28 }
const iw = W - M.l - M.r
const ih = H - M.t - M.b

/** Cs/C0 against fraction solidified, log scale 0.01–10 (Topic 3 slide 19) */
export function SegregationChart({ k0, frac }: { k0: number; frac: number }) {
  const x = (f: number) => M.l + f * iw
  const y = (v: number) => M.t + ((1 - Math.log10(Math.max(v, 0.01))) / 3) * ih
  const curve = (k: number) => {
    let d = ''
    for (let i = 0; i <= 95; i++) {
      const f = i / 100
      d += `${i ? 'L' : 'M'}${x(f).toFixed(1)},${y(csOverC0(k, f)).toFixed(1)}`
    }
    return d
  }
  const refs = [
    { k: K0_OF.B, name: 'B 0.8', col: '#e48a8a' },
    { k: K0_OF.P, name: 'P, As ~0.3', col: '#d98ad0' },
    { k: K0_OF.Sb, name: 'Sb 0.023', col: '#8aa6e4' },
  ]
  const here = csOverC0(k0, frac)
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cs/C0 against fraction solidified; at ${frac.toFixed(2)} Cs/C0 = ${here.toFixed(2)}`}>
      {[0.01, 0.1, 1, 10].map((v) => (
        <g key={v}>
          <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="grid" />
          <text x={M.l - 5} y={y(v) + 4} className="tick" textAnchor="end">{v}</text>
        </g>
      ))}
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => (
        <text key={f} x={x(f)} y={H - 12} className="tick" textAnchor="middle">{f}</text>
      ))}
      <text x={M.l + iw / 2} y={H - 1} className="axis" textAnchor="middle">fraction of melt solidified, M/M0</text>
      <text x={9} y={M.t + ih / 2} className="axis" textAnchor="middle" transform={`rotate(-90 9 ${M.t + ih / 2})`}>Cs / C0</text>
      {refs.map((r) => (
        <g key={r.name}>
          <path d={curve(r.k)} stroke={r.col} className="ref" />
          <text x={x(0.02)} y={y(csOverC0(r.k, 0.02)) - 4} className="tick" fill={r.col}>{r.name}</text>
        </g>
      ))}
      <path d={curve(k0)} className="cur" />
      <line x1={x(frac)} x2={x(frac)} y1={M.t} y2={M.t + ih} className="marker" />
      <circle cx={x(frac)} cy={y(here)} r={4} className="dot" />
    </svg>
  )
}

/** impurity C/C0 along a float-zone rod after n passes */
export function ZoneChart({ k, passes, pos }: { k: number; passes: number; pos: number }) {
  const prof = useMemo(() => zoneRefine(Math.min(k, 0.99), passes), [k, passes])
  const before = useMemo(() => zoneRefine(Math.min(k, 0.99), passes - 1), [k, passes])
  const x = (i: number) => M.l + (i / (prof.length - 1)) * iw
  const y = (v: number) => M.t + ((1 - Math.log10(Math.max(v, 0.01))) / 3) * ih
  const cut = Math.round(pos * (prof.length - 1))
  const d = prof.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(i <= cut ? v : before[i]).toFixed(1)}`).join('')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="impurity concentration along the rod">
      {[0.01, 0.1, 1, 10].map((v) => (
        <g key={v}>
          <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="grid" />
          <text x={M.l - 5} y={y(v) + 4} className="tick" textAnchor="end">{v}</text>
        </g>
      ))}
      <text x={M.l + iw / 2} y={H - 1} className="axis" textAnchor="middle">position along the rod (seed → top)</text>
      <text x={9} y={M.t + ih / 2} className="axis" textAnchor="middle" transform={`rotate(-90 9 ${M.t + ih / 2})`}>C / C0</text>
      <path d={d} className="cur" />
      <line x1={x(cut)} x2={x(cut)} y1={M.t} y2={M.t + ih} className="marker" />
      <text x={x(cut) + 4} y={M.t + 12} className="tick">zone</text>
    </svg>
  )
}

/** energy levels against interatomic spacing (Topic 3 slide 9) */
export function BandsChart({ r }: { r: number }) {
  const R0 = 0.8
  const R1 = 3
  const x = (v: number) => M.l + ((v - R0) / (R1 - R0)) * iw
  const E0 = -2.2
  const E1 = 2.4
  const y = (e: number) => M.t + ((E1 - e) / (E1 - E0)) * ih
  const n = 120
  const lowerTop: string[] = []
  const lowerBot: string[] = []
  const upperTop: string[] = []
  const upperBot: string[] = []
  for (let i = 0; i <= n; i++) {
    const rr = R0 + ((R1 - R0) * i) / n
    const b = bandsAt(rr)
    lowerTop.push(`${x(rr).toFixed(1)},${y(b.lower[1]).toFixed(1)}`)
    lowerBot.unshift(`${x(rr).toFixed(1)},${y(b.lower[0]).toFixed(1)}`)
    upperTop.push(`${x(rr).toFixed(1)},${y(b.upper[1]).toFixed(1)}`)
    upperBot.unshift(`${x(rr).toFixed(1)},${y(b.upper[0]).toFixed(1)}`)
  }
  const here = bandsAt(r)
  const marks = [['a', SPACING.a], ['b', SPACING.b], ['c', SPACING.c], ['d', SPACING.d]] as const
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Bands at r = ${r.toFixed(2)}a: ${here.regime}`}>
      {marks.map(([m, v]) => (
        <g key={m}>
          <line x1={x(v)} x2={x(v)} y1={M.t} y2={M.t + ih} className="grid dash" />
          <text x={x(v)} y={H - 12} className="tick" textAnchor="middle">{m}</text>
        </g>
      ))}
      <polygon points={[...lowerTop, ...lowerBot].join(' ')} className="band vb" />
      <polygon points={[...upperTop, ...upperBot].join(' ')} className="band cb" />
      {[['2p⁶', -1.2], ['2s²', -1.6], ['1s²', -2.0]].map(([l, e]) => (
        <g key={l as string}>
          <line x1={M.l} x2={W - M.r} y1={y(e as number)} y2={y(e as number)} className="level" />
          <text x={W - M.r - 2} y={y(e as number) - 3} className="tick" textAnchor="end">{l}</text>
        </g>
      ))}
      <text x={x(2.9)} y={y(1) - 4} className="tick" textAnchor="end">3p²</text>
      <text x={x(2.9)} y={y(0) - 4} className="tick" textAnchor="end">3s²</text>
      <text x={x(0.86)} y={y(here.upper[1]) + 12} className="tick">CB</text>
      <text x={x(0.86)} y={y(here.lower[0]) - 4} className="tick">VB</text>
      <line x1={x(r)} x2={x(r)} y1={M.t} y2={M.t + ih} className="marker" />
      {here.gap > 0.01 && here.regime === 'gap' && (
        <g>
          <line x1={x(r) + 6} x2={x(r) + 6} y1={y(here.upper[0])} y2={y(here.lower[1])} className="eg" />
          <text x={x(r) + 10} y={(y(here.upper[0]) + y(here.lower[1])) / 2 + 4} className="tick hi">Eg</text>
        </g>
      )}
      <text x={M.l + iw / 2} y={H - 1} className="axis" textAnchor="middle">interatomic spacing r</text>
      <text x={9} y={M.t + ih / 2} className="axis" textAnchor="middle" transform={`rotate(-90 9 ${M.t + ih / 2})`}>energy</text>
    </svg>
  )
}

/** three small band pictures: conductor, semiconductor, insulator (slide 10) */
export function SolidsStrip({ active }: { active: 'metal' | 'semiconductor' | 'insulator' | null }) {
  const items = [
    { id: 'metal', name: 'conductor', gap: -8, note: 'bands overlap' },
    { id: 'semiconductor', name: 'semiconductor', gap: 14, note: 'small gap' },
    { id: 'insulator', name: 'insulator', gap: 46, note: 'large gap' },
  ] as const
  return (
    <svg className="chart solids" viewBox="0 0 300 104" role="img" aria-label="Band pictures of a conductor, a semiconductor and an insulator">
      {items.map((it, i) => {
        const cx = 50 + i * 100
        const vbTop = 72
        const cbBot = vbTop - it.gap
        return (
          <g key={it.id} className={active === it.id ? 'on' : ''}>
            <rect x={cx - 26} y={vbTop} width={52} height={14} className="band vb" />
            <rect x={cx - 26} y={cbBot - 14} width={52} height={14} className="band cb" />
            <text x={cx} y={100} className="tick" textAnchor="middle">{it.name}</text>
            <text x={cx} y={10} className="tick" textAnchor="middle">{it.note}</text>
          </g>
        )
      })}
    </svg>
  )
}

/** colour legend for the doping colour map */
export function DopingLegend({ label = 'Cs / C0' }: { label?: string }) {
  const grad = DOPING_STOPS.map((s) => `${s.css} ${((s.x + 2) / 3) * 100}%`).join(', ')
  return (
    <div className="doplegend" aria-hidden>
      <span className="mono">{label}</span>
      <i style={{ background: `linear-gradient(90deg, ${grad})` }} />
      <span className="mono">0.01</span>
      <span className="mono">0.1</span>
      <span className="mono">1</span>
      <span className="mono">10</span>
    </div>
  )
}

/** doping profile, log C against depth (slide 30) */
export function ProfileChart({ pre, drive, background, xjPre, xjDrive }: { pre: (x: number) => number; drive: (x: number) => number; background: number; xjPre: number; xjDrive: number }) {
  const X = Math.max(0.5, xjDrive * 1.4)
  const x = (v: number) => M.l + (v / X) * iw
  const y = (c: number) => M.t + ((21.5 - Math.log10(Math.max(c, 1e14))) / 7.5) * ih
  const path = (f: (x: number) => number) => Array.from({ length: 101 }, (_, i) => `${i ? 'L' : 'M'}${x((i / 100) * X).toFixed(1)},${y(f((i / 100) * X)).toFixed(1)}`).join('')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Doping profile: junction ${xjPre.toFixed(2)} µm after predeposition, ${xjDrive.toFixed(2)} µm after drive-in`}>
      {[15, 17, 19, 21].map((e) => (
        <g key={e}>
          <line x1={M.l} x2={W - M.r} y1={y(10 ** e)} y2={y(10 ** e)} className="grid" />
          <text x={M.l - 5} y={y(10 ** e) + 4} className="tick" textAnchor="end">10{['¹⁵', '¹⁷', '¹⁹', '²¹'][(e - 15) / 2]}</text>
        </g>
      ))}
      <line x1={M.l} x2={W - M.r} y1={y(background)} y2={y(background)} className="marker" />
      <path d={path(pre)} className="ref" stroke="#d98ad0" />
      <path d={path(drive)} className="cur" />
      <text x={x(xjPre)} y={y(background) - 4} className="tick" textAnchor="middle">xj</text>
      <text x={x(xjDrive)} y={y(background) - 4} className="tick hi" textAnchor="middle">xj</text>
      <text x={W - M.r} y={M.t + 10} className="tick" textAnchor="end">predep (erfc) · drive-in (Gaussian)</text>
      <text x={M.l + iw / 2} y={H - 1} className="axis" textAnchor="middle">depth (µm)</text>
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={x(f * X)} y={H - 12} className="tick" textAnchor="middle">{(f * X).toFixed(1)}</text>
      ))}
      <text x={9} y={M.t + ih / 2} className="axis" textAnchor="middle" transform={`rotate(-90 9 ${M.t + ih / 2})`}>C (cm⁻³)</text>
    </svg>
  )
}

/** colours for the 2D cross-section, after the slide 25 legend */
const FILL: Record<string, string> = {
  'si:p': '#6b7884', 'si:nwell': '#4f7190', 'si:n+': '#8cc4e2', 'si:p+': '#c98a5a',
  ox: '#d9dee1', gox: '#e6eaec', fox: '#cdd3d6', poly: '#8d6f55', resist: '#d7932b', 'resist:exposed': '#f1cf8f', al: '#b9c2ff',
}
const keyOf = (iv: Interval) => (iv.mat === 'si' ? 'si:' + iv.dop : iv.mat === 'resist' && (iv.dose ?? 0) > 0 ? 'resist:exposed' : iv.mat)

/** a 2D cross-section of a single-row model */
export function CrossSection({ model, pitchNm, showOrigin, height = 190 }: { model: Model; pitchNm: number; showOrigin: boolean; height?: number }) {
  const cols = model.cols
  const width = 300
  let zmax = -Infinity
  let zmin = Infinity
  for (const c of cols) for (const iv of c) (zmax = Math.max(zmax, iv.z1)), (zmin = Math.min(zmin, iv.z0))
  // show the top of the wafer: at most ~4× the film stack below the surface
  const top = Math.max(zmax, 0)
  const span = Math.max(top - zmin, 1)
  const shown = Math.min(span, Math.max(top * 2.2 + 600, 1600))
  const lo = top - shown
  const zx = width / (cols.length * pitchNm)
  const zy = (height - 18) / (top - lo + shown * 0.05)
  const y = (z: number) => 8 + (top - z) * zy
  const rects: React.JSX.Element[] = []
  cols.forEach((c, i) => {
    for (const iv of c) {
      if (iv.z1 < lo) continue
      const k = keyOf(iv)
      const z0 = Math.max(iv.z0, lo)
      rects.push(<rect key={`${i}-${iv.z0}`} x={i * (width / cols.length)} width={width / cols.length + 0.4} y={y(iv.z1)} height={Math.max(0.6, y(z0) - y(iv.z1))} fill={FILL[k] ?? '#888'} />)
      if (iv.dmg) rects.push(<rect key={`d${i}-${iv.z0}`} x={i * (width / cols.length)} width={width / cols.length + 0.4} y={y(iv.z1)} height={Math.max(0.6, y(z0) - y(iv.z1))} fill="url(#dmg)" />)
      if (iv.epi && iv.z0 > lo) rects.push(<rect key={`e${i}`} x={i * (width / cols.length)} width={width / cols.length + 0.4} y={y(iv.z0) - 0.5} height={1} fill="#f2f4f3" opacity={0.5} />)
    }
  })
  // a scale bar: a round number of nm close to a quarter of the width
  const target = (cols.length * pitchNm) / 4
  const bar = [50, 100, 200, 250, 500, 1000, 2000, 5000].reduce((b, v) => (Math.abs(v - target) < Math.abs(b - target) ? v : b), 100)
  const vex = zy / zx
  return (
    <svg className="xsec" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cross-section of the wafer">
      <defs>
        <pattern id="dmg" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1d2124" strokeWidth="1.6" />
        </pattern>
      </defs>
      <g shapeRendering="crispEdges">{rects}</g>
      {showOrigin && (
        <g>
          <line x1={0} x2={width} y1={y(0)} y2={y(0)} className="origin" />
          <text x={4} y={y(0) - 3} className="tick hi">original Si surface</text>
        </g>
      )}
      <line x1={width - 8 - bar * zx} x2={width - 8} y1={height - 6} y2={height - 6} className="sbar" />
      <text x={width - 8} y={height - 9} className="tick" textAnchor="end">{bar >= 1000 ? `${bar / 1000} µm` : `${bar} nm`}{vex > 1.5 ? ` · vertical ×${vex.toFixed(vex < 10 ? 1 : 0)}` : ''}</text>
    </svg>
  )
}

export const CROSS_LEGEND: [string, string][] = [
  ['p Si', FILL['si:p']], ['n Si', FILL['si:nwell']], ['n⁺', FILL['si:n+']], ['p⁺', FILL['si:p+']], ['SiO₂', FILL.ox], ['resist', FILL.resist], ['Al', FILL.al],
]
