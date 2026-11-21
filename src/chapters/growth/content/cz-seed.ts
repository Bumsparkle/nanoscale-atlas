import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-seed", title: "Seed crystal", short: "A single crystal that sets the orientation",
  layer: "puller", parent: null, node: "cz-seed", tabs: ["cz"], sources: [T3(16), T3(19)],
  what: "A small single crystal of silicon on the seed holder.",
  made: "Dipped into the melt, pulled into a thin neck, then widened into the shoulder (slide 16 photos).",
  does: "The melt freezes onto it atom by atom, copying its crystal orientation. The first crystal to freeze has Cs = k0·C0.",
})
