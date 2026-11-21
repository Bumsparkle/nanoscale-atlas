import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'nmos-source',
  title: 'nMOS source (n+)',
  short: 'Heavily doped n+ silicon, wired to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 6, y: 2 }],
  sources: [T2(11), T2(25), T2(39), T2(40), T2(41)],
  fabStep: 'n-implant',
  what: 'An n+ diffusion on the GND side of the nMOS gate.',
  made: 'Oxide over the wafer is opened with the n+ mask. The donor implant then enters the silicon on both sides of the poly gate, which blocks it: a self-aligned process. The region is still called "diffusion" even though it is implanted today.',
  does: 'Connected to GND through a contact and the GND metal. When the gate is high, electrons flow from here through the inverted channel to the drain.',
  dive: { layer: 'transistor', device: 'nmos' },
})
