import detail from "./detail"
import gallery from "./gallery"
import description from "./description"
import { name, singular } from "./name"

import type ContentProvider from "../ContentProvider"

/** ComputeTarget ContentProvider */
const computetargets: ContentProvider<"computetargets"> = {
  kind: "computetargets",
  name,
  singular,
  sidebar: {
    priority: -10,
    badgeSuffix: "enabled",
  },
  description,
  gallery,
  detail,
}

export default computetargets
