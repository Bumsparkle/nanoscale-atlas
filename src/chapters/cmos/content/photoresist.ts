import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'photoresist',
  title: 'Photoresist',
  short: 'Light-sensitive polymer stencil',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'resist' }, { key: 'resist:exposed' }],
  slides: [31, 32, 34],
  fabStep: 'n-well-spin',
  what: 'A light-sensitive organic polymer (slide 31). The paler regions have been exposed.',
  made: 'Spun on, then exposed through a mask (slides 31–32). Lithography works like a printing press (slide 24).',
  does: 'It softens where exposed, so developing strips it there and leaves a stencil (slides 31–32). The next etch or implant only acts through the openings. It is stripped with piranha before hot steps so it does not melt (slide 34).',
  beyond: [{ text: 'Exposure and develop are done under yellow light, which does not expose the resist.', source: 'Plummer, Deal & Griffin, ch. 5' }],
})
