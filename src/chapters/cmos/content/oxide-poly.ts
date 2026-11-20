import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'oxide-poly', title: 'Polysilicon grains', short: 'Crystal grains in random orientations',
  layer: 'oxide', parent: 'poly-gate', node: 'oxide-poly', slides: [3, 37],
  what: 'Polysilicon: grains, each a small crystal, randomly oriented to each other. Grains range from µm to nm in size, with traps and defects at the boundaries (slide 3).',
  made: 'CVD from silane forms many small crystals (slide 37).',
  does: 'The gate electrode, heavily doped to conduct (slide 37).',
  beyond: [{ text: 'Three grains of a few nm are drawn so they fit the frame.', source: 'Illustrative' }],
})
