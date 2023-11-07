import detail from "./detail"
import wizard from "./wizard"
import gallery from "./gallery"
import description from "./description"
import { name, singular } from "./name"

export default {
  kind: "platformreposecrets",
  name,
  singular,
  description,
  gallery,
  detail,
  wizard,
  actions: undefined,
  isInSidebar: "Advanced",
}
