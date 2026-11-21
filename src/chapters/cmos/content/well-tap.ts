import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'well-tap',
  title: 'Well tap (n+)',
  short: 'n+ contact that ties the n-well to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 42, y: 2 }],
  sources: [T2(26), T2(27), T2(39), T2(41)],
  fabStep: 'n-implant',
  what: 'A small n+ region inside the n-well under the VDD metal.',
  made: 'Formed by the same n+ implant as the nMOS source and drain; the lecture calls it the n-well contact.',
  does: 'Ties the n-well (pMOS body) to VDD. Heavily doped so the metal makes a good contact, not a Schottky diode.',
})
