import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'pmos-drain',
  title: 'pMOS drain (p+)',
  short: 'p+ in the n-well on the output side, wired to Y',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 30, y: 2 }],
  sources: [T2(13), T2(25), T2(43)],
  fabStep: 'p-implant',
  what: 'The p+ diffusion on the output side of the pMOS gate.',
  made: 'The self-aligned p+ implant through the oxide window opened with the p+ mask.',
  does: 'Connected to Y. With A = 0 the pMOS is ON and pulls Y up to VDD, so Y = 1.',
  dive: { layer: 'transistor', device: 'pmos' },
})
