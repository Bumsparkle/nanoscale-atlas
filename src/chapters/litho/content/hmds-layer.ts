import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "hmds-layer", title: "HMDS primer", short: "Adhesion promoter",
  layer: "litho", parent: null, node: "hmds-layer", sources: [T7(16)],
  tabs: ["resist"],
  what: "A molecular layer of hexamethyldisilazane.",
  made: "Typically spun on after the dehydration bake.",
  does: "Makes the oxide surface water-repellent so the resist sticks.",
})
