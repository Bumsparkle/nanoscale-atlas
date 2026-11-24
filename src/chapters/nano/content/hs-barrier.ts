import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "hs-barrier", title: "Barrier layers", short: "Wide band gap",
  layer: "hetero", parent: null, node: "hs-barrier", sources: [T8(9), T8(11)],
  what: "Wider-gap layers on either side of the well (AlGaAs, InAlAs, or GaAs around InGaAs).",
  made: "Grown by MBE.",
  does: "Their higher band edges form the walls of the well; in type II they hold the holes instead.",
})
