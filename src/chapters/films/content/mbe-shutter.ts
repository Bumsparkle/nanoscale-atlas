import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "mbe-shutter", title: "Cell shutters", short: "Turn each beam on and off",
  layer: "mbe", parent: null, node: "mbe-shutter", sources: [T6(19), T6(21)],
  what: "A shutter in front of each effusion cell.",
  made: "Opened and closed in a fraction of a second.",
  does: "Switching beams gives atomically sharp interfaces: alternate AlGaAs and GaAs a few monolayers at a time.",
})
