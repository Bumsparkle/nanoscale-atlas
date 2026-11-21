import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-nwell', title: 'n-well mask', short: 'Where the n-well is formed; pMOS lives inside it',
  layer: 'layout', parent: 'cell', node: 'mask-nwell', sources: [T2(27), T2(28), T2(32), T2(35), T2(47)],
  what: 'The first of the six masks: one rectangle around the pMOS and its well tap.',
  made: 'Its shape is printed into resist through the mask; the oxide opening then lets the n-well dopant into the silicon.',
  does: 'Sets the body of the pMOS. Rule: any diffusion inside the well stays 6λ from its edge, and any diffusion outside stays 6λ away.',
  fabStep: 'n-well-expose',
})
