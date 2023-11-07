import { Link } from "react-router-dom"
import { hash } from "@jay/renderer/navigate/kind"

import { singular } from "./name"
import { singular as taskqueuesSingular } from "../taskqueues/name"
import { singular as applicationSingular } from "../applications/name"

export default (
  <span>
    Each <strong>{singular}</strong> is a set of workers that can process tasks from a {taskqueuesSingular} using code
    from given <Link to={hash("applications")}>{applicationSingular}</Link>.
  </span>
)
