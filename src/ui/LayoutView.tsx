import { useEffect, useMemo, useRef, useState } from 'react'
import { useAtlas } from '../state/store'
import { live } from '../state/store'
import { CONTENT_BY_ID } from '../chapters/cmos/content'
import { BOUNDS, layoutState, MASK_IDS, MASK_NAME, moveEdge, transistors, URL_LAYER, type MaskId, type Side } from '../chapters/cmos/layout'
import { checkLayout, checksForEdge, describe, RULE_LABEL, type EdgeRef, type RuleCheck } from '../chapters/cmos/rules'
import { LAMBDA_NM } from '../chapters/cmos/masks'
import { layoutFrame, toLayout, toScreen, LEARN_PANEL_W, type LayoutFrame } from './layoutFrame'
import { ContentBody } from './Panel'
import { sound } from './sound'
import './layout.css'
import { SourceButton } from './source/Source'
import { T2 } from '../sources'

/**
 * Layout view (slides 46–48): the six masks drawn flat on the λ grid, as on
 * the slide 27 mask-set image, with every edge and gap checked against the
 * slide 47 rules. Edit mode lets you drag edges in λ steps; the check runs
 * live and the 3D cell rebuilds from the edited masks when you leave.
 */

/** slide 25 legend, adapted for a dark drawing surface; order = drawing order (slide 27) */
const STYLE: Record<MaskId, { fill: string; stroke: string; opacity: number; pattern?: string; label: string }> = {
  nwell: { fill: '#e3e3e3', stroke: '#c9c9c9', opacity: 0.13, label: 'n-well' },
  pplus: { fill: '#6a6a6a', stroke: '#9a9a9a', opacity: 0.95, label: 'p+ diffusion' },
  nplus: { fill: '#b4b4b4', stroke: '#d4d4d4', opacity: 0.85, label: 'n+ diffusion' },
  poly: { fill: '#d9d9d9', stroke: '#ededed', opacity: 0.9, pattern: 'url(#hatch-poly)', label: 'polysilicon' },
  metal: { fill: '#dfe2ff', stroke: '#7a84ff', opacity: 0.9, pattern: 'url(#hatch-metal)', label: 'metal1' },
  contact: { fill: '#0b0c0d', stroke: '#ececec', opacity: 1, label: 'contact' },
}
const DRAW_ORDER: MaskId[] = ['nwell', 'pplus', 'nplus', 'poly', 'metal', 'contact']

type Hover = { kind: 'edge'; edge: EdgeRef } | { kind: 'check'; id: string } | { kind: 'shape'; mask: MaskId; index: number } | null

const µm = (l: number) => +((l * LAMBDA_NM) / 1000).toFixed(2)

