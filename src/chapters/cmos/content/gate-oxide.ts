import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'gate-oxide',
  title: 'Gate oxide',
  short: 'SiO₂ under the poly, < 20 Å thick (drawn ×50)',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'gox' }],
  sources: [T2(11), T2(37), T2(38)],
  fabStep: 'gate-ox',
  what: 'A very thin layer of SiO₂, under 20 Å: 6–7 atomic layers. Here it is drawn 50 times thicker so you can see it.',
  made: 'Grown or deposited after the n-well strip, before the poly. After the poly is patterned, it remains only under the poly.',
  does: 'The insulator of the MOS capacitor. SiO₂ is a very good insulator, so the gate controls the channel by its field without any current flowing into the gate.',
  beyond: [{ text: 'In this simplified flow the thin oxide lies under the whole poly U, not just the two gates, so it is one object.', source: 'Follows from the gate oxide and poly steps' }],
  dive: { layer: 'oxide' },
})
