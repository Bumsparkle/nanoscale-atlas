/** Small controls shared by the Chapter 6 and 7 panels (same look as the Chapter 4–5 ones). */
export function Slider({ label, value, min, max, step, unit, on, fmt }: { label: string; value: number; min: number; max: number; step: number; unit?: string; on: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <label className="lc-slider">
      <span className="eyebrow">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(+e.target.value)} />
      <span className="mono">{fmt ? fmt(value) : value} {unit}</span>
    </label>
  )
}

export function Seg<T extends string | number>({ items, value, on, label }: { items: [T, string][]; value: T; on: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([v, l]) => (
        <button key={String(v)} aria-pressed={value === v} onClick={() => on(v)}>{l}</button>
      ))}
    </div>
  )
}

/** a numbered list of steps with back / next */
export function Stepper({ steps, at, set, start = 'start' }: { steps: string[]; at: number; set: (n: number) => void; start?: string }) {
  return (
    <>
      <ol className="gp-steps">
        {steps.map((t, i) => (
          <li key={i} className={i + 1 === at ? 'on' : i + 1 < at ? 'done' : ''}><span className="mono gp-n">{i + 1}</span><span>{t}</span></li>
        ))}
      </ol>
      <div className="lc-quick">
        <button className="chip" disabled={at === 0} onClick={() => set(at - 1)}>←</button>
        <button className="chip" disabled={at >= steps.length} onClick={() => set(at + 1)}>{at === 0 ? `${start} →` : 'next step →'}</button>
        {at > 0 && <button className="chip" onClick={() => set(0)}>reset</button>}
      </div>
    </>
  )
}

/** a simple SVG line chart: series of [x, y] in data units, linear or log axes */
export function Chart({ series, x, y, w = 300, h = 160, xl, yl, marks = [], label }: {
  series: { pts: [number, number][]; cls?: string; stroke?: string; dash?: boolean }[]
  x: { min: number; max: number; log?: boolean; ticks?: number[]; fmt?: (v: number) => string }
  y: { min: number; max: number; log?: boolean; ticks?: number[]; fmt?: (v: number) => string }
  w?: number
  h?: number
  xl: string
  yl?: string
  marks?: { x: number; y: number; cls?: string; text?: string }[]
  label: string
}) {
  const L = 38
  const R = w - 8
  const T = 10
  const B = h - 24
  const tx = (v: number) => (x.log ? Math.log10(v) : v)
  const ty = (v: number) => (y.log ? Math.log10(Math.max(v, 1e-30)) : v)
  const X = (v: number) => L + ((tx(v) - tx(x.min)) / (tx(x.max) - tx(x.min))) * (R - L)
  const Y = (v: number) => B - ((Math.min(ty(y.max), Math.max(ty(y.min), ty(v))) - ty(y.min)) / (ty(y.max) - ty(y.min))) * (B - T)
  const d = (pts: [number, number][]) => pts.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b)).map(([a, b], i) => `${i ? 'L' : 'M'}${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join('')
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {(y.ticks ?? []).map((v) => (
        <g key={`y${v}`}>
          <line x1={L} x2={R} y1={Y(v)} y2={Y(v)} className="grid" />
          <text x={L - 4} y={Y(v) + 4} className="tick" textAnchor="end">{y.fmt ? y.fmt(v) : v}</text>
        </g>
      ))}
      {(x.ticks ?? []).map((v) => (
        <text key={`x${v}`} x={X(v)} y={B + 12} className="tick" textAnchor="middle">{x.fmt ? x.fmt(v) : v}</text>
      ))}
      {series.map((s, i) => <path key={i} d={d(s.pts)} className={s.cls ?? 'cur'} stroke={s.stroke} strokeDasharray={s.dash ? '4 3' : undefined} fill="none" />)}
      {marks.map((m, i) => (
        <g key={i}>
          <circle cx={X(m.x)} cy={Y(m.y)} r={4} className={m.cls ?? 'dot'} />
          {m.text && <text x={X(m.x) + 6} y={Y(m.y) - 6} className="tick hi">{m.text}</text>}
        </g>
      ))}
      <text x={(L + R) / 2} y={h - 2} className="axis" textAnchor="middle">{xl}</text>
      {yl && <text x={4} y={T + 2} className="axis">{yl}</text>}
    </svg>
  )
}
