import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { singular as applicationSingular } from "../applications/name"

export default (
  <span>
    Each <strong>{singular}</strong> is a set of workers specialized to process tasks using code from a given set of{" "}
    <Link to={hash("applications")}>
      <strong>{applicationSingular}</strong>
    </Link>
    . You may allocate more than one {singular} to a given task, and can bring them up and tear them down on the fly.
  </span>
)
