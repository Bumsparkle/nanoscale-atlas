import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fz-zone", title: "Molten zone", short: "The floating liquid zone where impurities collect",
  layer: "puller", parent: null, node: "fz-zone", tabs: ["fz"], sources: [T3(20)],
  what: "The narrow band of molten silicon between the feed rod and the growing crystal.",
  made: "Formed by the RF coil and moved along the rod.",
  does: "Dopants and other impurities tend to stay in the liquid, so the moving zone sweeps them along: float zone can refine silicon, especially with several passes.",
})
