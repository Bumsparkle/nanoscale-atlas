import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "rah", title: "Recirculating air handlers", short: "Fans that push the room air back through the filters",
  layer: "cleanroom", parent: null, node: "rah", tabs: ["room"], sources: [T4(2), T4(6)],
  what: "The recirculating air handlers (RAH) above the HEPA filters, fed by the make-up air handler (MAH) through a mixing plenum.",
  made: "Fans and coils in the plenum above the ceiling.",
  does: "Drive the air round its loop: filters, bay, floor, service chase and back.",
})
