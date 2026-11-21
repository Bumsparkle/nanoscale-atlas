import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'poly-gate',
  title: 'Polysilicon gate (input A)',
  short: 'One poly line crosses both transistors: the input A',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'poly', x: 20, y: 11 }],
  sources: [T2(3), T2(11), T2(25), T2(27), T2(37), T2(38), T2(40), T2(46)],
  fabStep: 'gate-poly',
  what: 'A U-shaped line of heavily doped polysilicon. Each leg is a gate, 2λ = 0.6 µm wide: that width is the feature size f. It forms both gates, so A drives the nMOS and the pMOS together.',
  made: 'CVD from silane (SiH₄) forms many small crystals, polysilicon. It is heavily doped to conduct, then patterned with the poly mask.',
  does: 'The gate of the MOS capacitor: gate, oxide and body. It also masks the source/drain implant, which makes the process self-aligned. Poly is used rather than metal because it does not melt during later processing.',
  beyond: [{ text: 'Drawn 300 nm thick, a typical value; not on the slides.', source: 'Plummer, Deal & Griffin, ch. 2' }],
  dive: { layer: 'transistor', device: 'nmos' },
})
