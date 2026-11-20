import { defineContent } from '../../content-schema'

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
  slides: [27, 28, 44, 45, 47],
  fabStep: 'contacts-etch',
  what: 'The six contacts on the slide 27 line: substrate tap, nMOS source, nMOS drain, pMOS drain, pMOS source and well tap. Each is 2λ × 2λ, and the metal surrounds it by 1λ (slide 47).',
  made: 'Contact cuts are etched through the thick field oxide (slide 44); sputtered aluminium fills them (slide 45).',
  does: 'Connect the metal wires down to the diffusions. They only land on heavily doped silicon, so each one is an ohmic contact, not a Schottky diode (slide 26).',
})
