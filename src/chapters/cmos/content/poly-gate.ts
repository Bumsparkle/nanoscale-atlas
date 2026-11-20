import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'poly-gate',
  title: 'Polysilicon gate (input A)',
  short: 'One poly line crosses both transistors: the input A',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'poly', x: 20, y: 11 }],
  slides: [3, 11, 25, 27, 37, 38, 40, 46],
  fabStep: 'gate-poly',
  what: 'A U-shaped line of heavily doped polysilicon. Each leg is a gate, 2λ = 0.6 µm wide: that width is the feature size f (slide 46). It forms both gates, so A drives the nMOS and the pMOS together (slides 25, 27).',
  made: 'CVD from silane (SiH₄) forms many small crystals, polysilicon (slide 37). It is heavily doped to conduct, then patterned with the poly mask (slide 38).',
  does: 'The gate of the MOS capacitor: gate, oxide and body (slide 11). It also masks the source/drain implant, which makes the process self-aligned. Poly is used rather than metal because it does not melt during later processing (slide 40).',
  beyond: [{ text: 'Drawn 300 nm thick, a typical value; not on the slides.', source: 'Plummer, Deal & Griffin, ch. 2' }],
  dive: { layer: 'transistor', device: 'nmos' },
})
