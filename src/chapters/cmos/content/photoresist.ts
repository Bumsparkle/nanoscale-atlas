import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'photoresist',
  title: 'Photoresist',
  short: 'Light-sensitive polymer stencil',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'resist' }, { key: 'resist:exposed' }],
  sources: [T2(31), T2(32), T2(34)],
  fabStep: 'n-well-spin',
  what: 'A light-sensitive organic polymer. The paler regions have been exposed.',
  made: 'Spun on, then exposed through a mask. Lithography works like a printing press.',
  does: 'It softens where exposed, so developing strips it there and leaves a stencil. The next etch or implant only acts through the openings. It is stripped with piranha before hot steps so it does not melt.',
  beyond: [{ text: 'Exposure and develop are done under yellow light, which does not expose the resist.', source: 'Plummer, Deal & Griffin, ch. 5' }],
})
