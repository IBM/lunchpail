import detail from "./detail"
import wizard from "./wizard"
import actions from "./actions"
import gallery from "./gallery"
import description from "./description"
import { name, singular } from "./name"

export default {
  kind: "datasets",
  name,
  singular,
  description,
  gallery,
  detail,
  actions,
  wizard,
  isInSidebar: true,
}
