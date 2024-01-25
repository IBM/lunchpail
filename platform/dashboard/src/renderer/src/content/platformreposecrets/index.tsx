import detail from "./detail"
import wizard from "./wizard"
import gallery from "./gallery"
import description from "./description"
import { name, singular } from "./name"

export default {
  kind: "platformreposecrets" as const,
  name,
  singular,
  description,
  gallery,
  detail,
  wizard,
  sidebar: {
    group: "Definitions",
  },
}
