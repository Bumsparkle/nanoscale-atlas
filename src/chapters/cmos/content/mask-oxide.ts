import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-oxide',
  title: 'Masking oxide',
  short: 'SiO₂ used as an implant mask',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'ox' }],
  sources: [T2(29), T2(30), T2(33), T2(35), T2(39)],
  fabStep: 'nwell-ox',
  what: 'A protective layer of SiO₂.',
  made: 'Grown at 900–1200 °C with H₂O or O₂ in an oxidation furnace. It is patterned with resist and etched with HF.',
  does: 'Blocks dopant ions, so they only enter the silicon where it has been opened. It is stripped with HF afterwards.',
  beyond: [
    { text: 'Drawn 200 nm thick, a typical masking-oxide value.', source: 'Plummer, Deal & Griffin, ch. 6' },
    { text: 'Real thermal oxidation consumes silicon (about 0.44 nm of Si per nm of oxide); the slides and this model draw the Si surface flat.', source: 'Plummer, Deal & Griffin, ch. 6' },
  ],
})
