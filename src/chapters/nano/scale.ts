/** Chapter 7 (Topic 8 slides 2–3): the nanometre scale. */
export const SCALE_OBJECTS = [
  { id: 'water', name: 'water', nm: 0.1 },
  { id: 'glucose', name: 'glucose', nm: 1 },
  { id: 'antibody', name: 'antibody', nm: 10 },
  { id: 'virus', name: 'virus', nm: 100 },
  { id: 'bacteria', name: 'bacteria', nm: 1e3 },
  { id: 'cell', name: 'cancer cell', nm: 1e4 },
  { id: 'stop', name: 'a full stop', nm: 1e6 },
  { id: 'ball', name: 'tennis ball', nm: 1e8 },
]
/** slide 3: what governs a piece of semiconductor of a given size */
export function regime(nm: number) {
  if (nm < 1) return { name: 'atom', note: 'discrete levels (~1 Å)' }
  if (nm <= 100) return { name: 'nanoscale', note: nm <= 30 ? 'quantum dot: the de Broglie wavelength (~10 nm at 300 K)' : 'size-dependent properties emerge' }
  if (nm < 1e5) return { name: 'waveguide', note: 'the wavelength of light (~1 µm)' }
  return { name: 'bulk', note: 'volume semiconductor: band structure' }
}
