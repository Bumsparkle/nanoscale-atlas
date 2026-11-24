/**
 * Chapter 6 (Topic 7 slides 15–16, 20): the resist process and e-beam lift-off.
 */
/** slide 16: the eight steps of a typical resist process */
export const RESIST_STEPS = [
  { t: 'Surface clean / dehydration bake', p: 'prepares the surface for resist' },
  { t: 'HMDS', p: 'adhesion promoter, typically spun on' },
  { t: 'Spin on resist', p: '3000–6000 rpm → ≈ 0.5 µm' },
  { t: 'Pre-bake', p: '10–30 min at 90–100 °C' },
  { t: 'Align and expose', p: 'at each site, ~150 mJ cm⁻²' },
  { t: 'Post-exposure bake', p: '10 min at 100 °C: smooths standing waves' },
  { t: 'Develop', p: '30–60 s at room temperature, spray or immersion' },
  { t: 'Post-bake', p: '10–30 min at 100–140 °C' },
]
/** spin-coated thickness (µm): ≈ 0.5 µm at 4000 rpm, ∝ 1/√ω (beyond the lecture: Meyerhofer, J. Appl. Phys. 49, 3993 (1978)) */
export const resistThickness = (rpm: number) => 0.5 * Math.sqrt(4000 / rpm)
/** fraction of the exposed resist that clears: needs the dose to reach the sensitivity (100 mJ cm⁻² for g/i-line resist) */
export const clearedFraction = (dose: number) => Math.min(1, Math.max(0, (dose - 40) / 60))

/** slide 20: e-beam lift-off */
export const LIFTOFF = ['Clean wafer', 'PMMA deposition', 'E-beam exposure', 'Development', 'Metallisation (Ti 3 nm, Au 17 nm)', 'Lift-off']
