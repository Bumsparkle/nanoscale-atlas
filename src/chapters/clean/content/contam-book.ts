import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "contam-book", title: "Paper notebook", short: "Paper sheds fibres: a contamination source",
  layer: "cleanroom", parent: null, node: "contam-book", tabs: ["room"], sources: [T4(6)],
  what: "An ordinary paper book brought into the bay.",
  made: "Cellulose fibres.",
  does: "Books are a potential contamination source; cleanrooms use special low-lint paper.",
})
