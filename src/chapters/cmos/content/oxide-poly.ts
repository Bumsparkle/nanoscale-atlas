import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'oxide-poly', title: 'Polysilicon grains', short: 'Crystal grains in random orientations',
  layer: 'oxide', parent: 'poly-gate', node: 'oxide-poly', sources: [T2(3), T2(37)],
  what: 'Polysilicon: grains, each a small crystal, randomly oriented to each other. Grains range from µm to nm in size, with traps and defects at the boundaries.',
  made: 'CVD from silane forms many small crystals.',
  does: 'The gate electrode, heavily doped to conduct.',
  beyond: [{ text: 'Three grains of a few nm are drawn so they fit the frame.', source: 'Illustrative' }],
})
