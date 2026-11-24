import { useEffect, useMemo } from 'react'
import { useAtlas } from '../../state/store'
import { layoutState, BOUNDS } from '../../chapters/cmos/layout'
import { printState } from '../../chapters/cmos/recipe'
import { fitFeature, opticsOf, polyImage, printsOk } from '../../chapters/litho/print'
import { resolution, SOURCES, type SourceId } from '../../chapters/litho/optics'
import { toScreen, type LayoutFrame } from '../layoutFrame'
import { SourceButton } from '../source/Source'
import { T2, T7 } from '../../sources'
import { Seg, Slider } from '../controls'

/**
 * Topic 7 on the Topic 2 layout: pick an exposure tool and see whether the
 * inverter's polysilicon prints. With "fit to the tool" the design's f (and
 * so λ = f/2) is the smallest that prints; otherwise f is fixed and a tool
 * too coarse for it washes the gates out. The 3D cell and its fab timeline
 * are rebuilt with the same optical exposure (printState in recipe.ts).
 */
export function usePrint() {
  const L = useAtlas((s) => s.litho)
  const ver = useAtlas((s) => s.layoutVersion)
  const o = opticsOf(L)
  const layout = layoutState.get()
  const f = useMemo(() => (L.print && L.fit ? fitFeature(layout, o) : L.fNm), [L.print, L.fit, L.fNm, o.lambdaNm, o.NA, o.k1, o.S, ver]) // eslint-disable-line react-hooks/exhaustive-deps
  const ok = useMemo(() => (L.print ? printsOk(layout, o, f) : true), [L.print, f, o.lambdaNm, o.NA, o.k1, o.S, ver]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    printState.set(L.print ? { optics: o, fNm: f } : null)
  }, [L.print, f, o.lambdaNm, o.NA, o.k1, o.S]) // eslint-disable-line react-hooks/exhaustive-deps
  return { on: L.print, o, f, ok, R: resolution(o.k1, o.lambdaNm, o.NA) }
}

/** the printed polysilicon, in 0.5λ cells, drawn over the masks */
export function PrintCells({ f }: { f: LayoutFrame }) {
  const L = useAtlas((s) => s.litho)
  const ver = useAtlas((s) => s.layoutVersion)
  const p = usePrint()
  const d = useMemo(() => {
    if (!p.on) return ''
    const img = polyImage(layoutState.get(), p.o, p.f)
    let path = ''
    const h = 0.5
    for (let x = BOUNDS.x0; x < BOUNDS.x1; x += h)
      for (let y = BOUNDS.y0; y < BOUNDS.y1; y += h) {
        if (img.at(x + h / 2, y + h / 2) >= 0.5) continue
        const [sx, sy1] = toScreen(f, x, y)
        const [sx1, sy] = toScreen(f, x + h, y + h)
        path += `M${sx.toFixed(1)},${sy.toFixed(1)}H${sx1.toFixed(1)}V${sy1.toFixed(1)}H${sx.toFixed(1)}Z`
      }
    return path
  }, [p.on, p.f, p.o.lambdaNm, p.o.NA, p.o.k1, p.o.S, ver, f.s, f.cx, f.cy]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!L.print) return null
  return <path d={d} className="printed-poly" fill="color-mix(in srgb, var(--amber) 45%, transparent)" stroke="var(--amber-ink)" strokeWidth={0.6} />
}

export function PrintBox() {
  const L = useAtlas((s) => s.litho)
  const setL = (p: Partial<typeof L>) => useAtlas.getState().set({ litho: { ...useAtlas.getState().litho, ...p } })
  const p = usePrint()
  return (
    <section className="lp-print" aria-label="Print with an exposure tool">
      <label className="gp-check">
        <input type="checkbox" checked={L.print} onChange={(e) => setL({ print: e.target.checked })} /> print the poly with a real exposure tool <SourceButton refs={[T7(9), T2(46)]} />
      </label>
      {L.print && (
        <>
          <Seg label="Source" items={SOURCES.map((s) => [s.id, `${s.name} ${s.nm}`] as [SourceId, string])} value={L.source} on={(source) => setL({ source })} />
          <Slider label="NA" value={L.NA} min={0.2} max={0.95} step={0.01} on={(NA) => setL({ NA })} fmt={(v) => v.toFixed(2)} />
          <Slider label="k₁" value={L.k1} min={0.3} max={0.9} step={0.01} on={(k1) => setL({ k1 })} fmt={(v) => v.toFixed(2)} />
          <label className="gp-check"><input type="checkbox" checked={L.fit} onChange={(e) => setL({ fit: e.target.checked })} /> design to the tool: the smallest f that prints</label>
          {!L.fit && <Slider label="design f" value={L.fNm} min={150} max={2000} step={10} unit="nm" on={(fNm) => setL({ fNm })} />}
          <dl className="gp-read mono">
            <dt>tool R = k₁λ/NA</dt><dd>{p.R.toFixed(0)} nm</dd>
            <dt>f · λ = f/2</dt><dd>{p.f} nm · {p.f / 2} nm per square</dd>
            <dt>cell size</dt><dd>{((44 * p.f) / 2 / 1000).toFixed(1)} µm wide</dd>
            <dt>poly</dt><dd className={p.ok ? '' : 'bad'}>{p.ok ? 'prints' : 'fails to print: the gates wash out'}</dd>
          </dl>
          <p className="lc-fine">Amber: where the resist stays after develop, so the poly survives. The 3D cell and its fab timeline use the same exposure. Beyond the lecture: the image is a Gaussian blur calibrated so a line R wide just reaches the resist threshold.</p>
        </>
      )}
    </section>
  )
}
