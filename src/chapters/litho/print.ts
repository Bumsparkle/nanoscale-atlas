import { aerialImage } from '../../sim/aerial'
import { BOUNDS, type Layout } from '../cmos/layout'
import { blurSigmaNm, resolution, SOURCE_BY_ID, type Optics, type SourceId } from './optics'

/**
 * Topic 7 meets Topic 2: print the inverter's polysilicon with a real tool.
 * The design's feature size f sets λ = f/2 (Topic 2 slide 46), so the same
 * λ-grid layout is f/2 nm per square. The tool's blur, in nm, becomes a blur
 * in λ: a smaller f (or a coarser tool) blurs the gates more.
 */
export const opticsOf = (l: { source: SourceId; NA: number; k1: number; S: number }): Optics => ({ lambdaNm: SOURCE_BY_ID[l.source].nm, NA: l.NA, k1: l.k1, S: l.S })

/** intensity at the resist under the poly mask (dark field: light everywhere except the drawn poly) */
export function polyImage(layout: Layout, o: Optics, fNm: number) {
  const sigmaLambda = blurSigmaNm(o) / (fNm / 2)
  return aerialImage(layout.poly, BOUNDS, sigmaLambda, o.S, 4, true)
}

/** does every λ square of drawn poly print (stay dark, intensity below the 0.5 threshold)? */
export function printsOk(layout: Layout, o: Optics, fNm: number) {
  const img = polyImage(layout, o, fNm)
  for (const r of layout.poly)
    for (let x = r.x0 + 0.5; x < r.x1; x++)
      for (let y = r.y0 + 0.5; y < r.y1; y++) if (img.at(x, y) >= 0.5) return false
  return true
}

/** the smallest feature size f (10 nm steps, from R) at which this tool prints the layout */
export function fitFeature(layout: Layout, o: Optics) {
  const R = resolution(o.k1, o.lambdaNm, o.NA)
  for (let f = Math.ceil(R / 10) * 10; f < R * 6; f += 10) if (printsOk(layout, o, f)) return f
  return Math.ceil((R * 6) / 10) * 10
}
