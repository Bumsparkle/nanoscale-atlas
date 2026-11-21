import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'channel', title: 'Channel', short: 'Silicon under the gate that the gate voltage inverts',
  layer: 'transistor', parent: 'cell', node: 'channel', sources: [T2(11), T2(12), T2(13), T2(14)],
  what: 'The silicon just under the gate oxide, between source and drain. The gate, oxide and body form a MOS capacitor.',
  made: 'It is the body silicon the poly gate shielded from the source/drain implant.',
  does: 'nMOS: with the gate low, the source–body and drain–body diodes are OFF and no current flows. With the gate high, positive charge on the gate attracts negative charge and inverts the channel to n-type, so current flows from source to drain. pMOS: reversed, ON when the gate is low. As a switch: nMOS ON at g = 1, pMOS ON at g = 0.',
  beyond: [
    { text: 'The inversion layer is only a few nm thick; it is drawn 0.15λ (45 nm) thick here. The smooth turn-on between 30 % and 70 % of VDD is illustrative.', source: 'Sze & Ng, Physics of Semiconductor Devices, 3rd ed., ch. 6' },
  ],
  dive: { layer: 'oxide' },
})
