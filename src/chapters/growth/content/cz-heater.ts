import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-heater", title: "Carbon heater", short: "Resistive carbon heating element",
  layer: "puller", parent: null, node: "cz-heater", tabs: ["cz"], sources: [T3(16), T3(17)],
  what: "The carbon (graphite) heating element around the crucible; slide 17's schematic draws RF coils heating a graphite susceptor instead.",
  made: "Graphite: it survives the temperature and does not react with the argon atmosphere.",
  does: "Keeps the melt at its set temperature, one of the three control parameters.",
})
