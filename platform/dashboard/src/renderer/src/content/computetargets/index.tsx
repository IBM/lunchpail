import detail from "./detail"
import wizard from "./wizard"
import actions from "./actions"
import gallery from "./gallery"
import description from "./description"
import { name, singular } from "./name"

import type ContentProvider from "../ContentProvider"

/** ComputeTarget ContentProvider */
const computetargets: ContentProvider<"computetargets"> = {
  kind: "computetargets",
  name,
  singular,
  description,
  detail,
  wizard,
  actions,
  gallery,
  sidebar: {
    priority: -10,
    badgeSuffix: "enabled",
  },
}

export default computetargets
