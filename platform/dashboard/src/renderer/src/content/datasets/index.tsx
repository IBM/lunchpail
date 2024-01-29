import detail from "./detail"
import wizard from "./wizard"
import actions from "./actions"
import gallery from "./gallery"
import description from "./description"

import { singular } from "./name"
import { group as title } from "./group"

import { resourcesSidebar as sidebar } from "../sidebar-groups"

export default {
  kind: "datasets" as const,
  name: title,
  singular,
  description,
  gallery,
  detail,
  actions,
  wizard,
  title,
  sidebar,
}
