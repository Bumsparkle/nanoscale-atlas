import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "wafer-cassette", title: "Wafer carrier", short: "Batch carrier for wet processing",
  layer: "wafers", parent: null, node: "wafer-cassette", sources: [T3(23)],
  what: "A carrier holding a batch of wafers in slots.",
  made: "Chemically resistant plastic.",
  does: "Lowers the batch into chemical baths (slide 23), as on the wet benches of Chapter 3.",
})
