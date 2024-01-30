import detail from "./detail"
import wizard from "./wizard"
import actions from "./actions"
import gallery from "./gallery"
import description from "./description"

import { title } from "./title"
import { name, singular } from "./name"

import { componentsSidebar as sidebar } from "../sidebar-groups"

export default {
  kind: "applications" as const,
  name,
  singular,
  title,
  description,
  detail,
  wizard,
  actions,
  gallery,
  sidebar,
}
