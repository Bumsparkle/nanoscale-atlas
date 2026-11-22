import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "tank-hf", title: "HF dip tank", short: "Dilute HF at room temperature, 1 min",
  layer: "cleanroom", parent: null, node: "tank-hf", tabs: ["wetbench"], sources: [T4(11)],
  what: "HF/H₂O, 1:10 to 1:50, room temperature, 1 min.",
  made: "Dilute hydrofluoric acid.",
  does: "Strips the chemical oxide with all its contaminants and leaves an H-passivated (or F) surface.",
})
