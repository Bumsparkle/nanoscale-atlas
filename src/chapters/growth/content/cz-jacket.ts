import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-jacket", title: "Water jacket and heat shield", short: "Cooled chamber wall and radiation shield",
  layer: "puller", parent: null, node: "cz-jacket", tabs: ["cz"], sources: [T3(16)],
  what: "The puller's water-cooled outer wall and the heat shield inside it.",
  made: "Steel chamber, cooled by circulating water; argon flows through (slide 17).",
  does: "Contains the furnace and shapes the temperature around the solid–liquid interface.",
})
