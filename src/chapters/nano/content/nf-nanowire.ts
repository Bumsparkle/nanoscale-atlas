import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-nanowire", title: "Nanowire", short: "Grown bottom-up",
  layer: "nanofab", parent: null, node: "nf-nanowire", sources: [T8(16)],
  tabs: ["vls"],
  what: "A GaAs nanowire standing on GaAs(111)B.",
  made: "Vapour–liquid–solid growth under a droplet.",
  does: "A quantum wire if thin enough; side-wall growth tapers it.",
})
