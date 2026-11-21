import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "quartz-sand", title: "Quartz sand (SiO₂)", short: "Silica: the raw material for all silicon",
  layer: "sand", parent: null, node: "quartz-sand", sources: [T3(15), T3(16)],
  what: "Grains of quartz, silicon dioxide. Silicon is never found free in nature; it is mined as silica.",
  made: "Quarried quartzite or high-purity sand is washed and graded before it goes to the furnace.",
  does: "Step 1 of the slide 15 refining: heated with carbon it gives metallurgical-grade silicon. The raw Si for crystal growth is purified from SiO₂ by refining, fractional distillation and CVD (slide 16).",
  beyond: [
    { text: "Quartz is about 47 % silicon by mass.", source: "CRC Handbook of Chemistry and Physics" },
  ],
  dive: { layer: "polysilicon" },
})
