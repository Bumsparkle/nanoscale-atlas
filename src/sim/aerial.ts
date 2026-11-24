/**
 * The aerial image of a mask (Topic 7 slides 10–12): what the light looks
 * like at the resist after the projection lens has blurred the mask. Used by
 * `expose` in its optical mode; chapters/litho/optics.ts calibrates the blur.
 */
/**
 * Intensity at points of a rectangle set's image: the mask transmission
 * (1 inside `clear` rects) is rasterised at `sub` samples per unit, blurred
 * by a separable Gaussian of σ (in the same units), and sampled. Coherent
 * light blurs the amplitude and squares it (σ_amp = √2·σ); incoherent light
 * blurs the intensity; partial coherence S mixes the two.
 */
export function aerialImage(
  rects: { x0: number; y0: number; x1: number; y1: number }[],
  bounds: { x0: number; y0: number; x1: number; y1: number },
  sigma: number,
  S: number,
  sub = 4,
  /** dark-field mask: light passes everywhere except the rects */
  invert = false,
): { at: (x: number, y: number) => number } {
  const nx = Math.round((bounds.x1 - bounds.x0) * sub)
  const ny = Math.round((bounds.y1 - bounds.y0) * sub)
  const T = new Float32Array(nx * ny).fill(invert ? 1 : 0)
  for (const r of rects) {
    const i0 = Math.max(0, Math.round((r.x0 - bounds.x0) * sub))
    const i1 = Math.min(nx, Math.round((r.x1 - bounds.x0) * sub))
    const j0 = Math.max(0, Math.round((r.y0 - bounds.y0) * sub))
    const j1 = Math.min(ny, Math.round((r.y1 - bounds.y0) * sub))
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) T[j * nx + i] = invert ? 0 : 1
  }
  const blur = (src: Float32Array, s: number) => {
    const sg = s * sub
    if (sg < 0.05) return src
    const R = Math.ceil(sg * 3.5)
    const ker = new Float32Array(2 * R + 1)
    let sum = 0
    for (let k = -R; k <= R; k++) sum += ker[k + R] = Math.exp(-(k * k) / (2 * sg * sg))
    for (let k = 0; k < ker.length; k++) ker[k] /= sum
    const tmp = new Float32Array(nx * ny)
    const out = new Float32Array(nx * ny)
    // edges: the mask continues as its edge value (a large clear or dark field)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = 0
        for (let k = -R; k <= R; k++) v += ker[k + R] * src[j * nx + Math.min(nx - 1, Math.max(0, i + k))]
        tmp[j * nx + i] = v
      }
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let v = 0
        for (let k = -R; k <= R; k++) v += ker[k + R] * tmp[Math.min(ny - 1, Math.max(0, j + k)) * nx + i]
        out[j * nx + i] = v
      }
    return out
  }
  const s = Math.min(1, Math.max(0, S))
  const inc = blur(T, sigma)
  const amp = s < 1 ? blur(T, sigma * Math.SQRT2) : inc
  const I = new Float32Array(nx * ny)
  for (let k = 0; k < I.length; k++) I[k] = (1 - s) * amp[k] * amp[k] + s * inc[k]
  return {
    at(x: number, y: number) {
      const i = Math.min(nx - 1, Math.max(0, Math.floor((x - bounds.x0) * sub)))
      const j = Math.min(ny - 1, Math.max(0, Math.floor((y - bounds.y0) * sub)))
      return I[j * nx + i]
    },
  }
}

