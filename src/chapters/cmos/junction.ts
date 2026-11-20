/**
 * Abrupt p-n junction, as on slides 7–9, in normalised form.
 * Slide 8: NaWp = NdWn (charge neutrality). Slide 9: forward bias lowers the
 * barrier e(V0 − V), reverse bias raises it.
 *
 * Beyond the lecture (Sze & Ng, ch. 2): W ∝ √(V0 − V); the field is
 * triangular with peak E0 = 2(V0 − V)/W; V0 ≈ 0.7 V for silicon.
 */
export const V0 = 0.7

export interface Junction {
  /** total depletion width, relative to W at zero bias */
  W: number
  Wp: number
  Wn: number
  /** peak field, relative to zero bias */
  E0: number
  /** barrier height in eV */
  barrier: number
  /** qualitative current regime */
  current: 'forward' | 'none' | 'reverse-small'
}

/** v: applied bias (V, > 0 forward); ratio: Na / Nd */
export function junction(v: number, ratio: number): Junction {
  const drop = Math.max(0.02, V0 - v)
  const W = Math.sqrt(drop / V0)
  const Wp = (W * 1) / (1 + ratio) // NaWp = NdWn → Wp/Wn = Nd/Na
  const Wn = W - Wp
  return {
    W,
    Wp,
    Wn,
    E0: drop / V0 / W,
    barrier: drop,
    current: v > 0.05 ? 'forward' : v < -0.05 ? 'reverse-small' : 'none',
  }
}
