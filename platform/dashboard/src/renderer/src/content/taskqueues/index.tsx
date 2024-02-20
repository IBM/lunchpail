import detail from "./detail"
import gallery from "./gallery"
import description from "./description"

import { name, singular } from "./name"
import { configurationSidebar as sidebar } from "../sidebar-groups"

const taskqueues = {
  kind: "taskqueues" as const,
  name,
  singular,
  detail,
  gallery,
  description,
  sidebar,
}

export default taskqueues