function useViewport() {
  const [s, set] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => set({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return s
}

function edgeSegment(f: LayoutFrame, mask: MaskId, index: number, side: Side, layout = layoutState.get()) {
  const r = layout[mask][index]
  const [x0, y1] = toScreen(f, r.x0, r.y0)
  const [x1, y0] = toScreen(f, r.x1, r.y1)
  if (side === 'x0') return [x0, y0, x0, y1]
  if (side === 'x1') return [x1, y0, x1, y1]
  if (side === 'y0') return [x0, y1, x1, y1]
  return [x0, y0, x1, y0]
}

/** dimension line with ticks, like an engineering drawing */
function Dim({ f, c, tone }: { f: LayoutFrame; c: RuleCheck; tone: 'hover' | 'bad' }) {
  const [ax, ay] = toScreen(f, ...c.a)
  const [bx, by] = toScreen(f, ...c.b)
  const len = Math.hypot(bx - ax, by - ay) || 1
  const nx = (-(by - ay) / len) * 5
  const ny = ((bx - ax) / len) * 5
  return (
    <g className={'dim dim-' + tone}>
      <line x1={ax} y1={ay} x2={bx} y2={by} />
      <line x1={ax - nx} y1={ay - ny} x2={ax + nx} y2={ay + ny} />
      <line x1={bx - nx} y1={by - ny} x2={bx + nx} y2={by + ny} />
    </g>
  )
}

export function LayoutView() {
  const layer = useAtlas((s) => s.layer)
  const view = useAtlas((s) => s.view)
  const layers = useAtlas((s) => s.layoutLayers)
  const edit = useAtlas((s) => s.layoutEdit)
  const focus = useAtlas((s) => s.focus)
  const reduced = useAtlas((s) => s.reducedMotion)
  useAtlas((s) => s.layoutVersion)
  const set = useAtlas((s) => s.set)
  const { w, h } = useViewport()
  const [hover, setHover] = useState<Hover>(null)
  const [pointer, setPointer] = useState<[number, number]>([0, 0])
  const drag = useRef<{ edge: EdgeRef; last: number } | null>(null)
  const lamPx = useRef<HTMLSpanElement>(null)

  const layout = layoutState.get()
  const checks = useMemo(() => checkLayout(layout), [layout])
  const vis = useMemo(() => new Set(layers), [layers])
  // a check shows if it touches any visible layer, so every visible edge keeps its rule
  const shown = checks.filter((c) => c.edges.some((e) => vis.has(e.mask)))
  const bad = shown.filter((c) => !c.ok)
  const tight = shown.filter((c) => c.tight && !c.exact)
  const fets = transistors(layout)
  const learn = useAtlas((s) => s.mode !== 'explore')
  const quiz = useAtlas((s) => s.quiz)
  const f = layoutFrame(w, h, learn ? LEARN_PANEL_W + 16 : 0)
  const active = layer === 'cell' && view === 'layout'
  /** narrow screens: one-line callouts */
  const compact = f.s < 9

  // λ in screen pixels, from the live scale bar value, so the readout and the bar agree
  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      if (lamPx.current) lamPx.current.textContent = ((LAMBDA_NM * 1e-9) / live.metresPerPixel).toFixed(1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])

  // keep the store's version in step with edits made elsewhere (reset, tests)
  useEffect(() => layoutState.subscribe(() => set({ layoutVersion: layoutState.version() })), [set])

  if (!active) return null
  // test hook: layout λ → screen px, for scripted hovers and drags
  ;(window as unknown as { __layoutPoint: unknown }).__layoutPoint = (x: number, y: number) => toScreen(f, x, y)

  const toggle = (m: MaskId) => set({ layoutLayers: vis.has(m) ? layers.filter((x) => x !== m) : MASK_IDS.filter((x) => vis.has(x) || x === m) })

  const onMove = (e: React.PointerEvent) => {
    setPointer([e.clientX, e.clientY])
    const d = drag.current
    if (!d) return
    const [lx, ly] = toLayout(f, e.clientX, e.clientY)
    const v = d.edge.side === 'x0' || d.edge.side === 'x1' ? lx : ly
    const next = moveEdge(layoutState.get(), d.edge.mask, d.edge.index, d.edge.side, v)
    if (next !== layoutState.get()) {
      layoutState.set(next)
      const nv = next[d.edge.mask][d.edge.index][d.edge.side]
      if (nv !== d.last) sound.click(0.3)
      d.last = nv
    }
  }
  const startDrag = (edge: EdgeRef, e: React.PointerEvent) => {
    if (!edit) return
    e.preventDefault()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = { edge, last: layoutState.get()[edge.mask][edge.index][edge.side] }
  }
  const endDrag = () => (drag.current = null)

  // what is highlighted
  const hoverChecks: RuleCheck[] =
    hover?.kind === 'edge' ? checksForEdge(shown, hover.edge).sort((a, b) => a.measured - a.required - (b.measured - b.required)) : hover?.kind === 'check' ? shown.filter((c) => c.id === hover.id) : []
  const hoverEdges: EdgeRef[] = hover?.kind === 'edge' ? [hover.edge] : hoverChecks.flatMap((c) => c.edges)
  const badEdges = bad.flatMap((c) => c.edges)
  const gaps = shown.filter((c) => !c.rule.endsWith('.width') && c.rule !== 'contact.size' && Math.hypot(c.b[0] - c.a[0], c.b[1] - c.a[1]) > 0.01)

  const [gx, gy] = toScreen(f, 0, 0)
  const [bx0, by1] = toScreen(f, BOUNDS.x0, BOUNDS.y0)
  const [bx1, by0] = toScreen(f, BOUNDS.x1, BOUNDS.y1)
  const focused = focus ? CONTENT_BY_ID[focus] : null

  return (
    <>
      <div className={'layout-sheet' + (reduced ? ' instant' : '')} onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={() => !drag.current && setHover(null)}>
        <svg width={w} height={h} className={edit ? 'editing' : ''} role="img" aria-label={`Inverter layout: ${layers.map((m) => MASK_NAME[m]).join(', ')}; ${shown.length} rule checks, ${bad.length} violations`}>
          <defs>
            <pattern id="grid-minor" x={gx} y={gy} width={f.s} height={f.s} patternUnits="userSpaceOnUse">
              <path d={`M ${f.s} 0 L 0 0 0 ${f.s}`} className="grid-minor" />
            </pattern>
            <pattern id="grid-major" x={gx} y={gy} width={f.s * 4} height={f.s * 4} patternUnits="userSpaceOnUse">
              <rect width={f.s * 4} height={f.s * 4} fill="url(#grid-minor)" />
              <path d={`M ${f.s * 4} 0 L 0 0 0 ${f.s * 4}`} className="grid-major" />
            </pattern>
            <pattern id="hatch-poly" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#bdbdbd" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#f2f2f2" strokeWidth="1.6" />
            </pattern>
            <pattern id="hatch-metal" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <rect width="7" height="7" fill="rgba(223,226,255,0.14)" />
              <line x1="0" y1="0" x2="0" y2="7" stroke="rgba(122,132,255,0.75)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x={bx0} y={by0} width={bx1 - bx0} height={by1 - by0} fill="url(#grid-major)" className="grid-field" />
          {/* slide 27 section line */}
          <line x1={bx0 - 12} y1={toScreen(f, 0, 2)[1]} x2={bx1 + 12} y2={toScreen(f, 0, 2)[1]} className="section-line" />
          {bx1 + 70 < w - f.panelW && <text x={bx1 + 14} y={toScreen(f, 0, 2)[1] - 6} className="lbl dim-lbl">slide 27</text>}

          {/* masks */}
          {DRAW_ORDER.filter((m) => vis.has(m)).map((m) => (
            <g key={m} className={'mask mask-' + m}>
              {layout[m].map((r, i) => {
                const [x0, y1] = toScreen(f, r.x0, r.y0)
                const [x1, y0] = toScreen(f, r.x1, r.y1)
                const st = STYLE[m]
                const hot = hover?.kind === 'shape' && hover.mask === m && hover.index === i
                return (
                  <rect
                    key={i}
                    x={x0}
                    y={y0}
                    width={x1 - x0}
                    height={y1 - y0}
                    fill={st.pattern ?? st.fill}
                    fillOpacity={st.opacity}
                    stroke={hot ? 'var(--amber)' : st.stroke}
                    strokeWidth={hot ? 1.6 : m === 'metal' ? 1.4 : 1}
                    onPointerEnter={() => !drag.current && setHover({ kind: 'shape', mask: m, index: i })}
                    onClick={() => !edit && set({ focus: 'mask-' + m })}
                  />
                )
              })}
            </g>
          ))}

          {/* slide 27 annotations */}
          {vis.has('metal') && (
            <g className="lbl">
              <text x={toScreen(f, 2, -9)[0]} y={toScreen(f, 2, -9)[1] + 4} textAnchor="middle">GND</text>
              <text x={toScreen(f, 42, -9)[0]} y={toScreen(f, 42, -9)[1] + 4} textAnchor="middle">VDD</text>
              <text x={toScreen(f, 22, 2)[0]} y={toScreen(f, 22, 2)[1] + 4} textAnchor="middle">Y</text>
            </g>
          )}
          {vis.has('poly') && (
            <text className="lbl" x={toScreen(f, 22, 11)[0]} y={toScreen(f, 22, 11)[1] + 4} textAnchor="middle">
              A
            </text>
          )}

          {/* tight spots: rules met exactly at their minimum */}
          {tight.map((c) => {
            const [mx, my] = toScreen(f, (c.a[0] + c.b[0]) / 2, (c.a[1] + c.b[1]) / 2)
            return <circle key={'t' + c.id} cx={mx} cy={my} r={2} className="tight" />
          })}

          {/* gap hit areas (spacing, extension, surround, well margins) */}
          {gaps.map((c) => {
            const [ax, ay] = toScreen(f, ...c.a)
            const [bx, by] = toScreen(f, ...c.b)
            return <line key={'g' + c.id} x1={ax} y1={ay} x2={bx} y2={by} className="hit hit-gap" onPointerEnter={() => !drag.current && setHover({ kind: 'check', id: c.id })} />
          })}

          {/* violations */}
          {bad.map((c) => (
            <Dim key={'b' + c.id} f={f} c={c} tone="bad" />
          ))}
          {badEdges.map((e, i) => {
            const [x1, y1, x2, y2] = edgeSegment(f, e.mask, e.index, e.side, layout)
            return <line key={'be' + i} x1={x1} y1={y1} x2={x2} y2={y2} className="edge-bad" />
          })}

          {/* hovered edge(s) and their rules */}
          {hoverChecks.slice(0, 3).map((c) => (
            <Dim key={'h' + c.id} f={f} c={c} tone={c.ok ? 'hover' : 'bad'} />
          ))}
          {hoverEdges.map((e, i) => {
            const [x1, y1, x2, y2] = edgeSegment(f, e.mask, e.index, e.side, layout)
            return <line key={'he' + i} x1={x1} y1={y1} x2={x2} y2={y2} className="edge-hot" />
          })}

          {/* edge hit areas: hover shows the rule; in edit mode, drag in λ steps */}
          {MASK_IDS.filter((m) => vis.has(m)).flatMap((m) =>
            layout[m].flatMap((_, i) =>
              (['x0', 'x1', 'y0', 'y1'] as Side[]).map((side) => {
                const [x1, y1, x2, y2] = edgeSegment(f, m, i, side, layout)
                const edge = { mask: m, index: i, side }
                return (
                  <line
                    key={`${m}${i}${side}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={'hit hit-edge ' + (side[0] === 'x' ? 'ew' : 'ns')}
                    onPointerEnter={() => !drag.current && setHover({ kind: 'edge', edge })}
                    onPointerDown={(e) => startDrag(edge, e)}
                  />
                )
              }),
            ),
          )}

          {/* slide 48: minimum transistor callouts */}
          {vis.has('poly') &&
            fets.map((t, i) => {
              const [gx2, gy2] = toScreen(f, ...t.at)
              const [lx, ly] = toScreen(f, t.at[0], 15.2)
              return (
                <g key={i} className="fet" onClick={() => set({ focus: 'min-transistor' })}>
                  <polyline points={`${lx},${ly + 10} ${lx},${gy2 - 6} ${gx2},${gy2}`} />
                  <circle cx={gx2} cy={gy2} r={2.4} />
                  {compact ? (
                    <text x={lx} y={ly + 2} textAnchor="middle" className="fet-t">
                      {t.type === 'nmos' ? 'n' : 'p'} {t.W}/{t.L}λ
                    </text>
                  ) : (
                    <>
                      <text x={lx - 4} y={ly - 10} textAnchor="end" className="fet-t">
                        {t.type === 'nmos' ? 'nMOS' : 'pMOS'} W/L = {t.W}λ / {t.L}λ
                      </text>
                      <text x={lx - 4} y={ly + 4} textAnchor="end" className="fet-s">
                        {µm(t.W)} µm / {µm(t.L)} µm
                      </text>
                    </>
                  )}
                </g>
              )
            })}
        </svg>
        {hover && hover.kind !== 'shape' && hoverChecks.length > 0 && (
          <div className="rule-tip" style={{ transform: `translate(${Math.min(pointer[0] + 16, w - 360)}px, ${pointer[1] + 18}px)` }} role="status">
            {hoverChecks.slice(0, 3).map((c) => (
              <p key={c.id} className={c.ok ? (c.tight ? 'tight' : '') : 'bad'}>
                {describe(c)}
                {c.tight && !c.exact && <span className="tight-tag">at minimum</span>}
              </p>
            ))}
          </div>
        )}
        {hover?.kind === 'shape' && !quiz && (
          <div className="rule-tip" style={{ transform: `translate(${Math.min(pointer[0] + 16, w - 360)}px, ${pointer[1] + 18}px)` }}>
            <p>
              {MASK_NAME[hover.mask]} · rect {hover.index + 1} · {(() => {
                const r = layout[hover.mask][hover.index]
                return `${r.x1 - r.x0}λ × ${r.y1 - r.y0}λ`
              })()}
            </p>
          </div>
        )}
      </div>

      <aside className="layout-panel" aria-label="Layout rules">
        {focused ? (
          <>
            <header className="panel-head">
              <p className="eyebrow">{focused.layer === 'layout' ? 'layout · design rules' : focused.layer}</p>
              <h2>{focused.title}</h2>
              <button className="panel-close" onClick={() => set({ focus: null })} aria-label="Back to the rules">
                <kbd>Esc</kbd>
              </button>
            </header>
            <ContentBody c={focused} />
          </>
        ) : (
          <div className="lp-body">
            <p className="eyebrow lp-eyebrow">layout <SourceButton refs={[T2(46), T2(47), T2(48)]} /></p>
            <h2>λ design rules</h2>
            <button className="lp-readout" onClick={() => set({ focus: 'lambda' })}>
              <span>
                λ = f/2 = <b>{(LAMBDA_NM / 1000).toFixed(1)} µm</b>
              </span>
              <span>f = 0.6 µm process</span>
              <span>
                on screen 1λ = <b ref={lamPx}>–</b> px · grid 1λ, bold every 4λ
              </span>
            </button>

            <section>
              <h3>Masks</h3>
              <div className="lp-layers" role="group" aria-label="Mask layers">
                {MASK_IDS.map((m) => (
                  <button key={m} aria-pressed={vis.has(m)} onClick={() => toggle(m)} title={`${STYLE[m].label} (?layers=${URL_LAYER[m]})`}>
                    <i className={'sw sw-' + m} />
                    {MASK_NAME[m]}
                  </button>
                ))}
              </div>
              <div className="lp-row">
                <button className="chip" onClick={() => set({ layoutLayers: [...MASK_IDS] })}>all six</button>
                <button className="chip" onClick={() => set({ layoutLayers: [] })}>none</button>
              </div>
            </section>

            <section>
              <h3>Edit</h3>
              <div className="lp-row">
                <button className="chip" aria-pressed={edit} onClick={() => set({ layoutEdit: !edit })}>
                  {edit ? 'editing: drag any edge' : 'edit masks'}
                </button>
                <button className="chip" disabled={layoutState.isDefault()} onClick={() => layoutState.reset()}>
                  reset layout
                </button>
              </div>
              <p className="lp-note">
                Edges snap to 1λ. The 3D cell, the cross-sections and the fab replay rebuild from the edited masks when you leave this view.
              </p>
            </section>

            <section>
              <h3>Slide 47 check</h3>
              <p className={'lp-status ' + (bad.length ? 'bad' : 'ok')} aria-live="polite">
                {shown.length} checks · {bad.length ? `${bad.length} violation${bad.length > 1 ? 's' : ''}` : 'no violations'} · {tight.length} at the minimum <i className="tight-key" />
              </p>
              {bad.length > 0 && (
                <ul className="lp-bad">
                  {bad.slice(0, 12).map((c) => (
                    <li key={c.id}>
                      <button onPointerEnter={() => setHover({ kind: 'check', id: c.id })} onPointerLeave={() => setHover(null)} onFocus={() => setHover({ kind: 'check', id: c.id })}>
                        {describe(c)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!bad.length && <p className="lp-note">Hover any edge or gap to see the rule it satisfies. Amber dots mark rules met exactly at their minimum: the tight spots.</p>}
            </section>

            <section>
              <h3>Minimum transistor</h3>
              <table className="lp-fets">
                <thead>
                  <tr>
                    <th />
                    <th>W</th>
                    <th>L</th>
                  </tr>
                </thead>
                <tbody>
                  {fets.map((t, i) => (
                    <tr key={i}>
                      <th>{t.type === 'nmos' ? 'nMOS' : 'pMOS'}</th>
                      <td>
                        {t.W}λ · {µm(t.W)} µm
                      </td>
                      <td>
                        {t.L}λ · {µm(t.L)} µm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="lp-note">
                The slide text says Length / Width = 4λ / 2λ, "0.6 µm wide, 1.2 µm long". The drawn layout gives L = 2λ = 0.6 µm (the source–drain distance f) and W = 4λ = 1.2 µm.{' '}
                <button className="lp-link" onClick={() => set({ focus: 'min-transistor' })}>
                  more →
                </button>
              </p>
            </section>
            <p className="lp-fine mono">rules: {Object.values(RULE_LABEL).length} in the simplified rules table; metal2 and vias are not used by the inverter</p>
          </div>
        )}
      </aside>
    </>
  )
}
