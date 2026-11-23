import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "cvd-wafers", title: "Wafers in the reactor", short: "The hot surface where the film grows",
  layer: "deposition", parent: null, node: "cvd-wafers", tabs: ["cvd"], sources: [T5(5), T5(23)],
  what: "The substrates being coated.",
  made: "Loaded on the susceptor or standing in a quartz boat.",
  does: "Precursors decompose on their hot surface and leave the film: e.g. polysilicon from SiH₄ at 575–650 °C and 0.2–1 torr.",
})
