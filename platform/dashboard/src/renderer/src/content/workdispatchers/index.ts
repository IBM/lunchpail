import detail from "./detail"
import wizard from "./wizard"
import gallery from "./gallery"
import description from "./description"

import { group } from "./group"
import { name, singular } from "./name"

export default {
  kind: "workdispatchers" as const,
  name,
  singular,
  description,
  gallery,
  detail,
  wizard,
  isInSidebar: group,
  sidebarPriority: 100,
}
