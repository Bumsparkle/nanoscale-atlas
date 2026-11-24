import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'inverter-instance', title: 'This inverter', short: '18.6 µm × 8.4 µm: 62λ × 28λ at λ = 0.3 µm',
  layer: 'die', parent: 'die', node: 'inverter-instance', sources: [T2(15), T2(27), T2(46)],
  what: 'One CMOS inverter: 62λ × 28λ including its rails. At λ = 0.3 µm that is 18.6 µm × 8.4 µm.',
  made: 'Six masks and the fabrication sequence of slides 29–45.',
  does: 'Y = NOT A. Zoom in to see it built.',
  beyond: [{ text: 'The λ dimensions of this layout were drawn for this app to satisfy the slide 47 rules; slide 27 itself is not dimensioned.', source: 'src/chapters/cmos/masks.ts, rules.test.ts' }],
  dive: { layer: 'cell' },
})
