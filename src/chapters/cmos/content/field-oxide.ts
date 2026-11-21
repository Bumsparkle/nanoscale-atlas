import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'field-oxide',
  title: 'Thick field oxide',
  short: 'Insulating SiO₂ between the devices and the metal',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'fox' }],
  sources: [T2(44), T2(45)],
  fabStep: 'fox',
  what: 'A thick SiO₂ layer over the whole chip. Silicon dioxide is transparent; its colour comes from thin-film interference and depends on its thickness.',
  made: 'The chip is covered with thick oxide, then etched where contact cuts are needed.',
  does: 'Insulates the aluminium wiring from the silicon and the poly everywhere except at the contact cuts.',
  beyond: [
    { text: 'Drawn 600 nm thick, a typical value for a 0.6 µm process.', source: 'Plummer, Deal & Griffin, ch. 2' },
    { text: 'The interference colour of SiO₂ on Si follows its thickness, e.g. ~100 nm looks violet, ~150 nm blue.', source: 'Plummer, Deal & Griffin, ch. 6 (oxide colour chart)' },
  ],
})
