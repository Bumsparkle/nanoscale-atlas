import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "operator", title: "Operator in a bunny suit", short: "People are the main particle source",
  layer: "cleanroom", parent: null, node: "operator", tabs: ["room"], sources: [T4(6), T4(7), T4(8)],
  what: "A worker in cleanroom clothing: hood, mask, suit, overshoes and two pairs of gloves.",
  made: "Gowning (slide 8): wash, gloves, suit with mask and overshoes, vinyl over latex gloves.",
  does: "Clothing is required to keep the class. Inside: do not touch your face, no coughing or sneezing in the bay.",
  beyond: [
    { text: "A person moving sheds around 10⁶ particles ≥ 0.3 µm per minute even when gowned.", source: "Whyte, Cleanroom Technology, ch. 18" },
  ],
})
