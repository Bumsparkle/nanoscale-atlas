import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-oxide',
  title: 'Masking oxide',
  short: 'SiO₂ used as an implant mask',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'ox' }],
  slides: [29, 30, 33, 35, 39],
  fabStep: 'nwell-ox',
  what: 'A protective layer of SiO₂ (slides 29–30).',
  made: 'Grown at 900–1200 °C with H₂O or O₂ in an oxidation furnace (slide 30). It is patterned with resist and etched with HF (slide 33).',
  does: 'Blocks dopant ions, so they only enter the silicon where it has been opened (slide 35). It is stripped with HF afterwards (slide 36).',
  beyond: [
    { text: 'Drawn 200 nm thick, a typical masking-oxide value.', source: 'Plummer, Deal & Griffin, ch. 6' },
    { text: 'Real thermal oxidation consumes silicon (about 0.44 nm of Si per nm of oxide); the slides and this model draw the Si surface flat.', source: 'Plummer, Deal & Griffin, ch. 6' },
  ],
})
