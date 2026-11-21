import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'contact',
  title: 'Contacts',
  short: 'Aluminium in a contact cut, 2λ × 2λ',
  layer: 'cell',
  parent: 'cell',
  anchors: [
    { key: 'al:plug', x: 2, y: 2 },
    { key: 'al:plug', x: 6, y: 2 },
    { key: 'al:plug', x: 14, y: 2 },
    { key: 'al:plug', x: 30, y: 2 },
    { key: 'al:plug', x: 38, y: 2 },
    { key: 'al:plug', x: 42, y: 2 },
  ],
  sources: [T2(27), T2(28), T2(44), T2(45), T2(47)],
  fabStep: 'contacts-etch',
  what: 'The six contacts on the slide 27 line: substrate tap, nMOS source, nMOS drain, pMOS drain, pMOS source and well tap. Each is 2λ × 2λ, and the metal surrounds it by 1λ.',
  made: 'Contact cuts are etched through the thick field oxide; sputtered aluminium fills them.',
  does: 'Connect the metal wires down to the diffusions. They only land on heavily doped silicon, so each one is an ohmic contact, not a Schottky diode.',
})
