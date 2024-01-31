import detail from "./detail"
import wizard from "./wizard"
import gallery from "./gallery"
import description from "./description"

import { name, singular } from "./name"
import { group as title } from "./group"

import { componentsSidebar as sidebar } from "../sidebar-groups"

export default {
  kind: "workdispatchers" as const,
  name,
  title,
  singular,
  description,
  gallery,
  detail,
  wizard,
  sidebar: sidebar(2),
}
