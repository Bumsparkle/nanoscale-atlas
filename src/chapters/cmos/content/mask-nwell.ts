import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-nwell', title: 'n-well mask', short: 'Where the n-well is formed; pMOS lives inside it',
  layer: 'layout', parent: 'cell', node: 'mask-nwell', slides: [27, 28, 32, 35, 47],
  what: 'The first of the six masks (slide 28): one rectangle around the pMOS and its well tap.',
  made: 'Its shape is printed into resist through the mask (slide 32); the oxide opening then lets the n-well dopant into the silicon (slides 33–35).',
  does: 'Sets the body of the pMOS. Rule: any diffusion inside the well stays 6λ from its edge, and any diffusion outside stays 6λ away (slide 47).',
  fabStep: 'n-well-expose',
})
