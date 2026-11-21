import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'cell-rows', title: 'Rows of inverter cells', short: 'The inverter layout stepped into rows',
  layer: 'die', parent: 'die', node: 'cell-rows', sources: [T2(27), T2(28), T2(46), T2(48)],
  what: 'The inverter mask set of slides 27–28, repeated side by side and in rows (alternate rows mirrored).',
  made: 'Drawn here from the very masks the simulator uses, in λ units.',
  does: 'Logic is built by placing and wiring such cells. Chips are specified with a set of masks.',
  beyond: [{ text: 'Row mirroring to share power rails is standard-cell practice.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' }],
  dive: { layer: 'cell' },
})
