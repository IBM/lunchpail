import detail from "./detail"
import wizard from "./wizard"
import actions from "./actions"
import gallery from "./gallery"
import description from "./description"

import { group } from "./group"
import { title } from "./title"
import { name, singular } from "./name"

export default {
  kind: "applications" as const,
  name,
  singular,
  title,
  description,
  gallery,
  detail,
  actions,
  wizard,
  isInSidebar: group,
  sidebarPriority: 100,
}
