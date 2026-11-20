import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'lattice-dopant', title: 'Dopant atom', short: 'Group V gives an electron; group III a hole',
  layer: 'lattice', parent: 'lattice-cell', node: 'lattice-dopant', slides: [5, 35, 41, 43],
  what: 'An impurity atom in place of silicon. Group V (P, As): one extra electron, n-type. Group III (B, Al): one electron missing, a hole, p-type (slide 5).',
  made: 'By diffusion or ion implantation through openings in the oxide (slides 35, 41, 43).',
  does: 'Adding dopants increases conductivity (slide 5). Each donor frees about one electron (n ≈ ND); each acceptor gives about one hole (p ≈ NA) (slide 5).',
})
