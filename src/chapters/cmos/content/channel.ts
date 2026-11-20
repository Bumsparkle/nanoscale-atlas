import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'channel', title: 'Channel', short: 'Silicon under the gate that the gate voltage inverts',
  layer: 'transistor', parent: 'cell', node: 'channel', slides: [11, 12, 13, 14],
  what: 'The silicon just under the gate oxide, between source and drain. The gate, oxide and body form a MOS capacitor (slide 11).',
  made: 'It is the body silicon the poly gate shielded from the source/drain implant (slides 40–41, 43).',
  does: 'nMOS: with the gate low, the source–body and drain–body diodes are OFF and no current flows. With the gate high, positive charge on the gate attracts negative charge and inverts the channel to n-type, so current flows from source to drain (slide 12). pMOS: reversed, ON when the gate is low (slide 13). As a switch: nMOS ON at g = 1, pMOS ON at g = 0 (slide 14).',
  beyond: [
    { text: 'The inversion layer is only a few nm thick; it is drawn 0.15λ (45 nm) thick here. The smooth turn-on between 30 % and 70 % of VDD is illustrative.', source: 'Sze & Ng, Physics of Semiconductor Devices, 3rd ed., ch. 6' },
  ],
  dive: { layer: 'oxide' },
})
