import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'cell-rows', title: 'Rows of inverter cells', short: 'The inverter layout stepped into rows',
  layer: 'die', parent: 'die', node: 'cell-rows', slides: [27, 28, 46, 48],
  what: 'The inverter mask set of slides 27–28, repeated side by side and in rows (alternate rows mirrored).',
  made: 'Drawn here from the very masks the simulator uses, in λ units (slide 46).',
  does: 'Logic is built by placing and wiring such cells. Chips are specified with a set of masks (slide 46).',
  beyond: [{ text: 'Row mirroring to share power rails is standard-cell practice.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' }],
  dive: { layer: 'cell' },
})
