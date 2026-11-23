import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "soi-handle", title: "Handle wafer", short: "The substrate the thin layer is bonded to",
  layer: "wafer", parent: null, node: "soi-handle", tabs: ["soi"], sources: [T6(29)],
  what: "A second wafer that supports the transferred layer.",
  made: "Bonded face to face with the oxidised donor wafer.",
  does: "Becomes the substrate of the SOI wafer.",
})
