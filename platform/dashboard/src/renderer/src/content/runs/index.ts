import detail from "./detail"
/*import wizard from "./wizard"
import actions from "./actions"*/
import gallery from "./gallery"
import description from "./description"

import { name, singular } from "./name"

const provider: import("../ContentProvider").default<"runs"> = {
  kind: "runs",
  name,
  singular,
  description,
  detail,
  /*wizard,
  actions,*/
  gallery,
  sidebar: {
    priority: 100,
  },
}

export default provider
