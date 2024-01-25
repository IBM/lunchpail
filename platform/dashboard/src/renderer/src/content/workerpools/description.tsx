import { Link } from "react-router-dom"
import { hash } from "@jaas/renderer/navigate/kind"

import { group } from "./group"
import { name, singular } from "./name"
import { titleSingular as applicationsTitleSingular } from "@jaas/resources/applications/title"

export default (
  <span>
    Each <strong>{singular}</strong> is a set of running <strong>{group}</strong> specialized to process Tasks using a
    given{" "}
    <Link to={hash("applications")}>
      <strong>{applicationsTitleSingular}</strong>
    </Link>
    . You may allocate multiple {name} to process the tasks of a given {applicationsTitleSingular}, and can bring them
    up and tear them down as needed.
  </span>
)
