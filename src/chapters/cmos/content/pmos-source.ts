import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'pmos-source',
  title: 'pMOS source (p+)',
  short: 'Heavily doped p+ in the n-well, wired to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 38, y: 2 }],
  sources: [T2(13), T2(25), T2(43)],
  fabStep: 'p-implant',
  what: 'A p+ diffusion inside the n-well, on the VDD side of the pMOS gate.',
  made: 'Same steps as n+, with the p+ mask and an acceptor implant; the poly gate again blocks the implant, so it is self-aligned.',
  does: 'Connected to VDD. When the gate is low, holes flow from here through the p-type channel to the drain, so the pMOS is ON.',
  dive: { layer: 'transistor', device: 'pmos' },
})
