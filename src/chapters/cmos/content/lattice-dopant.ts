import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'lattice-dopant', title: 'Dopant atom', short: 'Group V gives an electron; group III a hole',
  layer: 'lattice', parent: 'lattice-cell', node: 'lattice-dopant', sources: [T2(5), T2(35), T2(41), T2(43)],
  what: 'An impurity atom in place of silicon. Group V (P, As): one extra electron, n-type. Group III (B, Al): one electron missing, a hole, p-type.',
  made: 'By diffusion or ion implantation through openings in the oxide.',
  does: 'Adding dopants increases conductivity. Each donor frees about one electron (n ≈ ND); each acceptor gives about one hole (p ≈ NA).',
})
